// Import các exception và Logger từ NestJS
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
// Import CloudinaryService để upload files lên Cloudinary
import { CloudinaryService } from './cloudinary.service';
// Import interface cho image transformation options
import { ImageTransformationOptions } from '../interfaces/image-transformation.interface';
// Import music-metadata để extract duration từ audio files
import { parseBuffer } from 'music-metadata';
// Import fs/promises để đọc file từ disk khi Multer sử dụng diskStorage
import { readFile } from 'fs/promises';

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * UploadService - Service xử lý upload files (images, videos, audio)
 *
 * Chức năng chính:
 * - Upload images với transformation options
 * - Upload videos với thumbnail generation
 * - Upload audio với duration extraction
 * - Validate file types và sizes
 * - Hỗ trợ Cloudinary hoặc mock URLs (dev mode)
 */
@Injectable()
export class UploadService {
  // Logger để log các events và errors
  private readonly logger = new Logger(UploadService.name);

  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject CloudinaryService khi tạo instance của service
   */
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  /**
   * Upload image file
   *
   * @param file - Image file từ Multer
   * @param folder - Folder để lưu file (mặc định: 'uploads')
   * @param transformation - Image transformation options (resize, crop, etc.)
   * @returns URL của uploaded image
   *
   * Quy trình:
   * 1. Validate file type (JPEG, PNG, GIF, WebP)
   * 2. Validate file size (tối đa 5MB)
   * 3. Upload lên Cloudinary với transformation (nếu có)
   * 4. Return URL
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'uploads',
    transformation?: ImageTransformationOptions,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type: chỉ cho phép JPEG, PNG, GIF, WebP
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.',
      );
    }

    // Validate file size (tối đa 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    try {
      // Upload lên Cloudinary (hoặc return mock URL trong dev mode)
      if (this.cloudinaryService.isServiceConfigured()) {
        return await this.cloudinaryService.uploadFile(file, folder, transformation);
      } else {
        this.logger.warn('Cloudinary not configured, returning mock URL');
        return `https://example.com/${folder}/${Date.now()}-${file.originalname}`;
      }
    } catch (error) {
      this.logger.error('Upload failed', error);
      throw new BadRequestException(`Failed to upload file: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Upload multiple image files
   *
   * @param files - Array of image files từ Multer
   * @param folder - Folder để lưu files (mặc định: 'uploads')
   * @param transformation - Image transformation options (áp dụng cho tất cả images)
   * @returns Array of URLs của uploaded images
   *
   * Quy trình:
   * 1. Validate có ít nhất 1 file
   * 2. Upload tất cả files song song (Promise.all) để tối ưu performance
   * 3. Return array of URLs
   *
   * Lưu ý:
   * - Tất cả files được upload song song, không tuần tự
   * - Nếu 1 file fail, toàn bộ Promise.all sẽ reject
   */
  async uploadMultipleImages(
    files: Express.Multer.File[],
    folder: string = 'uploads',
    transformation?: ImageTransformationOptions,
  ): Promise<string[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    // Upload tất cả files song song để tối ưu performance
    const uploads = files.map((file) => this.uploadImage(file, folder, transformation));
    return Promise.all(uploads);
  }

  /**
   * Upload video file với thumbnail generation
   *
   * @param file - Video file từ Multer
   * @param folder - Folder để lưu file (mặc định: 'uploads')
   * @returns Object chứa URL và thumbnail_url
   *
   * Quy trình:
   * 1. Validate file type (MP4, MOV, AVI, WebM)
   * 2. Validate file size (tối đa 100MB)
   * 3. Upload lên Cloudinary
   * 4. Generate thumbnail URL (Cloudinary tự động tạo thumbnail)
   * 5. Return URL và thumbnail_url
   *
   * Lưu ý:
   * - Cloudinary tự động tạo thumbnail cho video
   * - Thumbnail URL được generate bằng cách thay đổi extension từ .mp4/.mov/.avi/.webm sang .jpg
   */
  async uploadVideo(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): Promise<{ url: string; thumbnail_url?: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type: chỉ cho phép MP4, MOV, AVI, WebM
    const allowedMimeTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only MP4, MOV, AVI, and WebM are allowed.');
    }

