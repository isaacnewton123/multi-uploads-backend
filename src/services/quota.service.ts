import { User } from '../models/user.model';
import { TIER_LIMITS, UserTier } from '../types';

class QuotaService {
  async checkAndResetQuota(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const now = new Date();
    const lastReset = new Date(user.lastResetDate);

    // Check if we need to reset the daily counter
    const isDifferentDay = 
      now.getDate() !== lastReset.getDate() ||
      now.getMonth() !== lastReset.getMonth() ||
      now.getFullYear() !== lastReset.getFullYear();

    if (isDifferentDay) {
      user.dailyUploadCount = 0;
      user.lastResetDate = now;
      await user.save();
    }
  }

  async canUpload(userId: string): Promise<{ allowed: boolean; message?: string }> {
    const user = await User.findById(userId);
    if (!user) {
      return { allowed: false, message: 'User not found' };
    }

    // Reset quota if needed
    await this.checkAndResetQuota(userId);

    // Refresh user data after potential reset
    const refreshedUser = await User.findById(userId);
    if (!refreshedUser) {
      return { allowed: false, message: 'User not found' };
    }

    const tierLimits = TIER_LIMITS[refreshedUser.tier as UserTier];

    // Enterprise has unlimited uploads
    if (tierLimits.dailyUploadLimit === -1) {
      return { allowed: true };
    }

    // Check if user has reached their daily limit
    if (refreshedUser.dailyUploadCount >= tierLimits.dailyUploadLimit) {
      return {
        allowed: false,
        message: `Daily upload limit reached (${tierLimits.dailyUploadLimit} videos). Upgrade your tier for more uploads.`,
      };
    }

    return { allowed: true };
  }

  async incrementUploadCount(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.dailyUploadCount += 1;
    await user.save();
  }

  async getUserQuotaInfo(userId: string): Promise<{
    tier: string;
    dailyLimit: number;
    used: number;
    remaining: number;
  }> {
    await this.checkAndResetQuota(userId);

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const tierLimits = TIER_LIMITS[user.tier as UserTier];
    const dailyLimit = tierLimits.dailyUploadLimit;
    const used = user.dailyUploadCount;
    const remaining = dailyLimit === -1 ? -1 : Math.max(0, dailyLimit - used);

    return {
      tier: user.tier,
      dailyLimit,
      used,
      remaining,
    };
  }
}

export const quotaService = new QuotaService();