import { Queue, Worker } from 'bullmq';
import { ENV } from '../config/env';
import { Video } from '../models/video.model';
import { VideoStatus, TargetPlatform } from '../types';

// Create Redis connection config
const redisConnection = {
  host: ENV.REDIS_HOST,
  port: ENV.REDIS_PORT,
};

// Create video processing queue
export const videoQueue = new Queue('video-processing', {
  connection: redisConnection,
});

// Create worker to process video upload jobs
const worker = new Worker(
  'video-processing',
  async (job) => {
    const { videoId, userId, targetPlatforms } = job.data;

    console.log(`📦 Processing video ${videoId} for user ${userId}`);

    try {
      // Update video status to processing
      await Video.findByIdAndUpdate(videoId, {
        status: VideoStatus.PROCESSING,
      });

      const results: Record<string, any> = {};

      // Process each platform
      for (const platform of targetPlatforms) {
        try {
          const result = await uploadToPlatform(videoId, platform);
          results[platform] = {
            success: true,
            ...result,
          };
        } catch (error: any) {
          results[platform] = {
            success: false,
            error: error.message,
          };
        }
      }

      // Check if all uploads were successful
      const allSuccess = Object.values(results).every((r: any) => r.success);

      // Update video with results
      await Video.findByIdAndUpdate(videoId, {
        status: allSuccess ? VideoStatus.SUCCESS : VideoStatus.FAILED,
        uploadResults: results,
      });

      console.log(`✅ Video ${videoId} processed successfully`);
      return results;
    } catch (error) {
      console.error(`❌ Error processing video ${videoId}:`, error);
      
      await Video.findByIdAndUpdate(videoId, {
        status: VideoStatus.FAILED,
      });
      
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 3, // Process 3 videos at a time
  }
);

// Mock function to simulate platform upload
// In production, this would call actual platform APIs
async function uploadToPlatform(
  videoId: string,
  platform: TargetPlatform
): Promise<any> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log(`🚀 Uploading video ${videoId} to ${platform}`);

  // This is where you would integrate with actual platform APIs:
  switch (platform) {
    case TargetPlatform.YOUTUBE_SHORTS:
      // YouTube API integration
      return {
        platformVideoId: `yt_${Math.random().toString(36).substring(7)}`,
        url: `https://youtube.com/shorts/${Math.random().toString(36).substring(7)}`,
      };

    case TargetPlatform.TIKTOK:
      // TikTok API integration
      return {
        platformVideoId: `tt_${Math.random().toString(36).substring(7)}`,
        url: `https://tiktok.com/@user/video/${Math.random().toString(36).substring(7)}`,
      };

    case TargetPlatform.INSTAGRAM_REELS:
      // Instagram API integration
      return {
        platformVideoId: `ig_${Math.random().toString(36).substring(7)}`,
        url: `https://instagram.com/reel/${Math.random().toString(36).substring(7)}`,
      };

    case TargetPlatform.FACEBOOK_REELS:
      // Facebook API integration
      return {
        platformVideoId: `fb_${Math.random().toString(36).substring(7)}`,
        url: `https://facebook.com/reel/${Math.random().toString(36).substring(7)}`,
      };

    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

// Worker event listeners
worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err);
});

console.log('👷 Video worker started');