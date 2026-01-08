import fs from 'fs';
import path from 'path';

interface VideoValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: {
    duration?: number;
    width?: number;
    height?: number;
    aspectRatio?: string;
    format?: string;
    size: number;
  };
}

interface ShortFormVideoRequirements {
  maxDuration: number; // seconds
  minDuration: number; // seconds
  aspectRatio: string;
  maxFileSize: number; // bytes
  allowedFormats: string[];
  recommendedResolution: { width: number; height: number };
}

const SHORT_FORM_REQUIREMENTS: ShortFormVideoRequirements = {
  maxDuration: 60, // 60 seconds
  minDuration: 3, // 3 seconds
  aspectRatio: '9:16', // Vertical
  maxFileSize: 500 * 1024 * 1024, // 500 MB
  allowedFormats: ['.mp4', '.mov', '.avi', '.webm'],
  recommendedResolution: { width: 1080, height: 1920 },
};

class VideoValidationService {
  /**
   * Validate if a video file meets short-form video requirements
   */
  async validateShortFormVideo(
    filePath: string,
    fileName: string
  ): Promise<VideoValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return {
        valid: false,
        errors: ['Video file does not exist'],
        warnings: [],
      };
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    const fileExtension = path.extname(fileName).toLowerCase();

    // Validate file format
    if (!SHORT_FORM_REQUIREMENTS.allowedFormats.includes(fileExtension)) {
      errors.push(
        `Unsupported video format: ${fileExtension}. Allowed formats: ${SHORT_FORM_REQUIREMENTS.allowedFormats.join(', ')}`
      );
    }

    // Validate file size
    if (fileSize > SHORT_FORM_REQUIREMENTS.maxFileSize) {
      errors.push(
        `Video file size (${this.formatFileSize(fileSize)}) exceeds maximum allowed size (${this.formatFileSize(SHORT_FORM_REQUIREMENTS.maxFileSize)})`
      );
    }

    // Basic validation without ffmpeg (for MVP)
    // In production, you would use ffmpeg or similar to extract actual video metadata
    if (fileSize < 1024) {
      errors.push('Video file is too small to be valid');
    }

    // Add warnings for optimal short-form video
    warnings.push(
      `For best results on short-form platforms, ensure your video is ${SHORT_FORM_REQUIREMENTS.aspectRatio} aspect ratio (vertical)`
    );
    warnings.push(
      `Recommended resolution: ${SHORT_FORM_REQUIREMENTS.recommendedResolution.width}x${SHORT_FORM_REQUIREMENTS.recommendedResolution.height}`
    );
    warnings.push(
      `Keep duration between ${SHORT_FORM_REQUIREMENTS.minDuration}-${SHORT_FORM_REQUIREMENTS.maxDuration} seconds for maximum engagement`
    );

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        size: fileSize,
        format: fileExtension,
      },
    };
  }

  /**
   * Format file size to human-readable format
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Get short-form video requirements
   */
  getRequirements(): ShortFormVideoRequirements {
    return SHORT_FORM_REQUIREMENTS;
  }
}

export const videoValidationService = new VideoValidationService();
