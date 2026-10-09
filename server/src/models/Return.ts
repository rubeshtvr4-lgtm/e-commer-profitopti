import mongoose, { Schema, Document } from 'mongoose';

export interface IReturnItem {
  sku: string;
  name: string;
  quantity: number;
  unitCostSnapshot: number; // in paise
}

export interface IReturn extends Document {
  ownerId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  returnedItems: IReturnItem[];
  returnReason: string;
  refundAmount: number;        // in paise (merchandise refund)
  shippingRefundAmount: number;// in paise (if shipping was refunded to customer)
  reverseShippingCost: number; // in paise (charged by courier)
  inventoryRecoveryStatus: 'pending_inspection' | 'restocked' | 'damaged_written_off';
  returnedCondition: 'resalable' | 'damaged' | 'missing_parts' | 'unopened';
  status: 'requested' | 'approved' | 'received' | 'completed' | 'rejected';
  returnDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReturnItemSchema = new Schema<IReturnItem>(
  {
    sku: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitCostSnapshot: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const ReturnSchema = new Schema<IReturn>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    returnedItems: { type: [ReturnItemSchema], required: true },
    returnReason: { type: String, required: true, trim: true },
    refundAmount: { type: Number, default: 0, min: 0 },
    shippingRefundAmount: { type: Number, default: 0, min: 0 },
    reverseShippingCost: { type: Number, default: 0, min: 0 },
    inventoryRecoveryStatus: {
      type: String,
      enum: ['pending_inspection', 'restocked', 'damaged_written_off'],
      default: 'pending_inspection',
      index: true,
    },
    returnedCondition: {
      type: String,
      enum: ['resalable', 'damaged', 'missing_parts', 'unopened'],
      default: 'resalable',
    },
    status: {
      type: String,
      enum: ['requested', 'approved', 'received', 'completed', 'rejected'],
      default: 'received',
      index: true,
    },
    returnDate: { type: Date, default: Date.now, index: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

ReturnSchema.index({ ownerId: 1, orderId: 1 });
ReturnSchema.index({ ownerId: 1, returnDate: -1 });

export const Return = mongoose.model<IReturn>('Return', ReturnSchema);
