import { Schema, model, Document, Types } from "mongoose";

export type OperationType = "receipt" | "delivery" | "transfer" | "adjustment";
export type OperationStatus = "draft" | "waiting" | "ready" | "done" | "canceled";

export interface ILine {
  product: Types.ObjectId;
  quantity: number; // for adjustments: the COUNTED quantity, not delta
}

export interface IStockOperation extends Document {
  type: OperationType;
  status: OperationStatus;
  supplier?: string; // receipts
  fromWarehouse?: Types.ObjectId; // delivery / transfer / adjustment source
  toWarehouse?: Types.ObjectId; // receipt / transfer destination
  lines: ILine[];
  createdBy: Types.ObjectId;
  validatedAt?: Date;
}

const LineSchema = new Schema<ILine>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true },
  },
  { _id: false }
);

const StockOperationSchema = new Schema<IStockOperation>(
  {
    type: { type: String, enum: ["receipt", "delivery", "transfer", "adjustment"], required: true },
    status: { type: String, enum: ["draft", "waiting", "ready", "done", "canceled"], default: "draft" },
    supplier: { type: String },
    fromWarehouse: { type: Schema.Types.ObjectId, ref: "Warehouse" },
    toWarehouse: { type: Schema.Types.ObjectId, ref: "Warehouse" },
    lines: { type: [LineSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    validatedAt: { type: Date },
  },
  { timestamps: true }
);

export default model<IStockOperation>("StockOperation", StockOperationSchema);
