import { Router } from "express";
import mongoose from "mongoose";
import Product from "../models/Product";
import StockOperation from "../models/StockOperation";
import StockMovement from "../models/StockMovement";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

function isValidObjectId(id: unknown): id is string {
  return typeof id === "string" && mongoose.Types.ObjectId.isValid(id);
}

// ─── KPIs ─────────────────────────────────────────────────────────────────────
router.get("/kpis", async (_req, res) => {
  try {
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

    return res.json({
      totalProducts: products.length,
      lowStock,
      outOfStock,
      pendingReceipts,
      pendingDeliveries,
      scheduledTransfers,
    });
  } catch (err: unknown) {
    console.error("[GET /dashboard/kpis]", err);
    return res.status(500).json({ message: "Failed to load dashboard KPIs." });
  }
});

// ─── LEDGER ───────────────────────────────────────────────────────────────────
// Move history / audit trail, filterable by product or warehouse.
router.get("/ledger", async (req, res) => {
  try {
    const { product, warehouse } = req.query;
    const filter: Record<string, unknown> = {};

    if (product) {
      if (!isValidObjectId(product)) {
        return res.status(400).json({ message: "Invalid product ID." });
      }
      filter.product = product;
    }
    if (warehouse) {
      if (!isValidObjectId(warehouse)) {
        return res.status(400).json({ message: "Invalid warehouse ID." });
      }
      filter.$or = [{ fromWarehouse: warehouse }, { toWarehouse: warehouse }];
    }

    const movements = await StockMovement.find(filter)
      .populate("product", "name sku")
      .populate("fromWarehouse toWarehouse", "name code")
      .sort({ createdAt: -1 })
      .limit(200);
    return res.json(movements);
  } catch (err: unknown) {
    console.error("[GET /dashboard/ledger]", err);
    return res.status(500).json({ message: "Failed to load ledger." });
  }
});

export default router;
