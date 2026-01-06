import { User } from '../models/user.model';
import { Video } from '../models/video.model';
import { UserTier } from '../types';

export const adminController = {
  // User Management
  async getAllUsers(page: number = 1, limit: number = 50) {
    try {
      const skip = (page - 1) * limit;
      const users = await User.find()
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
      
      const total = await User.countDocuments();
      
      return {
        success: true,
        data: {
          users,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },

  async getUserById(userId: string) {
    try {
      const user = await User.findById(userId).select('-password');
      
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      const videoCount = await Video.countDocuments({ userId });
      
      return {
        success: true,
        data: {
          user,
          stats: {
            totalVideos: videoCount,
          },
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },

  async updateUserTier(userId: string, tier: string) {
    try {
      if (!Object.values(UserTier).includes(tier as UserTier)) {
        return {
          success: false,
          message: 'Invalid tier. Must be: basic, premium, or enterprise',
        };
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { tier },
        { new: true }
      ).select('-password');
      
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      return {
        success: true,
        data: user,
        message: `User tier updated to ${tier}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },

  async suspendUser(userId: string) {
    try {
      // In a real app, you'd have an 'isActive' field
      const user = await User.findById(userId);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // For now, we'll just return success
      // In production, add an isActive/isSuspended field to User model
      return {
        success: true,
        message: 'User suspended successfully (feature to be implemented)',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },

  // Monitoring & Analytics
  async getSystemStats() {
    try {
      const totalUsers = await User.countDocuments();
      const totalVideos = await Video.countDocuments();
      
      const usersByTier = await User.aggregate([
        {
          $group: {
            _id: '$tier',
            count: { $sum: 1 },
          },
        },
      ]);

      const videosByStatus = await Video.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);

      const recentVideos = await Video.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'email tier');

      return {
        success: true,
        data: {
          totalUsers,
          totalVideos,
          usersByTier,
          videosByStatus,
          recentVideos,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },

  async getUploadLogs(page: number = 1, limit: number = 50) {
    try {
      const skip = (page - 1) * limit;
      
      const videos = await Video.find()
        .populate('userId', 'email tier')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
      
      const total = await Video.countDocuments();
      
      return {
        success: true,
        data: {
          videos,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },
};