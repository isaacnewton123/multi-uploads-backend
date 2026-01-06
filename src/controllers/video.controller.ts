import { uploadService } from '../services/upload.service';
import { quotaService } from '../services/quota.service';
import { TargetPlatform } from '../types';

export const videoController = {
  async uploadVideo(userId: string, file: any, body: any) {
    try {
      const { title, description, targetPlatforms, tags, hashtags, category, privacy } = body;

      if (!title || !description || !targetPlatforms) {
        return {
          success: false,
          message: 'Title, description, and target platforms are required',
        };
      }

      if (!file) {
        return {
          success: false,
          message: 'Video file is required',
        };
      }

      // Parse target platforms
      let platforms: TargetPlatform[];
      try {
        platforms = typeof targetPlatforms === 'string' 
          ? JSON.parse(targetPlatforms) 
          : targetPlatforms;
      } catch {
        return {
          success: false,
          message: 'Invalid target platforms format',
        };
      }

      // Validate platforms
      const validPlatforms = Object.values(TargetPlatform);
      const invalidPlatforms = platforms.filter(p => !validPlatforms.includes(p));
      if (invalidPlatforms.length > 0) {
        return {
          success: false,
          message: `Invalid platforms: ${invalidPlatforms.join(', ')}`,
        };
      }

      const video = await uploadService.uploadVideo(
        userId,
        Buffer.from(await file.arrayBuffer()),
        file.name,
        {
          userId,
          title,
          description,
          targetPlatforms: platforms,
          tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : undefined,
          hashtags: hashtags ? (typeof hashtags === 'string' ? JSON.parse(hashtags) : hashtags) : undefined,
          category,
          privacy,
        }
      );

      return {
        success: true,
        data: {
          videoId: video._id,
          status: video.status,
          message: 'Video uploaded successfully and queued for processing',
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },

  async getVideo(userId: string, videoId: string) {
    try {
      const video = await uploadService.getVideoById(videoId, userId);
      
      if (!video) {
        return {
          success: false,
          message: 'Video not found',
        };
      }

      return {
        success: true,
        data: video,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },

  async getUserVideos(userId: string) {
    try {
      const videos = await uploadService.getUserVideos(userId);
      return {
        success: true,
        data: videos,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },

  async deleteVideo(userId: string, videoId: string) {
    try {
      const deleted = await uploadService.deleteVideo(videoId, userId);
      
      if (!deleted) {
        return {
          success: false,
          message: 'Video not found',
        };
      }

      return {
        success: true,
        data: { message: 'Video deleted successfully' },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },

  async getQuota(userId: string) {
    try {
      const quota = await quotaService.getUserQuotaInfo(userId);
      return {
        success: true,
        data: quota,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },
};