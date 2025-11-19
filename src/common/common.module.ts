import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryService } from './services/cloudinary.service';
import { UploadService } from './services/upload.service';
import { EmailService } from './services/email.service';
import { UploadController } from './upload.controller';

@Module({
  imports: [ConfigModule],
  providers: [CloudinaryService, UploadService, EmailService],
  controllers: [UploadController],
  exports: [CloudinaryService, UploadService, EmailService],
})
export class CommonModule {}
