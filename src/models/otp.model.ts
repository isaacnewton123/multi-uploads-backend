import mongoose, { Schema, Document } from 'mongoose';

export interface IOTP extends Document {
  email: string;
  code: string;
  expiresAt: Date;
  createdAt: Date;
}

const otpSchema = new Schema<IOTP>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries and auto-deletion of expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ email: 1, code: 1 });

export const OTP = mongoose.model<IOTP>('OTP', otpSchema);