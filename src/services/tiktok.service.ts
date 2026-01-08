import { ENV } from '../config/env';
import { PlatformConnection } from '../models/platform-connection.model';
import { TargetPlatform } from '../types';
import fs from 'fs';

interface TikTokUploadResult {
  success: boolean;
  platformVideoId?: string;
  url?: string;
  error?: string;
}

interface TikTokMetadata {
  title: string;
  caption: string;
  privacy_level: string;
  disable_comment: boolean;
  disable_duet: boolean;
  disable_stitch: boolean;
}

class TikTokService {
  private readonly clientKey = ENV.TIKTOK_CLIENT_KEY;
  private readonly clientSecret = ENV.TIKTOK_CLIENT_SECRET;
  private readonly redirectUri = ENV.TIKTOK_REDIRECT_URI;

  /**
   * Generate OAuth URL for user to authenticate with TikTok
   */
  getAuthUrl(userId: string): string {
    const scopes = [
      'user.info.basic',
      'video.upload',
      'video.publish',
    ].join(',');

    const csrfState = Buffer.from(userId).toString('base64');

    const params = new URLSearchParams({
      client_key: this.clientKey,
      scope: scopes,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      state: csrfState,
    });

    return `https://www.tiktok.com/v2/auth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string, userId: string): Promise<void> {
    try {
      const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_key: this.clientKey,
          client_secret: this.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to exchange code: ${error}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error_description || data.error);
      }

      // Store tokens in database
      await PlatformConnection.findOneAndUpdate(
        { userId, platform: TargetPlatform.TIKTOK },
        {
          userId,
          platform: TargetPlatform.TIKTOK,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
          isActive: true,
        },
        { upsert: true, new: true }
      );
    } catch (error: any) {
      throw new Error(`TikTok token exchange failed: ${error.message}`);
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(userId: string): Promise<string> {
    const connection = await PlatformConnection.findOne({
      userId,
      platform: TargetPlatform.TIKTOK,
    });

    if (!connection || !connection.refreshToken) {
      throw new Error('No TikTok connection found or refresh token missing');
    }

    try {
      const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_key: this.clientKey,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: connection.refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error_description || data.error);
      }

      // Update access token
      connection.accessToken = data.access_token;
      connection.refreshToken = data.refresh_token;
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
      platform: TargetPlatform.TIKTOK,
      isActive: true,
    });

    if (!connection) {
      throw new Error(
        'TikTok account not connected. Please connect your TikTok account first.'
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
   * Upload video to TikTok
   */
  async uploadVideo(
    userId: string,
    filePath: string,
    metadata: TikTokMetadata
  ): Promise<TikTokUploadResult> {
    try {
      const accessToken = await this.getAccessToken(userId);

      // Read video file
      const videoBuffer = fs.readFileSync(filePath);
      const videoSize = videoBuffer.length;

      // Step 1: Initialize upload
      const initResponse = await fetch(
        'https://open.tiktokapis.com/v2/post/publish/video/init/',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            post_info: {
              title: metadata.title,
              description: metadata.caption,
              privacy_level: metadata.privacy_level,
              disable_comment: metadata.disable_comment,
              disable_duet: metadata.disable_duet,
              disable_stitch: metadata.disable_stitch,
            },
            source_info: {
              source: 'FILE_UPLOAD',
              video_size: videoSize,
            },
          }),
        }
      );

      if (!initResponse.ok) {
        const error = await initResponse.text();
        throw new Error(`Upload initialization failed: ${error}`);
      }

      const initData = await initResponse.json();

      if (initData.error) {
        throw new Error(initData.error.message || initData.error.code);
      }

      const uploadUrl = initData.data.upload_url;
      const publishId = initData.data.publish_id;

      // Step 2: Upload video content
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Length': videoSize.toString(),
        },
        body: videoBuffer,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.text();
        throw new Error(`Video upload failed: ${error}`);
      }

      // Step 3: Check upload status
      const statusResponse = await fetch(
        'https://open.tiktokapis.com/v2/post/publish/status/fetch/',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            publish_id: publishId,
          }),
        }
      );

      const statusData = await statusResponse.json();

      // Update last used
      await PlatformConnection.updateOne(
        { userId, platform: TargetPlatform.TIKTOK },
        { lastUsed: new Date() }
      );

      return {
        success: true,
        platformVideoId: publishId,
        url: statusData.data?.share_url || `https://tiktok.com/@user/video/${publishId}`,
      };
    } catch (error: any) {
      console.error('TikTok upload error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check if user has connected TikTok account
   */
  async isConnected(userId: string): Promise<boolean> {
    const connection = await PlatformConnection.findOne({
      userId,
      platform: TargetPlatform.TIKTOK,
      isActive: true,
    });
    return !!connection;
  }

  /**
   * Disconnect TikTok account
   */
  async disconnect(userId: string): Promise<void> {
    await PlatformConnection.updateOne(
      { userId, platform: TargetPlatform.TIKTOK },
      { isActive: false }
    );
  }
}

export const tiktokService = new TikTokService();
