// Import các decorator và class từ NestJS để tạo controller
import {
  Controller, // Decorator đánh dấu class là controller
  Post, // Decorator cho HTTP POST method
  Delete, // Decorator cho HTTP DELETE method
  UseInterceptors, // Decorator để sử dụng interceptors (file upload)
  UploadedFile, // Decorator để lấy uploaded file
  UploadedFiles, // Decorator để lấy multiple uploaded files
  UseGuards, // Decorator để sử dụng guard (authentication, authorization)
  Body, // Decorator để lấy body từ request
  Param, // Decorator để lấy parameter từ URL
  BadRequestException, // Exception cho bad request
} from '@nestjs/common';
// Import file interceptors từ NestJS platform-express
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
// Import các decorator từ Swagger để tạo API documentation
import {
  ApiTags, // Nhóm các endpoints trong Swagger UI
  ApiOperation, // Mô tả operation
  ApiConsumes, // Mô tả content type (multipart/form-data)
  ApiBearerAuth, // Yêu cầu JWT token trong header
  ApiBody, // Mô tả request body
  ApiParam, // Mô tả path parameter
} from '@nestjs/swagger';
// Import AuthGuard từ Passport để xác thực JWT token
import { AuthGuard } from '@nestjs/passport';
// Import UploadService để xử lý business logic
import { UploadService } from '../services/upload.service';
// Import DTO để validate và type-check dữ liệu
import { SimpleUploadDto } from '../dto/simple-upload.dto';

/**
 * @ApiTags('Upload') - Nhóm các endpoints này trong Swagger UI với tag "Upload"
 * @Controller('uploads') - Định nghĩa base route là /uploads
 *
 * UploadController - Controller xử lý các HTTP requests liên quan đến file uploads
 *
 * Chức năng chính:
 * - Upload images (single hoặc multiple)
 * - Upload videos với thumbnail generation
 * - Upload audio với duration extraction
 * - Delete uploaded files
 *
 * Lưu ý:
 * - Tất cả endpoints đều yêu cầu authentication (JWT token)
 * - Files được upload lên Cloudinary (hoặc mock URLs trong dev mode)
 */
@ApiTags('Upload')
@Controller('uploads')
export class UploadController {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject UploadService khi tạo instance của controller
   */
  constructor(private readonly uploadService: UploadService) {}

  @Post('images')
  @ApiOperation({
    summary: 'Tải ảnh lên',
    description:
      'Upload một hoặc nhiều ảnh. Trả về danh sách URLs sau khi upload. Có thể upload 1 hoặc nhiều file cùng lúc. Có thể dùng cho post hoặc mục đích khác.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description:
            'Danh sách file ảnh cần upload (tối đa 10 files). Có thể upload 1 hoặc nhiều file.',
        },
        folder: {
          type: 'string',
          description:
            'Thư mục lưu trữ (mặc định: uploads/images, có thể dùng posts/images cho post)',
          example: 'posts/images',
        },
      },
      required: ['files'],
    },
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('account-auth'))
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() uploadDto?: SimpleUploadDto,
  ) {
    const folder = uploadDto?.folder || 'uploads/images';

    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    // Upload tất cả files
    const urls = await this.uploadService.uploadMultipleImages(files, folder);

    // Luôn trả về format thống nhất (array) dù là 1 hay nhiều files
    // Frontend chỉ cần xử lý 1 format duy nhất
    return {
      items: files.map((file, index) => ({
        url: urls[index],
        thumbnail_url: urls[index], // Image URL cũng là thumbnail
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        media_type: 'image',
      })),
      count: files.length,
    };
  }

  @Post('videos')
  @ApiOperation({
    summary: 'Tải video lên',
    description:
      'Upload một video. Trả về URL video + thumbnail. Có thể dùng cho post hoặc mục đích khác.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File video cần upload (MP4, MOV, AVI, WebM, tối đa 100MB)',
        },
        folder: {
          type: 'string',
          description:
            'Thư mục lưu trữ (mặc định: uploads/videos, có thể dùng posts/videos cho post)',
          example: 'posts/videos',
        },
      },
      required: ['file'],
    },
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('account-auth'))
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto?: SimpleUploadDto,
  ) {
    const folder = uploadDto?.folder || 'uploads/videos';
    const result = await this.uploadService.uploadVideo(file, folder);
    return {
      url: result.url,
      thumbnail_url: result.thumbnail_url,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      media_type: 'video',
    };
  }

  @Post('audio')
  @ApiOperation({
    summary: 'Upload voice',
    description:
      'Nhận file audio (.m4a, .aac, .wav, .mp3, .ogg, .webm) và trả về file_url + duration. Duration được tự động extract từ audio metadata. Có thể dùng cho post hoặc mục đích khác.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File audio cần upload (MP3, WAV, OGG, AAC, WebM, M4A, tối đa 10MB)',
        },
        folder: {
          type: 'string',
          description:
            'Thư mục lưu trữ (mặc định: uploads/audio, có thể dùng posts/audio cho post)',
          example: 'posts/audio',
        },
      },
      required: ['file'],
    },
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('account-auth'))
  @UseInterceptors(FileInterceptor('file'))
  async uploadAudio(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto?: SimpleUploadDto,
  ) {
    const folder = uploadDto?.folder || 'uploads/audio';
    // Upload audio file và extract duration từ metadata
    const { url, duration } = await this.uploadService.uploadAudio(file, folder);

    // Build response với duration (nếu có)
    // duration có thể là undefined nếu không thể extract từ metadata
    return {
      file_url: url,
      url: url, // Alias cho compatibility
      duration: duration, // Duration in seconds (undefined nếu không thể extract)
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      media_type: 'audio',
    };
  }

  @Delete(':file_id')
  @ApiOperation({
    summary: 'Xóa file upload',
    description: 'Nếu người dùng remove ảnh/video/voice. (optional)',
  })
  @ApiParam({ name: 'file_id', description: 'File ID hoặc URL để xóa' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('account-auth'))
  async deleteFile(@Param('file_id') fileId: string) {
    // TODO: Implement file deletion from storage (S3, Cloudinary, etc.)
    // For now, just return success
    return {
      status: 'success',
      message: 'File deleted successfully',
    };
  }
}
