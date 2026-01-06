import mongoose, { Schema, Document } from 'mongoose';
import { VideoStatus, TargetPlatform } from '../types';

export interface IVideo extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  fileURL: string;
  status: VideoStatus;
  targetPlatforms: TargetPlatform[];
  metadata?: Record<string, any>;
  uploadResults?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const videoSchema = new Schema<IVideo>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    fileURL: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(VideoStatus),
      default: VideoStatus.PENDING,
    },
    targetPlatforms: {
      type: [String],
      enum: Object.values(TargetPlatform),
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    uploadResults: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
videoSchema.index({ userId: 1 });
videoSchema.index({ status: 1 });
videoSchema.index({ createdAt: -1 });

export const Video = mongoose.model<IVideo>('Video', videoSchema);