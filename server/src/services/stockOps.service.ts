import mongoose from "mongoose";
import Product from "../models/Product";
import StockMovement from "../models/StockMovement";
import StockOperation, { IStockOperation } from "../models/StockOperation";

/**
 * Applies the stock effect of a validated operation and writes one
 * StockMovement ledger row per product line. Runs inside a Mongo transaction
 * where supported (e.g. MongoDB Atlas replica set) so stock + ledger never go out of sync.
 *
 * Concurrent double-validation is prevented at the route layer (status === "done"
 * check before calling here), and the transaction itself provides snapshot-level
 * isolation so two concurrent callers cannot both pass the status check inside
 * the same transaction.
 */
export async function applyOperation(op: IStockOperation) {
  let session: mongoose.ClientSession | null = null;
  try {
    session = await mongoose.startSession();
    await session.withTransaction(async () => {
      await executeApply(op, session);
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes("replica set") ||
      msg.includes("Transaction numbers are only allowed") ||
      msg.includes("This MongoDB deployment does not support retryable writes")
    ) {
      console.warn("[stockOps] MongoDB transactions not supported in this environment; falling back to direct apply");
      await executeApply(op, null);
    } else {
      throw err;
    }
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}

async function executeApply(op: IStockOperation, session: mongoose.ClientSession | null) {
  // Re-read status inside the transaction/operation to guard against a race where two
  // requests both pass the pre-transaction status check.
  const query = StockOperation.findById(op._id);
  if (session) query.session(session);
  const freshOp = await query;
  if (freshOp?.status === "done") {
    throw new Error("This operation has already been validated.");
  }
  if (freshOp?.status === "canceled") {
    throw new Error("Cannot validate a canceled operation.");
  }

  for (const line of op.lines) {
    const prodQuery = Product.findById(line.product);
    if (session) prodQuery.session(session);
    const product = await prodQuery;
    if (!product) throw new Error(`Product ${line.product} not found.`);

    switch (op.type) {
      case "receipt": {
        incrementStock(product, op.toWarehouse!, line.quantity);
        await logMovement(op, line.product, line.quantity, undefined, op.toWarehouse, session);
        break;
      }
      case "delivery": {
        // Insufficient-stock guard: cannot deliver more than on hand.
        const available = getCurrentStock(product, op.fromWarehouse!);
        if (available < line.quantity) {
          throw new Error(
            `Insufficient stock for "${product.name}": ` +
              `${available} on hand, ${line.quantity} requested.`
          );
        }
        incrementStock(product, op.fromWarehouse!, -line.quantity);
        await logMovement(op, line.product, -line.quantity, op.fromWarehouse, undefined, session);
        break;
      }
      case "transfer": {
        // Insufficient-stock guard for source warehouse.
        const available = getCurrentStock(product, op.fromWarehouse!);
        if (available < line.quantity) {
          throw new Error(
            `Insufficient stock for "${product.name}" in source warehouse: ` +
              `${available} on hand, ${line.quantity} requested.`
          );
        }
        incrementStock(product, op.fromWarehouse!, -line.quantity);
        incrementStock(product, op.toWarehouse!, line.quantity);
        // One signed ledger row referencing both warehouses avoids double-counting.
        await logMovement(op, line.product, -line.quantity, op.fromWarehouse, op.toWarehouse, session);
        break;
      }
      case "adjustment": {
        const entry = product.stock.find(
          (s) => s.warehouse.toString() === op.fromWarehouse!.toString()
        );
        const before = entry?.quantity ?? 0;
        const delta = line.quantity - before; // line.quantity = counted qty
        incrementStock(product, op.fromWarehouse!, delta);
        await logMovement(op, line.product, delta, op.fromWarehouse, undefined, session);
        break;
      }
    }
    if (session) {
      await product.save({ session });
    } else {
      await product.save();
    }
  }

  op.status = "done";
  op.validatedAt = new Date();
  if (session) {
    await op.save({ session });
  } else {
    await op.save();
  }
}

function getCurrentStock(product: any, warehouseId: mongoose.Types.ObjectId): number {
  const entry = product.stock.find(
    (s: any) => s.warehouse.toString() === warehouseId.toString()
  );
  return entry?.quantity ?? 0;
}

function incrementStock(
  product: any,
  warehouseId: mongoose.Types.ObjectId,
  delta: number
) {
  const entry = product.stock.find(
    (s: any) => s.warehouse.toString() === warehouseId.toString()
  );
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
  session: mongoose.ClientSession | null
) {
  const movement = [
    {
      product,
      operation: op._id,
      operationType: op.type,
      fromWarehouse: from,
      toWarehouse: to,
      quantityDelta,
    },
  ];
  if (session) {
    await StockMovement.create(movement, { session });
  } else {
    await StockMovement.create(movement);
  }
}
