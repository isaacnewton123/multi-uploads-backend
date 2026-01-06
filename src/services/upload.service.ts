import { Video, type IVideo } from '../models/video.model';
import { quotaService } from './quota.service';
import { metadataService } from './metadata.service';
import { TargetPlatform, VideoStatus } from '../types';
import { videoQueue } from '../workers/video.worker';
import fs from 'fs';
import path from 'path';
import { ENV } from '../config/env';

interface UploadVideoData {
  userId: string;
  title: string;
  description: string;
  targetPlatforms: TargetPlatform[];
  tags?: string[];
  hashtags?: string[];
  category?: string;
  privacy?: string;
}

class UploadService {
  async uploadVideo(
    userId: string,
    fileBuffer: Buffer,
    fileName: string,
    data: UploadVideoData
  ): Promise<IVideo> {
    // Check quota
    const canUpload = await quotaService.canUpload(userId);
    if (!canUpload.allowed) {
      throw new Error(canUpload.message || 'Upload quota exceeded');
    }

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), ENV.UPLOAD_DIR);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save file locally
    const fileExtension = path.extname(fileName);
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`;
    const filePath = path.join(uploadDir, uniqueFileName);
    
    fs.writeFileSync(filePath, fileBuffer);

    // Generate platform-specific metadata
    const platformMetadata = metadataService.mapMetadata({
      title: data.title,
      description: data.description,
      tags: data.tags,
      hashtags: data.hashtags,
      category: data.category,
      privacy: data.privacy,
    });

    // Create video record
    const video = new Video({
      userId,
      title: data.title,
      description: data.description,
      fileURL: filePath,
      status: VideoStatus.PENDING,
      targetPlatforms: data.targetPlatforms,
      metadata: platformMetadata,
    });

    await video.save();

    // Increment user's upload count
    await quotaService.incrementUploadCount(userId);

    // Add video to processing queue
    await videoQueue.add('process-video', {
      videoId: video._id.toString(),
      userId,
      targetPlatforms: data.targetPlatforms,
    });

    return video;
  }

  async getVideoById(videoId: string, userId: string): Promise<IVideo | null> {
    return await Video.findOne({ _id: videoId, userId });
  }

  async getUserVideos(userId: string, limit: number = 50): Promise<IVideo[]> {
    return await Video.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async deleteVideo(videoId: string, userId: string): Promise<boolean> {
    const video = await Video.findOne({ _id: videoId, userId });
    if (!video) {
      return false;
    }

    // Delete file from disk
    if (fs.existsSync(video.fileURL)) {
      fs.unlinkSync(video.fileURL);
    }

    // Delete from database
    await Video.deleteOne({ _id: videoId });
    return true;
  }
}

export const uploadService = new UploadService();