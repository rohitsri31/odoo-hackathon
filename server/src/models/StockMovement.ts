import { Schema, model, Document, Types } from "mongoose";

export interface IStockMovement extends Document {
  product: Types.ObjectId;
  operation: Types.ObjectId;
  operationType: "receipt" | "delivery" | "transfer" | "adjustment";
  fromWarehouse?: Types.ObjectId;
  toWarehouse?: Types.ObjectId;
  quantityDelta: number; // signed change in stock
  createdAt?: Date;
}

const StockMovementSchema = new Schema<IStockMovement>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    operation: { type: Schema.Types.ObjectId, ref: "StockOperation", required: true },
    operationType: { type: String, required: true },
    fromWarehouse: { type: Schema.Types.ObjectId, ref: "Warehouse" },
    toWarehouse: { type: Schema.Types.ObjectId, ref: "Warehouse" },
    quantityDelta: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default model<IStockMovement>("StockMovement", StockMovementSchema);
