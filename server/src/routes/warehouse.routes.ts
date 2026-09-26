import { Router } from "express";
import mongoose from "mongoose";
import Warehouse from "../models/Warehouse";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

function isValidObjectId(id: unknown): id is string {
  return typeof id === "string" && mongoose.Types.ObjectId.isValid(id);
}

router.get("/", async (_req, res) => {
  try {
    return res.json(await Warehouse.find());
  } catch (err: unknown) {
    console.error("[GET /warehouses]", err);
    return res.status(500).json({ message: "Failed to load warehouses." });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, code } = req.body ?? {};
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Warehouse name is required." });
    }
    if (typeof code !== "string" || !code.trim()) {
      return res.status(400).json({ message: "Warehouse code is required." });
    }
    const wh = await Warehouse.create({
      name: name.trim().slice(0, 100),
      code: code.trim().toUpperCase().slice(0, 20),
    });
    return res.status(201).json(wh);
  } catch (err: unknown) {
    console.error("[POST /warehouses]", err);
    return res.status(500).json({ message: "Failed to create warehouse." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid warehouse ID." });
    }
    await Warehouse.findByIdAndDelete(req.params.id);
    return res.status(204).send();
  } catch (err: unknown) {
    console.error("[DELETE /warehouses/:id]", err);
    return res.status(500).json({ message: "Failed to delete warehouse." });
  }
});

export default router;
