import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  productId?: mongoose.Types.ObjectId;
  nameSnapshot: string;
  skuSnapshot: string;
  quantity: number;
  unitSalePrice: number;     // in paise
  unitCostSnapshot: number;  // in paise
}

export interface ICustomer {
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
}

export interface IOrder extends Document {
  ownerId: mongoose.Types.ObjectId;
  orderNumber: string;
  channel: 'Instagram' | 'Shopify' | 'website' | 'marketplace' | 'WhatsApp' | 'other';
  orderDate: Date;
  customer?: ICustomer;
  items: IOrderItem[];
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  paymentStatus: 'pending' | 'paid' | 'cod' | 'refunded';
  shippingCost: number;              // in paise (seller-paid shipping)
  shippingChargedToCustomer: number; // in paise
  discountAmount: number;            // in paise
  taxAmount: number;                 // in paise
  advertisingCost: number;           // in paise (ad cost allocated to order)
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    nameSnapshot: { type: String, required: true },
    skuSnapshot: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitSalePrice: { type: Number, required: true, min: 0 },
    unitCostSnapshot: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderNumber: { type: String, required: true, trim: true },
    channel: {
      type: String,
      enum: ['Instagram', 'Shopify', 'website', 'marketplace', 'WhatsApp', 'other'],
      default: 'website',
    },
    orderDate: { type: Date, default: Date.now, index: true },
    customer: CustomerSchema,
    items: { type: [OrderItemSchema], required: true, default: [] },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'cod', 'refunded'],
      default: 'pending',
    },
    shippingCost: { type: Number, default: 0, min: 0 },
    shippingChargedToCustomer: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    advertisingCost: { type: Number, default: 0, min: 0 },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

// Indexes
OrderSchema.index({ ownerId: 1, orderNumber: 1 }, { unique: true });
OrderSchema.index({ ownerId: 1, orderDate: -1 });
OrderSchema.index({ ownerId: 1, status: 1 });
OrderSchema.index({ ownerId: 1, channel: 1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
