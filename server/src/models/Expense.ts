import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  ownerId: mongoose.Types.ObjectId;
  category: 'advertising' | 'packaging' | 'software' | 'operations' | 'shipping' | 'salaries' | 'other';
  amount: number; // in paise
  date: Date;
  description: string;
  orderId?: mongoose.Types.ObjectId; // If linked to a specific order, it's an order-attributable expense!
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: {
      type: String,
      enum: ['advertising', 'packaging', 'software', 'operations', 'shipping', 'salaries', 'other'],
      default: 'other',
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now, index: true },
    description: { type: String, required: true, trim: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', index: true },
  },
  { timestamps: true }
);

ExpenseSchema.index({ ownerId: 1, date: -1 });
ExpenseSchema.index({ ownerId: 1, category: 1 });
ExpenseSchema.index({ ownerId: 1, orderId: 1 });

export const Expense = mongoose.model<IExpense>('Expense', ExpenseSchema);
