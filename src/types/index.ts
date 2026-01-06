export enum UserTier {
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

export enum VideoStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export enum TargetPlatform {
  YOUTUBE_SHORTS = 'youtube_shorts',
  TIKTOK = 'tiktok',
  FACEBOOK_REELS = 'facebook_reels',
  INSTAGRAM_REELS = 'instagram_reels',
}

export interface TierLimits {
  dailyUploadLimit: number;
  features: string[];
}

export const TIER_LIMITS: Record<UserTier, TierLimits> = {
  [UserTier.BASIC]: {
    dailyUploadLimit: 3,
    features: ['basic_metadata', 'custom_thumbnails', 'standard_support'],
  },
  [UserTier.PREMIUM]: {
    dailyUploadLimit: 5,
    features: [
      'basic_metadata',
      'custom_thumbnails',
      'advanced_settings',
      'subtitles',
      'video_chapters',
      'end_screens',
      'scheduled_uploads',
      'video_templates',
      'priority_support',
    ],
  },
  [UserTier.ENTERPRISE]: {
    dailyUploadLimit: -1, // Unlimited
    features: [
      'basic_metadata',
      'custom_thumbnails',
      'advanced_settings',
      'subtitles',
      'video_chapters',
      'end_screens',
      'scheduled_uploads',
      'video_templates',
      'custom_workflows',
      'deep_analytics',
      'api_access',
      'custom_features',
      'dedicated_support',
    ],
  },
};