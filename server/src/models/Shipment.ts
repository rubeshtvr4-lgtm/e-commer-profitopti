import mongoose, { Schema, Document } from 'mongoose';

export interface IShipment extends Document {
  ownerId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  courier: string;
  trackingNumber: string;
  shippingCost: number;        // in paise
  reverseShippingCost: number; // in paise
  shipmentStatus:
    | 'manifested'
    | 'picked_up'
    | 'in_transit'
    | 'out_for_delivery'
    | 'delivered'
    | 'rto_initiated'
    | 'rto_delivered'
    | 'failed';
  dispatchDate?: Date;
  deliveryDate?: Date;
  weightGrams?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ShipmentSchema = new Schema<IShipment>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    courier: { type: String, required: true, trim: true },
    trackingNumber: { type: String, required: true, trim: true },
    shippingCost: { type: Number, default: 0, min: 0 },
    reverseShippingCost: { type: Number, default: 0, min: 0 },
    shipmentStatus: {
      type: String,
      enum: [
        'manifested',
        'picked_up',
        'in_transit',
        'out_for_delivery',
        'delivered',
        'rto_initiated',
        'rto_delivered',
        'failed',
      ],
      default: 'manifested',
      index: true,
    },
    dispatchDate: { type: Date },
    deliveryDate: { type: Date },
    weightGrams: { type: Number, min: 0 },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

ShipmentSchema.index({ ownerId: 1, trackingNumber: 1 });
ShipmentSchema.index({ ownerId: 1, orderId: 1 });
ShipmentSchema.index({ ownerId: 1, courier: 1 });

export const Shipment = mongoose.model<IShipment>('Shipment', ShipmentSchema);
