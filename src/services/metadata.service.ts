import { TargetPlatform } from '../types';

interface VideoMetadata {
  title: string;
  description: string;
  tags?: string[];
  hashtags?: string[];
  category?: string;
  privacy?: string;
  thumbnail?: string;
}

interface PlatformSpecificMetadata {
  platform: TargetPlatform;
  metadata: Record<string, any>;
}

class MetadataService {
  mapMetadata(genericMetadata: VideoMetadata): PlatformSpecificMetadata[] {
    const results: PlatformSpecificMetadata[] = [];

    // YouTube Shorts specific mapping
    results.push({
      platform: TargetPlatform.YOUTUBE_SHORTS,
      metadata: {
        snippet: {
          title: this.truncate(genericMetadata.title, 100),
          description: this.formatYouTubeDescription(genericMetadata),
          tags: genericMetadata.tags || [],
          categoryId: this.mapCategoryToYouTube(genericMetadata.category),
        },
        status: {
          privacyStatus: genericMetadata.privacy || 'public',
          selfDeclaredMadeForKids: false,
        },
      },
    });

    // TikTok specific mapping
    results.push({
      platform: TargetPlatform.TIKTOK,
      metadata: {
        title: this.truncate(genericMetadata.title, 150),
        caption: this.formatTikTokCaption(genericMetadata),
        privacy_level: this.mapPrivacyToTikTok(genericMetadata.privacy),
        disable_comment: false,
        disable_duet: false,
        disable_stitch: false,
      },
    });

    // Instagram Reels specific mapping
    results.push({
      platform: TargetPlatform.INSTAGRAM_REELS,
      metadata: {
        caption: this.formatInstagramCaption(genericMetadata),
        share_to_feed: true,
        thumbnail_offset: 0,
        audio_name: genericMetadata.title,
      },
    });

    // Facebook Reels specific mapping
    results.push({
      platform: TargetPlatform.FACEBOOK_REELS,
      metadata: {
        title: this.truncate(genericMetadata.title, 255),
        description: this.formatFacebookDescription(genericMetadata),
        privacy: this.mapPrivacyToFacebook(genericMetadata.privacy),
        published: true,
      },
    });

    return results;
  }

  private truncate(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
  }

  private formatYouTubeDescription(metadata: VideoMetadata): string {
    let description = metadata.description;
    if (metadata.tags && metadata.tags.length > 0) {
      description += '\n\nTags: ' + metadata.tags.join(', ');
    }
    return description;
  }

  private formatTikTokCaption(metadata: VideoMetadata): string {
    let caption = metadata.title + '\n' + metadata.description;
    if (metadata.hashtags && metadata.hashtags.length > 0) {
      caption += '\n' + metadata.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');
    }
    return this.truncate(caption, 2200);
  }

  private formatInstagramCaption(metadata: VideoMetadata): string {
    let caption = metadata.title + '\n\n' + metadata.description;
    if (metadata.hashtags && metadata.hashtags.length > 0) {
      caption += '\n\n' + metadata.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');
    }
    return this.truncate(caption, 2200);
  }

  private formatFacebookDescription(metadata: VideoMetadata): string {
    let description = metadata.description;
    if (metadata.hashtags && metadata.hashtags.length > 0) {
      description += '\n' + metadata.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');
    }
    return description;
  }

  private mapCategoryToYouTube(category?: string): string {
    const categoryMap: Record<string, string> = {
      'entertainment': '24',
      'education': '27',
      'sports': '17',
      'gaming': '20',
      'music': '10',
      'comedy': '23',
      'default': '22', // People & Blogs
    };
    return categoryMap[category?.toLowerCase() || 'default'] ?? '22';
  }

  private mapPrivacyToTikTok(privacy?: string): string {
    const privacyMap: Record<string, string> = {
      'public': 'PUBLIC_TO_EVERYONE',
      'private': 'SELF_ONLY',
      'friends': 'MUTUAL_FOLLOW_FRIENDS',
    };
    return privacyMap[privacy?.toLowerCase() || 'public'] || 'PUBLIC_TO_EVERYONE';
  }

  private mapPrivacyToFacebook(privacy?: string): string {
    const privacyMap: Record<string, string> = {
      'public': 'EVERYONE',
      'private': 'SELF',
      'friends': 'ALL_FRIENDS',
    };
    return privacyMap[privacy?.toLowerCase() || 'public'] || 'EVERYONE';
  }
}

export const metadataService = new MetadataService();