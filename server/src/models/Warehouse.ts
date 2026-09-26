import { Schema, model, Document } from "mongoose";

export interface IWarehouse extends Document {
  name: string;
  code: string;
}

const WarehouseSchema = new Schema<IWarehouse>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export default model<IWarehouse>("Warehouse", WarehouseSchema);
