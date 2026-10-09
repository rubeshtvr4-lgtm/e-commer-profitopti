import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  SKU: string;
  category: string;
  sellingPrice: number; // in paise
  unitCost: number;     // in paise
  stockQuantity: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    SKU: { type: String, required: true, trim: true, uppercase: true },
    category: { type: String, default: 'General', trim: true },
    sellingPrice: { type: Number, required: true, min: 0 },
    unitCost: { type: Number, required: true, min: 0 },
    stockQuantity: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Unique SKU per seller
ProductSchema.index({ ownerId: 1, SKU: 1 }, { unique: true });
ProductSchema.index({ ownerId: 1, active: 1 });
ProductSchema.index({ ownerId: 1, category: 1 });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
