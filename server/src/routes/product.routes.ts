import { Router } from "express";
import Product from "../models/Product";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

// List with optional category / search filters
router.get("/", async (req, res) => {
  const { search, category } = req.query;
  const filter: Record<string, unknown> = {};
  if (category) filter.category = category;
  if (search) filter.$or = [{ name: new RegExp(String(search), "i") }, { sku: new RegExp(String(search), "i") }];
  const products = await Product.find(filter).populate("stock.warehouse", "name code");
  res.json(products);
});

router.get("/:id", async (req, res) => {
  const product = await Product.findById(req.params.id).populate("stock.warehouse", "name code");
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
});

router.post("/", async (req, res) => {
  const { name, sku, category, unit, reorderThreshold } = req.body;
  if (!name || !sku) return res.status(400).json({ message: "name and sku are required" });
  const product = await Product.create({ name, sku, category, unit, reorderThreshold, stock: [] });
  res.status(201).json(product);
});

router.put("/:id", async (req, res) => {
  // Stock is maintained exclusively by validated operations so the ledger stays authoritative.
  const { name, sku, category, unit, reorderThreshold } = req.body;
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { $set: { name, sku, category, unit, reorderThreshold } },
    { new: true, runValidators: true }
  );
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
});

router.delete("/:id", async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

export default router;
