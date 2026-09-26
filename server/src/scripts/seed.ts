import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Product from "../models/Product";
import Warehouse from "../models/Warehouse";
import User from "../models/User";
import StockOperation from "../models/StockOperation";
import { applyOperation } from "../services/stockOps.service";

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/stocksense");
  const warehouses = await Promise.all([
    Warehouse.findOneAndUpdate({ code: "WH-CENTRAL" }, { name: "Central Warehouse", code: "WH-CENTRAL" }, { upsert: true, new: true }),
    Warehouse.findOneAndUpdate({ code: "WH-NORTH" }, { name: "North Distribution", code: "WH-NORTH" }, { upsert: true, new: true }),
  ]);
  const specs = [
    ["Industrial Motor A", "MTR-001", "Motors", "pcs", 10], ["Copper Cable 10mm", "CBL-010", "Electrical", "m", 25],
    ["Steel Bearing", "BRG-205", "Mechanical", "pcs", 12], ["Control Panel X1", "CTL-101", "Electronics", "pcs", 8],
    ["Safety Gloves", "PPE-030", "Safety", "pair", 20], ["Hydraulic Pump", "PMP-014", "Motors", "pcs", 6],
    ["LED Work Light", "LGT-008", "Electrical", "pcs", 10], ["Fastener Kit", "FST-100", "Mechanical", "box", 15],
  ] as const;
  const products = await Promise.all(specs.map(([name, sku, category, unit, reorderThreshold]) =>
    Product.findOneAndUpdate({ sku }, { $setOnInsert: { name, sku, category, unit, reorderThreshold, stock: [] } }, { upsert: true, new: true })
  ));
  const user = await User.findOneAndUpdate(
    { email: "demo@stocksense.app" },
    { $setOnInsert: { name: "StockSense Demo", email: "demo@stocksense.app", passwordHash: await bcrypt.hash("StockSense123!", 10) } },
    { upsert: true, new: true }
  );
  const existingOps = await StockOperation.countDocuments({ createdBy: user._id });
  if (existingOps === 0) {
    const [motor, cable, bearing, panel] = products;
    const create = (data: Record<string, unknown>) => StockOperation.create({ ...data, createdBy: user._id });
    // Seed stock only through the same validation path used by the app, keeping the ledger authoritative.
    const opening = await create({ type: "receipt", status: "ready", supplier: "Opening inventory", toWarehouse: warehouses[0]._id, lines: [{ product: motor._id, quantity: 32 }, { product: cable._id, quantity: 120 }, { product: bearing._id, quantity: 48 }, { product: panel._id, quantity: 16 }] });
    await applyOperation(opening);
    const transfer = await create({ type: "transfer", status: "ready", fromWarehouse: warehouses[0]._id, toWarehouse: warehouses[1]._id, lines: [{ product: motor._id, quantity: 8 }, { product: cable._id, quantity: 30 }] });
    await applyOperation(transfer);
    await create({ type: "receipt", supplier: "Northstar Components", toWarehouse: warehouses[0]._id, lines: [{ product: products[5]._id, quantity: 12 }] });
    await create({ type: "delivery", fromWarehouse: warehouses[0]._id, lines: [{ product: bearing._id, quantity: 5 }] });
    await create({ type: "transfer", fromWarehouse: warehouses[0]._id, toWarehouse: warehouses[1]._id, lines: [{ product: motor._id, quantity: 4 }] });
    await create({ type: "adjustment", fromWarehouse: warehouses[1]._id, lines: [{ product: panel._id, quantity: 2 }] });
    console.log("Seeded demo user: demo@stocksense.app / StockSense123!");
  } else {
    console.log("Demo data already exists; leaving existing operations untouched.");
  }
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error("Seed failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
