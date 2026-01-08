import { ENV } from '../config/env';
import { PlatformConnection } from '../models/platform-connection.model';
import { TargetPlatform } from '../types';
import fs from 'fs';

interface YouTubeUploadResult {
  success: boolean;
  platformVideoId?: string;
  url?: string;
  error?: string;
}

interface YouTubeMetadata {
  snippet: {
    title: string;
    description: string;
    tags: string[];
    categoryId: string;
  };
  status: {
    privacyStatus: string;
    selfDeclaredMadeForKids: boolean;
  };
}

class YouTubeService {
  private readonly clientId = ENV.GOOGLE_CLIENT_ID;
  private readonly clientSecret = ENV.GOOGLE_CLIENT_SECRET;
  private readonly apiKey = ENV.GOOGLE_API_KEY;
  private readonly redirectUri = ENV.GOOGLE_REDIRECT_URI;

  /**
   * Generate OAuth URL for user to authenticate with YouTube
   */
  getAuthUrl(userId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.force-ssl',
    ].join(' ');

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline',
      state: userId, // Pass userId to identify user after callback
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string, userId: string): Promise<void> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: this.redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to exchange code: ${error}`);
      }

      const data = await response.json();

      // Store tokens in database
      await PlatformConnection.findOneAndUpdate(
        { userId, platform: TargetPlatform.YOUTUBE_SHORTS },
        {
          userId,
          platform: TargetPlatform.YOUTUBE_SHORTS,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
          isActive: true,
        },
        { upsert: true, new: true }
      );
    } catch (error: any) {
      throw new Error(`YouTube token exchange failed: ${error.message}`);
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(userId: string): Promise<string> {
    const connection = await PlatformConnection.findOne({
      userId,
      platform: TargetPlatform.YOUTUBE_SHORTS,
    });

    if (!connection || !connection.refreshToken) {
      throw new Error('No YouTube connection found or refresh token missing');
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: connection.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();

      // Update access token
      connection.accessToken = data.access_token;
      connection.tokenExpiresAt = new Date(Date.now() + data.expires_in * 1000);
      await connection.save();

      return data.access_token;
    } catch (error: any) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Get valid access token (refresh if expired)
   */
  async getAccessToken(userId: string): Promise<string> {
    const connection = await PlatformConnection.findOne({
      userId,
      platform: TargetPlatform.YOUTUBE_SHORTS,
      isActive: true,
    });

    if (!connection) {
      throw new Error(
        'YouTube account not connected. Please connect your YouTube account first.'
      );
    }

    // Check if token is expired or about to expire (within 5 minutes)
    const now = new Date();
    const expiryBuffer = new Date(now.getTime() + 5 * 60 * 1000);

    if (connection.tokenExpiresAt && connection.tokenExpiresAt < expiryBuffer) {
      return await this.refreshAccessToken(userId);
    }

    return connection.accessToken;
  }

  /**
   * Upload video to YouTube Shorts
   */
  async uploadVideo(
    userId: string,
    filePath: string,
    metadata: YouTubeMetadata
  ): Promise<YouTubeUploadResult> {
    try {
      const accessToken = await this.getAccessToken(userId);

      // Read video file
      const videoBuffer = fs.readFileSync(filePath);

      // Step 1: Initialize upload
      const initResponse = await fetch(
        'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Upload-Content-Type': 'video/*',
            'X-Upload-Content-Length': videoBuffer.length.toString(),
          },
          body: JSON.stringify(metadata),
        }
      );

      if (!initResponse.ok) {
        const error = await initResponse.text();
        throw new Error(`Upload initialization failed: ${error}`);
      }

      const uploadUrl = initResponse.headers.get('location');
      if (!uploadUrl) {
        throw new Error('No upload URL received');
      }

      // Step 2: Upload video content
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'video/*',
        },
        body: videoBuffer,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.text();
        throw new Error(`Video upload failed: ${error}`);
      }

      const result = await uploadResponse.json();

      // Update last used
      await PlatformConnection.updateOne(
        { userId, platform: TargetPlatform.YOUTUBE_SHORTS },
        { lastUsed: new Date() }
      );

      return {
        success: true,
        platformVideoId: result.id,
        url: `https://youtube.com/shorts/${result.id}`,
      };
    } catch (error: any) {
      console.error('YouTube upload error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check if user has connected YouTube account
   */
  async isConnected(userId: string): Promise<boolean> {
    const connection = await PlatformConnection.findOne({
      userId,
      platform: TargetPlatform.YOUTUBE_SHORTS,
      isActive: true,
    });
    return !!connection;
  }

  /**
   * Disconnect YouTube account
   */
  async disconnect(userId: string): Promise<void> {
    await PlatformConnection.updateOne(
      { userId, platform: TargetPlatform.YOUTUBE_SHORTS },
      { isActive: false }
    );
  }
}

export const youtubeService = new YouTubeService();
