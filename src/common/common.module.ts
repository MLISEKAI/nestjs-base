// Import Module decorator từ NestJS
import { Module } from '@nestjs/common';
// Import ConfigModule để đọc environment variables
import { ConfigModule } from '@nestjs/config';
// Import services
import { CloudinaryService } from './services/cloudinary.service';
import { UploadService } from './services/upload.service';
import { EmailService } from './services/email.service';
// Import controllers
import { UploadController } from './controllers/upload.controller';

/**
 * @Module() - Đánh dấu class này là NestJS module
 * CommonModule - Module cung cấp các services và controllers dùng chung
 *
 * Chức năng chính:
 * - File upload (Cloudinary, Firebase)
 * - Email sending
 * - Common utilities
 *
 * Dependencies:
 * - ConfigModule: Environment variables
 *
 * Exports:
 * - CloudinaryService: Để các modules khác sử dụng
 * - UploadService: Để các modules khác sử dụng
 * - EmailService: Để các modules khác sử dụng
 */
@Module({
  imports: [ConfigModule],
  providers: [CloudinaryService, UploadService, EmailService],
  controllers: [UploadController],
  exports: [CloudinaryService, UploadService, EmailService],
})
export class CommonModule {}
