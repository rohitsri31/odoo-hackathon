import { Schema, model, Document, Types } from "mongoose";

export interface IStockEntry {
  warehouse: Types.ObjectId;
  quantity: number;
}

export interface IProduct extends Document {
  name: string;
  sku: string;
  category: string;
  unit: string; // e.g. "kg", "pcs"
  stock: IStockEntry[];
  reorderThreshold: number;
}

const StockEntrySchema = new Schema<IStockEntry>(
  {
    warehouse: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true },
    quantity: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    category: { type: String, default: "Uncategorized" },
    unit: { type: String, default: "pcs" },
    stock: { type: [StockEntrySchema], default: [] },
    reorderThreshold: { type: Number, default: 10 },
  },
  { timestamps: true }
);

// Helper to get total stock across all warehouses
ProductSchema.methods.totalStock = function (this: IProduct) {
  return this.stock.reduce((sum, s) => sum + s.quantity, 0);
};

export default model<IProduct>("Product", ProductSchema);
