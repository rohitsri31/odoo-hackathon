import { Router } from "express";
import StockOperation, { OperationType } from "../models/StockOperation";
import Product from "../models/Product";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { applyOperation } from "../services/stockOps.service";

const router = Router();
router.use(requireAuth);

const VALID_TYPES: OperationType[] = ["receipt", "delivery", "transfer", "adjustment"];

function assertType(type: string, res: any): type is OperationType {
  if (!VALID_TYPES.includes(type as OperationType)) {
    res.status(400).json({ message: `type must be one of ${VALID_TYPES.join(", ")}` });
    return false;
  }
  return true;
}

// GET /operations?type=receipt&status=draft&warehouse=<id>
router.get("/", async (req, res) => {
  const { type, status, warehouse, category } = req.query;
  const filter: Record<string, unknown> = {};
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (warehouse) filter.$or = [{ fromWarehouse: warehouse }, { toWarehouse: warehouse }];
  if (category) {
    const products = await Product.find({ category }).select("_id");
    filter["lines.product"] = { $in: products.map((product) => product._id) };
  }
  const ops = await StockOperation.find(filter)
    .populate("lines.product", "name sku category")
    .populate("fromWarehouse toWarehouse", "name code")
    .sort({ createdAt: -1 });
  res.json(ops);
});

router.get("/:id", async (req, res) => {
  const op = await StockOperation.findById(req.params.id)
    .populate("lines.product", "name sku category")
    .populate("fromWarehouse toWarehouse", "name code");
  if (!op) return res.status(404).json({ message: "Operation not found" });
  res.json(op);
});

// Create a draft operation. Body: { type, supplier?, fromWarehouse?, toWarehouse?, lines: [{product, quantity}] }
router.post("/", async (req: AuthRequest, res) => {
  const { type, supplier, fromWarehouse, toWarehouse, lines } = req.body;
  if (!assertType(type, res)) return;
  if (!lines?.length) return res.status(400).json({ message: "At least one line is required" });

  if ((type === "receipt") && !toWarehouse) return res.status(400).json({ message: "toWarehouse required for receipts" });
  if ((type === "delivery" || type === "adjustment") && !fromWarehouse)
    return res.status(400).json({ message: "fromWarehouse required" });
  if (type === "transfer" && (!fromWarehouse || !toWarehouse))
    return res.status(400).json({ message: "fromWarehouse and toWarehouse required for transfers" });

  const op = await StockOperation.create({
    type,
    supplier,
    fromWarehouse,
    toWarehouse,
    lines,
    createdBy: req.userId,
    status: "draft",
  });
  res.status(201).json(op);
});

router.patch("/:id", async (req, res) => {
  const op = await StockOperation.findById(req.params.id);
  if (!op) return res.status(404).json({ message: "Operation not found" });
  if (op.status === "done") return res.status(400).json({ message: "Cannot edit a validated operation" });
  Object.assign(op, req.body);
  await op.save();
  res.json(op);
});

// Move through Draft -> Waiting -> Ready freely; Validate does the actual stock mutation.
router.post("/:id/status", async (req, res) => {
  const { status } = req.body; // "waiting" | "ready" | "canceled"
  const op = await StockOperation.findById(req.params.id);
  if (!op) return res.status(404).json({ message: "Operation not found" });
  if (op.status === "done") return res.status(400).json({ message: "Already validated" });
  op.status = status;
  await op.save();
  res.json(op);
});

// Validate: the stock-mutating, ledger-writing step
router.post("/:id/validate", async (req, res) => {
  const op = await StockOperation.findById(req.params.id);
  if (!op) return res.status(404).json({ message: "Operation not found" });
  if (op.status === "done") return res.status(400).json({ message: "Already validated" });
  if (op.status === "canceled") return res.status(400).json({ message: "Cannot validate a canceled operation" });

  try {
    await applyOperation(op);
    res.json(op);
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Failed to validate operation" });
  }
});

export default router;
