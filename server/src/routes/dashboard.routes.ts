import { Router } from "express";
import Product from "../models/Product";
import StockOperation from "../models/StockOperation";
import StockMovement from "../models/StockMovement";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/kpis", async (_req, res) => {
  const products = await Product.find();
  let lowStock = 0;
  let outOfStock = 0;
  for (const p of products) {
    const total = p.stock.reduce((sum, s) => sum + s.quantity, 0);
    if (total === 0) outOfStock++;
    else if (total <= p.reorderThreshold) lowStock++;
  }

  const [pendingReceipts, pendingDeliveries, scheduledTransfers] = await Promise.all([
    StockOperation.countDocuments({ type: "receipt", status: { $in: ["draft", "waiting", "ready"] } }),
    StockOperation.countDocuments({ type: "delivery", status: { $in: ["draft", "waiting", "ready"] } }),
    StockOperation.countDocuments({ type: "transfer", status: { $in: ["draft", "waiting", "ready"] } }),
  ]);

  res.json({
    totalProducts: products.length,
    lowStock,
    outOfStock,
    pendingReceipts,
    pendingDeliveries,
    scheduledTransfers,
  });
});

// Move history / ledger view, filterable by product or warehouse
router.get("/ledger", async (req, res) => {
  const { product, warehouse } = req.query;
  const filter: Record<string, unknown> = {};
  if (product) filter.product = product;
  if (warehouse) filter.$or = [{ fromWarehouse: warehouse }, { toWarehouse: warehouse }];

  const movements = await StockMovement.find(filter)
    .populate("product", "name sku")
    .populate("fromWarehouse toWarehouse", "name code")
    .sort({ createdAt: -1 })
    .limit(200);
  res.json(movements);
});

export default router;
