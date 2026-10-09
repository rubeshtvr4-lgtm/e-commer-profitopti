import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  businessName: string;
  currency: string;
  timezone: string;
  expenseCategories: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    businessName: { type: String, required: true, trim: true },
    currency: { type: String, default: 'INR', trim: true },
    timezone: { type: String, default: 'Asia/Kolkata', trim: true },
    expenseCategories: {
      type: [String],
      default: ['advertising', 'packaging', 'software', 'operations', 'salaries', 'other'],
    },
  },
  { timestamps: true }
);

// Do not return passwordHash in JSON
UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete (ret as any).passwordHash;
    return ret;
  },
});

export const User = mongoose.model<IUser>('User', UserSchema);
