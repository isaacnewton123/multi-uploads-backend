import mongoose, { Schema, Document } from 'mongoose';
import { UserTier } from '../types';

export interface IUser extends Document {
  id: string;
  email: string;
  password: string;
  phone?: string;
  tier: UserTier;
  isEmailVerified: boolean;
  dailyUploadCount: number;
  lastResetDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      default: null,
    },
    tier: {
      type: String,
      enum: Object.values(UserTier),
      default: UserTier.BASIC,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    dailyUploadCount: {
      type: Number,
      default: 0,
    },
    lastResetDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ tier: 1 });

export const User = mongoose.model<IUser>('User', userSchema);