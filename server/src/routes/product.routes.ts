import { Router } from "express";
import mongoose from "mongoose";
import Product from "../models/Product";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

function isValidObjectId(id: unknown): id is string {
  return typeof id === "string" && mongoose.Types.ObjectId.isValid(id);
}

// ─── LIST ─────────────────────────────────────────────────────────────────────
// GET /products?search=<query>&category=<cat>
router.get("/", async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter: Record<string, unknown> = {};

    if (category && typeof category === "string") {
      filter.category = category.slice(0, 100);
    }
    if (search && typeof search === "string") {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 100);
      filter.$or = [{ name: new RegExp(safe, "i") }, { sku: new RegExp(safe, "i") }];
    }

    const products = await Product.find(filter).populate("stock.warehouse", "name code");
    return res.json(products);
  } catch (err: unknown) {
    console.error("[GET /products]", err);
    return res.status(500).json({ message: "Failed to load products." });
  }
});

// ─── GET ONE ──────────────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID." });
    }
    const product = await Product.findById(req.params.id).populate("stock.warehouse", "name code");
    if (!product) return res.status(404).json({ message: "Product not found." });
    return res.json(product);
  } catch (err: unknown) {
    console.error("[GET /products/:id]", err);
    return res.status(500).json({ message: "Failed to load product." });
  }
});

// ─── CREATE ───────────────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { name, sku, category, unit, reorderThreshold } = req.body ?? {};

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Product name is required." });
    }
    if (typeof sku !== "string" || !sku.trim()) {
      return res.status(400).json({ message: "Product SKU is required." });
    }

    const threshold = reorderThreshold !== undefined ? Number(reorderThreshold) : 0;
    if (!Number.isFinite(threshold) || threshold < 0) {
      return res.status(400).json({ message: "reorderThreshold must be a non-negative number." });
    }

    // Check SKU uniqueness
    const existing = await Product.findOne({ sku: sku.trim().toUpperCase() });
    if (existing) {
      return res.status(409).json({ message: `SKU "${sku.trim()}" is already in use.` });
    }

    const product = await Product.create({
      name: name.trim().slice(0, 200),
      sku: sku.trim().toUpperCase().slice(0, 50),
      category: typeof category === "string" ? category.trim().slice(0, 100) : "",
      unit: typeof unit === "string" ? unit.trim().slice(0, 50) : "pcs",
      reorderThreshold: threshold,
      stock: [],
    });
    return res.status(201).json(product);
  } catch (err: unknown) {
    console.error("[POST /products]", err);
    return res.status(500).json({ message: "Failed to create product." });
  }
});

// ─── UPDATE ───────────────────────────────────────────────────────────────────
// Stock is maintained exclusively by validated operations so the ledger stays
// authoritative — only metadata fields are editable here.
router.put("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID." });
    }
    const { name, sku, category, unit, reorderThreshold } = req.body ?? {};

    const update: Record<string, unknown> = {};
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ message: "Product name cannot be empty." });
      }
      update.name = name.trim().slice(0, 200);
    }
    if (sku !== undefined) {
      if (typeof sku !== "string" || !sku.trim()) {
        return res.status(400).json({ message: "SKU cannot be empty." });
      }
      update.sku = sku.trim().toUpperCase().slice(0, 50);
    }
    if (category !== undefined) update.category = String(category).trim().slice(0, 100);
    if (unit !== undefined) update.unit = String(unit).trim().slice(0, 50);
    if (reorderThreshold !== undefined) {
      const threshold = Number(reorderThreshold);
      if (!Number.isFinite(threshold) || threshold < 0) {
        return res.status(400).json({ message: "reorderThreshold must be a non-negative number." });
      }
      update.reorderThreshold = threshold;
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    ).populate("stock.warehouse", "name code");

    if (!product) return res.status(404).json({ message: "Product not found." });
    return res.json(product);
  } catch (err: unknown) {
    console.error("[PUT /products/:id]", err);
    return res.status(500).json({ message: "Failed to update product." });
  }
});

// ─── DELETE ───────────────────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID." });
    }
    await Product.findByIdAndDelete(req.params.id);
    return res.status(204).send();
  } catch (err: unknown) {
    console.error("[DELETE /products/:id]", err);
    return res.status(500).json({ message: "Failed to delete product." });
  }
});

export default router;
