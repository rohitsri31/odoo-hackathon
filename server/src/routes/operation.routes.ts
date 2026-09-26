import { Router } from "express";
import mongoose, { Types } from "mongoose";
import StockOperation, { OperationType } from "../models/StockOperation";
import Product from "../models/Product";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { applyOperation } from "../services/stockOps.service";

const router = Router();
router.use(requireAuth);

const VALID_TYPES: OperationType[] = ["receipt", "delivery", "transfer", "adjustment"];
const VALID_STATUSES = ["draft", "waiting", "ready", "canceled"];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function isValidObjectId(id: unknown): id is string {
  return typeof id === "string" && mongoose.Types.ObjectId.isValid(id);
}

function assertType(type: unknown, res: any): type is OperationType {
  if (!VALID_TYPES.includes(type as OperationType)) {
    res.status(400).json({ message: `type must be one of: ${VALID_TYPES.join(", ")}` });
    return false;
  }
  return true;
}

// ─── LIST ─────────────────────────────────────────────────────────────────────
// GET /operations?type=receipt&status=draft&warehouse=<id>
router.get("/", async (req, res) => {
  try {
    const { type, status, warehouse, category } = req.query;
    const filter: Record<string, unknown> = {};

    if (type) {
      if (!VALID_TYPES.includes(type as OperationType)) {
        return res.status(400).json({ message: `Invalid type filter: ${String(type)}` });
      }
      filter.type = type;
    }
    if (status) {
      if (!["draft", "waiting", "ready", "done", "canceled"].includes(String(status))) {
        return res.status(400).json({ message: `Invalid status filter: ${String(status)}` });
      }
      filter.status = status;
    }
    if (warehouse) {
      if (!isValidObjectId(warehouse)) {
        return res.status(400).json({ message: "Invalid warehouse ID." });
      }
      filter.$or = [{ fromWarehouse: warehouse }, { toWarehouse: warehouse }];
    }
    if (category) {
      const products = await Product.find({ category: String(category) }).select("_id");
      filter["lines.product"] = { $in: products.map((p) => p._id) };
    }

    const ops = await StockOperation.find(filter)
      .populate("lines.product", "name sku category")
      .populate("fromWarehouse toWarehouse", "name code")
      .sort({ createdAt: -1 });
    return res.json(ops);
  } catch (err: unknown) {
    console.error("[GET /operations]", err);
    return res.status(500).json({ message: "Failed to load operations." });
  }
});

// ─── GET ONE ──────────────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid operation ID." });
    }
    const op = await StockOperation.findById(req.params.id)
      .populate("lines.product", "name sku category")
      .populate("fromWarehouse toWarehouse", "name code");
    if (!op) return res.status(404).json({ message: "Operation not found." });
    return res.json(op);
  } catch (err: unknown) {
    console.error("[GET /operations/:id]", err);
    return res.status(500).json({ message: "Failed to load operation." });
  }
});

// ─── CREATE ───────────────────────────────────────────────────────────────────
// Body: { type, supplier?, fromWarehouse?, toWarehouse?, lines: [{product, quantity}] }
router.post("/", async (req: AuthRequest, res) => {
  try {
    const { type, supplier, fromWarehouse, toWarehouse, lines } = req.body ?? {};

    if (!assertType(type, res)) return;

    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ message: "At least one line is required." });
    }

    // Validate each line
    for (const [i, line] of lines.entries()) {
      if (!isValidObjectId(line?.product)) {
        return res.status(400).json({ message: `Line ${i + 1}: invalid product ID.` });
      }
      const qty = Number(line?.quantity);
      if (!Number.isFinite(qty) || qty < 0) {
        return res.status(400).json({ message: `Line ${i + 1}: quantity must be a non-negative number.` });
      }
    }

    // Warehouse presence checks
    if (type === "receipt" && !isValidObjectId(toWarehouse)) {
      return res.status(400).json({ message: "A valid toWarehouse ID is required for receipts." });
    }
    if ((type === "delivery" || type === "adjustment") && !isValidObjectId(fromWarehouse)) {
      return res.status(400).json({ message: "A valid fromWarehouse ID is required." });
    }
    if (type === "transfer") {
      if (!isValidObjectId(fromWarehouse) || !isValidObjectId(toWarehouse)) {
        return res.status(400).json({ message: "Valid fromWarehouse and toWarehouse IDs are required for transfers." });
      }
      if (fromWarehouse === toWarehouse) {
        return res.status(400).json({ message: "fromWarehouse and toWarehouse must differ for a transfer." });
      }
    }

    const op = await StockOperation.create({
      type,
      supplier: typeof supplier === "string" ? supplier.trim().slice(0, 200) : undefined,
      fromWarehouse: fromWarehouse || undefined,
      toWarehouse: toWarehouse || undefined,
      lines,
      createdBy: req.userId,
      status: "draft",
    });
    return res.status(201).json(op);
  } catch (err: unknown) {
    console.error("[POST /operations]", err);
    return res.status(500).json({ message: "Failed to create operation." });
  }
});

