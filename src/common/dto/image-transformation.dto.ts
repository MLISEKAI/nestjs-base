import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsNumber, IsString, IsEnum, Min, Max, Matches } from 'class-validator';

/**
 * DTO for image transformation options
 */
export class ImageTransformationDto {
  @ApiPropertyOptional({
    example: 800,
    description: 'Width in pixels',
    minimum: 1,
    maximum: 5000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5000)
  width?: number;

  @ApiPropertyOptional({
    example: 600,
    description: 'Height in pixels',
    minimum: 1,
    maximum: 5000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5000)
  height?: number;

  @ApiPropertyOptional({
    example: 'fill',
    description: 'Crop mode',
    enum: ['fill', 'fit', 'scale', 'crop', 'thumb'],
  })
  @IsOptional()
  @IsEnum(['fill', 'fit', 'scale', 'crop', 'thumb'])
  crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb';

  @ApiPropertyOptional({
    example: 'auto',
    description: 'Gravity for crop (face detection, auto, center, etc.)',
    enum: ['face', 'auto', 'center', 'north', 'south', 'east', 'west'],
  })
  @IsOptional()
  @IsEnum(['face', 'auto', 'center', 'north', 'south', 'east', 'west'])
  gravity?: 'face' | 'auto' | 'center' | 'north' | 'south' | 'east' | 'west';

  @ApiPropertyOptional({
    example: 'auto',
    description: 'Quality: auto, auto:best, auto:good, auto:eco, auto:low, or number 1-100',
  })
  @IsOptional()
  @IsString()
  quality?: string;

  @ApiPropertyOptional({
    example: 'webp',
    description: 'Output format',
    enum: ['jpg', 'png', 'webp', 'avif', 'auto'],
  })
  @IsOptional()
  @IsEnum(['jpg', 'png', 'webp', 'avif', 'auto'])
  format?: 'jpg' | 'png' | 'webp' | 'avif' | 'auto';

  @ApiPropertyOptional({
    example: '16:9',
    description: 'Aspect ratio (e.g., 16:9, 1:1, 4:3)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d+:\d+$/, {
    message: 'Aspect ratio must be in format "width:height" (e.g., 16:9)',
  })
  aspectRatio?: string;

  @ApiPropertyOptional({
    example: 20,
    description: 'Radius for rounded corners (pixels) or "max"',
  })
  @IsOptional()
  @IsString()
  radius?: string;

  @ApiPropertyOptional({
    example: 'grayscale',
    description: 'Effect: blur:100, sharpen, grayscale, sepia, etc.',
  })
  @IsOptional()
  @IsString()
  effect?: string;

  @ApiPropertyOptional({
    example: 'avatars',
    description: 'Thư mục lưu trữ (mặc định: uploads)',
    default: 'uploads',
  })
  @IsOptional()
  @IsString()
  folder?: string;
}
