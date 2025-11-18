import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { FirebaseService } from './firebase.service';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  async uploadImage(file: Express.Multer.File, folder: string = 'uploads'): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.',
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    try {
      if (this.firebaseService.isConfigured()) {
        return await this.firebaseService.uploadFile(file, folder);
      } else {
        this.logger.warn('Firebase not configured, returning mock URL');
        return `https://example.com/${folder}/${Date.now()}-${file.originalname}`;
      }
    } catch (error) {
      this.logger.error('Upload failed', error);
      throw new BadRequestException('Failed to upload file');
    }
  }

  async uploadMultipleImages(
    files: Express.Multer.File[],
    folder: string = 'uploads',
  ): Promise<string[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const uploads = files.map((file) => this.uploadImage(file, folder));
    return Promise.all(uploads);
  }
}