// ─── UPDATE ───────────────────────────────────────────────────────────────────
router.patch("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid operation ID." });
    }
    const op = await StockOperation.findById(req.params.id);
    if (!op) return res.status(404).json({ message: "Operation not found." });
    if (op.status === "done") {
      return res.status(400).json({ message: "Cannot edit a validated operation." });
    }
    if (op.status === "canceled") {
      return res.status(400).json({ message: "Cannot edit a canceled operation." });
    }

    // Only allow safe fields to be patched — never let the client overwrite status or createdBy.
    const { supplier, fromWarehouse, toWarehouse, lines } = req.body ?? {};
    if (supplier !== undefined) op.supplier = String(supplier).trim().slice(0, 200);
    if (fromWarehouse !== undefined) {
      if (!isValidObjectId(fromWarehouse)) return res.status(400).json({ message: "Invalid fromWarehouse ID." });
      op.fromWarehouse = new Types.ObjectId(fromWarehouse);
    }
    if (toWarehouse !== undefined) {
      if (!isValidObjectId(toWarehouse)) return res.status(400).json({ message: "Invalid toWarehouse ID." });
      op.toWarehouse = new Types.ObjectId(toWarehouse);
    }
    if (lines !== undefined) {
      if (!Array.isArray(lines) || lines.length === 0) {
        return res.status(400).json({ message: "lines must be a non-empty array." });
      }
      op.lines = lines;
    }

    await op.save();
    return res.json(op);
  } catch (err: unknown) {
    console.error("[PATCH /operations/:id]", err);
    return res.status(500).json({ message: "Failed to update operation." });
  }
});

// ─── STATUS TRANSITION ────────────────────────────────────────────────────────
// Moves Draft → Waiting → Ready → Canceled freely.  Validate does the stock mutation.
router.post("/:id/status", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid operation ID." });
    }
    const { status } = req.body ?? {};
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${VALID_STATUSES.join(", ")}` });
    }

    const op = await StockOperation.findById(req.params.id);
    if (!op) return res.status(404).json({ message: "Operation not found." });
    if (op.status === "done") return res.status(400).json({ message: "Already validated — cannot change status." });
    if (op.status === "canceled") return res.status(400).json({ message: "Operation is canceled." });

    op.status = status;
    await op.save();
    return res.json(op);
  } catch (err: unknown) {
    console.error("[POST /operations/:id/status]", err);
    return res.status(500).json({ message: "Failed to update status." });
  }
});

// ─── VALIDATE ─────────────────────────────────────────────────────────────────
// Stock-mutating, ledger-writing step.  Uses a Mongo transaction so stock +
// ledger never go out of sync.  The status === "done" check inside the
// transaction prevents double-validation in a concurrent race: the second
// caller will re-read the already-done status and get a 400 before any
// stock mutation happens.
router.post("/:id/validate", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid operation ID." });
    }

    const op = await StockOperation.findById(req.params.id);
    if (!op) return res.status(404).json({ message: "Operation not found." });
    if (op.status === "done") return res.status(400).json({ message: "This operation has already been validated." });
    if (op.status === "canceled") return res.status(400).json({ message: "Cannot validate a canceled operation." });

    await applyOperation(op);
    return res.json(op);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to validate operation.";
    console.error("[POST /operations/:id/validate]", err);
    // applyOperation throws domain errors (e.g. insufficient stock) which are 400.
    return res.status(400).json({ message });
  }
});

export default router;
