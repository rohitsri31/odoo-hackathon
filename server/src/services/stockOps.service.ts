import mongoose from "mongoose";
import Product from "../models/Product";
import StockMovement from "../models/StockMovement";
import { IStockOperation } from "../models/StockOperation";

/**
 * Applies the stock effect of a validated operation and writes one
 * StockMovement ledger row per product line. Runs inside a transaction
 * so stock + ledger never go out of sync.
 */
export async function applyOperation(op: IStockOperation) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const line of op.lines) {
        const product = await Product.findById(line.product).session(session);
        if (!product) throw new Error(`Product ${line.product} not found`);

        switch (op.type) {
          case "receipt": {
            incrementStock(product, op.toWarehouse!, line.quantity);
            await logMovement(op, line.product, line.quantity, undefined, op.toWarehouse, session);
            break;
          }
          case "delivery": {
            incrementStock(product, op.fromWarehouse!, -line.quantity);
            await logMovement(op, line.product, -line.quantity, op.fromWarehouse, undefined, session);
            break;
          }
          case "transfer": {
            incrementStock(product, op.fromWarehouse!, -line.quantity);
            incrementStock(product, op.toWarehouse!, line.quantity);
            await logMovement(op, line.product, -line.quantity, op.fromWarehouse, op.toWarehouse, session);
            // net-zero across the company; two ledger rows would double count a single
            // quantity, so one signed row referencing both warehouses is enough here.
            break;
          }
          case "adjustment": {
            const entry = product.stock.find((s) => s.warehouse.toString() === op.fromWarehouse!.toString());
            const before = entry?.quantity ?? 0;
            const delta = line.quantity - before; // line.quantity = counted qty
            incrementStock(product, op.fromWarehouse!, delta);
            await logMovement(op, line.product, delta, op.fromWarehouse, undefined, session);
            break;
          }
        }
        await product.save({ session });
      }
      op.status = "done";
      op.validatedAt = new Date();
      await op.save({ session });
    });
  } finally {
    session.endSession();
  }
}

function incrementStock(product: any, warehouseId: mongoose.Types.ObjectId, delta: number) {
  const entry = product.stock.find((s: any) => s.warehouse.toString() === warehouseId.toString());
  if (entry) {
    entry.quantity += delta;
  } else {
    product.stock.push({ warehouse: warehouseId, quantity: delta });
  }
}

async function logMovement(
  op: IStockOperation,
  product: mongoose.Types.ObjectId,
  quantityDelta: number,
  from: mongoose.Types.ObjectId | undefined,
  to: mongoose.Types.ObjectId | undefined,
  session: mongoose.ClientSession
) {
  await StockMovement.create(
    [
      {
        product,
        operation: op._id,
        operationType: op.type,
        fromWarehouse: from,
        toWarehouse: to,
        quantityDelta,
      },
    ],
    { session }
  );
}
