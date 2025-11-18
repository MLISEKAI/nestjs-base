import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseService } from './services/firebase.service';
import { UploadService } from './services/upload.service';
import { EmailService } from './services/email.service';
import { UploadController } from './upload.controller';

@Module({
  imports: [ConfigModule],
  providers: [FirebaseService, UploadService, EmailService],
  controllers: [UploadController],
  exports: [FirebaseService, UploadService, EmailService],
})
export class CommonModule {}
