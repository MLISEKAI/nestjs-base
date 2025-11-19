import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  Req,
  Body,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UploadService } from '../services/upload.service';
import { ImageTransformationDto } from '../dto/image-transformation.dto';
import { ImageTransformationOptions } from '../interfaces/image-transformation.interface';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @ApiOperation({
    summary: 'Upload một ảnh',
    description:
      'Upload ảnh với tùy chọn transformation (resize, crop, quality, format, etc.). Hỗ trợ Cloudinary transformations.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        folder: {
          type: 'string',
          description: 'Thư mục lưu trữ (mặc định: uploads)',
          example: 'avatars',
        },
        width: {
          type: 'number',
          description: 'Width in pixels (1-5000)',
          example: 800,
        },
        height: {
          type: 'number',
          description: 'Height in pixels (1-5000)',
          example: 600,
        },
        crop: {
          type: 'string',
          enum: ['fill', 'fit', 'scale', 'crop', 'thumb'],
          description: 'Crop mode',
          example: 'fill',
        },
        gravity: {
          type: 'string',
          enum: ['face', 'auto', 'center', 'north', 'south', 'east', 'west'],
          description: 'Gravity for crop',
          example: 'auto',
        },
        quality: {
          type: 'string',
          description: 'Quality: auto, auto:best, auto:good, auto:eco, auto:low, or 1-100',
          example: 'auto',
        },
        format: {
          type: 'string',
          enum: ['jpg', 'png', 'webp', 'avif', 'auto'],
          description: 'Output format',
          example: 'webp',
        },
        aspectRatio: {
          type: 'string',
          description: 'Aspect ratio (e.g., 16:9, 1:1)',
          example: '16:9',
        },
        radius: {
          type: 'string',
          description: 'Radius for rounded corners (pixels or "max")',
          example: '20',
        },
        effect: {
          type: 'string',
          description: 'Effect: blur:100, sharpen, grayscale, sepia, etc.',
          example: 'grayscale',
        },
      },
    },
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('account-auth'))
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
    @Body() transformationDto: ImageTransformationDto,
  ) {
    const folder = (req.body?.folder as string) || 'uploads';

    // Parse transformation options from request body
    const transformation: ImageTransformationOptions | undefined = this.parseTransformation(
      req.body,
    );

    const url = await this.uploadService.uploadImage(file, folder, transformation);
    return {
      url,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      transformation: transformation || null,
    };
  }

  @Post('images')
  @ApiOperation({
    summary: 'Upload nhiều ảnh',
    description: 'Upload nhiều ảnh cùng lúc với tùy chọn transformation. Tối đa 10 files.',
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
        },
        folder: {
          type: 'string',
          description: 'Thư mục lưu trữ (mặc định: uploads)',
          example: 'gallery',
        },
        width: {
          type: 'number',
          description: 'Width in pixels (1-5000)',
          example: 800,
        },
        height: {
          type: 'number',
          description: 'Height in pixels (1-5000)',
          example: 600,
        },
        crop: {
          type: 'string',
          enum: ['fill', 'fit', 'scale', 'crop', 'thumb'],
          description: 'Crop mode',
          example: 'fill',
        },
        quality: {
          type: 'string',
          description: 'Quality: auto, auto:best, auto:good, auto:eco, auto:low, or 1-100',
          example: 'auto',
        },
        format: {
          type: 'string',
          enum: ['jpg', 'png', 'webp', 'avif', 'auto'],
          description: 'Output format',
          example: 'webp',
        },
      },
    },
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('account-auth'))
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
    @Body() transformationDto: ImageTransformationDto,
  ) {
    const folder = (req.body?.folder as string) || 'uploads';

    // Parse transformation options from request body
    const transformation: ImageTransformationOptions | undefined = this.parseTransformation(
      req.body,
    );

    const urls = await this.uploadService.uploadMultipleImages(files, folder, transformation);
    return {
      urls,
      count: urls.length,
      transformation: transformation || null,
    };
  }

  /**
   * Parse transformation options from request body
   */
  private parseTransformation(body: any): ImageTransformationOptions | undefined {
    const hasTransformation =
      body.width ||
      body.height ||
      body.crop ||
      body.gravity ||
      body.quality ||
      body.format ||
      body.aspectRatio ||
      body.radius ||
      body.effect;

    if (!hasTransformation) {
      return undefined;
    }

    const transformation: ImageTransformationOptions = {};

    if (body.width) {
      const width = parseInt(body.width, 10);
      if (!isNaN(width) && width > 0) transformation.width = width;
    }

    if (body.height) {
      const height = parseInt(body.height, 10);
      if (!isNaN(height) && height > 0) transformation.height = height;
    }

    if (body.crop) {
      transformation.crop = body.crop as any;
    }

    if (body.gravity) {
      transformation.gravity = body.gravity as any;
    }

    if (body.quality) {
      // Check if it's a number or string
      const qualityNum = parseInt(body.quality, 10);
      if (!isNaN(qualityNum) && qualityNum >= 1 && qualityNum <= 100) {
        transformation.quality = qualityNum;
      } else {
        transformation.quality = body.quality as any;
      }
    }

    if (body.format) {
      transformation.format = body.format as any;
    }

    if (body.aspectRatio) {
      transformation.aspectRatio = body.aspectRatio;
    }

    if (body.radius) {
      const radiusNum = parseInt(body.radius, 10);
      if (!isNaN(radiusNum) && radiusNum >= 0) {
        transformation.radius = radiusNum;
      } else if (body.radius === 'max') {
        transformation.radius = 'max';
      }
    }

    if (body.effect) {
      transformation.effect = body.effect;
    }

    return Object.keys(transformation).length > 0 ? transformation : undefined;
  }
}
