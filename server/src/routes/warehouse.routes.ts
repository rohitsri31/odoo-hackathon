import { Router } from "express";
import Warehouse from "../models/Warehouse";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (_req, res) => {
  res.json(await Warehouse.find());
});

router.post("/", async (req, res) => {
  const { name, code } = req.body;
  if (!name || !code) return res.status(400).json({ message: "name and code are required" });
  const wh = await Warehouse.create({ name, code });
  res.status(201).json(wh);
});

router.delete("/:id", async (req, res) => {
  await Warehouse.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

export default router;