    // Validate file size (tối đa 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 100MB limit');
    }

    try {
      if (this.cloudinaryService.isServiceConfigured()) {
        // Upload video lên Cloudinary
        const url = await this.cloudinaryService.uploadFile(file, folder);
        // Cloudinary tự động tạo thumbnail cho video
        // Generate thumbnail URL bằng cách thay đổi extension
        // Lưu ý: URL có thể có query parameters (ví dụ: ?quality=auto)
        // Cần tách base URL và query parameters trước khi replace extension
        const urlParts = url.split('?');
        const baseUrl = urlParts[0]; // Base URL không có query parameters
        const queryParams = urlParts[1] ? `?${urlParts[1]}` : ''; // Query parameters nếu có
        // Replace extension trong base URL (mp4|mov|avi|webm -> jpg)
        const thumbnailBaseUrl = baseUrl.replace(/\.(mp4|mov|avi|webm)$/i, '.jpg');
        // Reconstruct thumbnail URL với query parameters
        const thumbnailUrl = thumbnailBaseUrl + queryParams;
        return { url, thumbnail_url: thumbnailUrl };
      } else {
        this.logger.warn('Cloudinary not configured, returning mock URL');
        return {
          url: `https://example.com/${folder}/${Date.now()}-${file.originalname}`,
          thumbnail_url: `https://example.com/${folder}/${Date.now()}-${file.originalname}.jpg`,
        };
      }
    } catch (error) {
      this.logger.error('Upload failed', error);
      throw new BadRequestException(`Failed to upload file: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Upload audio file và extract duration
   *
   * @param file - Audio file từ Multer
   * @param folder - Folder để lưu file (mặc định: 'uploads')
   * @returns Object chứa URL và duration (seconds)
   *
   * Quy trình:
   * 1. Validate file type và size
   * 2. Extract duration từ audio file metadata
   * 3. Upload file lên Cloudinary (hoặc return mock URL)
   * 4. Return URL và duration
   *
   * Lưu ý:
   * - Duration được extract từ audio metadata sử dụng music-metadata library
   * - Nếu không thể extract duration, sẽ return undefined (không return 0 để tránh misleading)
   */
  async uploadAudio(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): Promise<{ url: string; duration?: number }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedMimeTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/aac',
      'audio/webm',
      'audio/x-m4a',
      'audio/mp4',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only MP3, WAV, OGG, AAC, and WebM are allowed.',
      );
    }

    // Validate file size (tối đa 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    // Extract duration từ audio file metadata
    // Lưu ý: file.buffer chỉ tồn tại khi Multer sử dụng memoryStorage()
    // Nếu sử dụng diskStorage(), file được lưu vào disk và file.buffer sẽ là undefined
    // Trong trường hợp đó, cần đọc file từ disk sử dụng file.path
    let duration: number | undefined;
    try {
      let buffer: Buffer | undefined;

      if (file.buffer) {
        // File đang ở trong memory (memoryStorage)
        buffer = file.buffer;
      } else if (file.path) {
        // File đang ở trên disk (diskStorage)
        // Đọc file từ disk vào buffer
        buffer = await readFile(file.path);
      } else {
        // Không có buffer hoặc path - không thể extract duration
        this.logger.warn(
          'Cannot extract audio duration: file.buffer and file.path are both undefined',
        );
        buffer = undefined; // Đảm bảo buffer được khởi tạo
        duration = undefined;
      }

      if (buffer) {
        const metadata = await parseBuffer(buffer);
        // duration được tính bằng seconds (metadata.format?.duration có thể là undefined hoặc 0)
        // Sử dụng optional chaining để tránh TypeError nếu metadata.format là undefined
        // Sử dụng explicit undefined check thay vì falsy check để preserve duration = 0
        duration =
          metadata.format?.duration !== undefined
            ? Math.round(metadata.format.duration)
            : undefined;
      }
    } catch (error) {
      // Nếu không thể extract duration, log warning nhưng không throw error
      // Vì upload vẫn có thể thành công, chỉ thiếu duration
      this.logger.warn(`Failed to extract audio duration: ${error.message}`);
      duration = undefined;
    }

    try {
      // Upload file lên Cloudinary (hoặc return mock URL trong dev mode)
      let url: string;
      if (this.cloudinaryService.isServiceConfigured()) {
        url = await this.cloudinaryService.uploadFile(file, folder);
      } else {
        this.logger.warn('Cloudinary not configured, returning mock URL');
        url = `https://example.com/${folder}/${Date.now()}-${file.originalname}`;
      }

      return {
        url,
        duration, // Duration in seconds (undefined nếu không thể extract)
      };
    } catch (error) {
      this.logger.error('Upload failed', error);
      throw new BadRequestException(`Failed to upload file: ${error.message || 'Unknown error'}`);
    }
  }
}
