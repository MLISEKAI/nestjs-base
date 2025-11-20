import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  Body,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UploadService } from '../services/upload.service';
import { SimpleUploadDto } from '../dto/simple-upload.dto';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @ApiOperation({
    summary: 'Upload một ảnh',
    description: 'Upload một ảnh đơn giản, chỉ cần file và folder (optional).',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File ảnh cần upload',
        },
        folder: {
          type: 'string',
          description: 'Thư mục lưu trữ (mặc định: uploads)',
          example: 'avatars',
        },
      },
      required: ['file'],
    },
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('account-auth'))
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File, @Body() uploadDto: SimpleUploadDto) {
    const folder = uploadDto.folder || 'uploads';

    const url = await this.uploadService.uploadImage(file, folder);
    return {
      url,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @Post('images')
  @ApiOperation({
    summary: 'Upload nhiều ảnh',
    description: 'Upload nhiều ảnh cùng lúc, chỉ cần files và folder (optional). Tối đa 10 files.',
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
          description: 'Danh sách file ảnh cần upload (tối đa 10 files)',
        },
        folder: {
          type: 'string',
          description: 'Thư mục lưu trữ (mặc định: uploads)',
          example: 'gallery',
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
    @Body() uploadDto: SimpleUploadDto,
  ) {
    const folder = uploadDto.folder || 'uploads';

    const urls = await this.uploadService.uploadMultipleImages(files, folder);
    return {
      urls,
      count: urls.length,
    };
  }
}
