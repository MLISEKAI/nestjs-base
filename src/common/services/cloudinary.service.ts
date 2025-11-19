import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService implements OnModuleInit {
  private readonly logger = new Logger(CloudinaryService.name);
  private isConfigured = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
      this.isConfigured = true;
      this.logger.log('Cloudinary initialized successfully');
    } else {
      this.logger.warn(
        'Cloudinary is not configured. Please provide CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env',
      );
    }
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'uploads'): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary is not configured');
    }

    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder: folder,
        resource_type: 'auto' as const, // Tự động detect image, video, raw
        public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '')}`, // Bỏ extension, Cloudinary tự thêm
      };

      cloudinary.uploader
        .upload_stream(
          uploadOptions,
          (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
            if (error) {
              this.logger.error('Cloudinary upload error', error);
              reject(new Error(`Failed to upload file to Cloudinary: ${error.message}`));
              return;
            }

            if (!result || !result.secure_url) {
              this.logger.error('Cloudinary upload failed: No URL returned');
              reject(new Error('Failed to upload file: No URL returned from Cloudinary'));
              return;
            }

            this.logger.log(`File uploaded successfully: ${result.secure_url}`);
            resolve(result.secure_url);
          },
        )
        .end(file.buffer);
    });
  }

  async deleteFile(publicId: string): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary is not configured');
    }

    try {
      // Extract public_id from URL nếu là full URL
      const publicIdFromUrl = this.extractPublicId(publicId);
      const result = await cloudinary.uploader.destroy(publicIdFromUrl);

      if (result.result === 'ok') {
        this.logger.log(`File deleted successfully: ${publicIdFromUrl}`);
      } else {
        this.logger.warn(`File deletion result: ${result.result} for ${publicIdFromUrl}`);
      }
    } catch (error) {
      this.logger.error('Cloudinary delete error', error);
      throw error;
    }
  }

  /**
   * Extract public_id from Cloudinary URL
   * Example: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/file.jpg
   * Returns: folder/file
   */
  private extractPublicId(url: string): string {
    try {
      // Nếu đã là public_id (không có http), return luôn
      if (!url.startsWith('http')) {
        return url;
      }

      // Extract từ URL
      const urlParts = url.split('/');
      const uploadIndex = urlParts.findIndex((part) => part === 'upload');

      if (uploadIndex === -1) {
        // Không phải Cloudinary URL, return nguyên URL
        return url;
      }

      // Lấy phần sau 'upload' và bỏ version (v1234567890) và extension
      const afterUpload = urlParts.slice(uploadIndex + 1);
      // Bỏ version nếu có (bắt đầu bằng 'v' và là số)
      const withoutVersion = afterUpload.filter((part) => !/^v\d+$/.test(part));
      // Join lại và bỏ extension
      const publicId = withoutVersion.join('/').replace(/\.[^/.]+$/, '');

      return publicId;
    } catch (error) {
      this.logger.warn(`Failed to extract public_id from URL: ${url}`, error);
      return url;
    }
  }

  isServiceConfigured(): boolean {
    return this.isConfigured;
  }
}
