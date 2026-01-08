import mongoose, { Schema, Document } from 'mongoose';
import { TargetPlatform } from '../types';

export interface IPlatformConnection extends Document {
  userId: mongoose.Types.ObjectId;
  platform: TargetPlatform;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  platformUserId?: string;
  platformUsername?: string;
  isActive: boolean;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const platformConnectionSchema = new Schema<IPlatformConnection>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    platform: {
      type: String,
      enum: Object.values(TargetPlatform),
      required: true,
    },
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
    },
    tokenExpiresAt: {
      type: Date,
    },
    platformUserId: {
      type: String,
    },
    platformUsername: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUsed: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one connection per user per platform
platformConnectionSchema.index({ userId: 1, platform: 1 }, { unique: true });

export const PlatformConnection = mongoose.model<IPlatformConnection>(
  'PlatformConnection',
  platformConnectionSchema
);
