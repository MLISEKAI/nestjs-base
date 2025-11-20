import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * Simple upload DTO - chỉ có file và folder
 */
export class SimpleUploadDto {
  @ApiPropertyOptional({
    example: 'avatars',
    description: 'Thư mục lưu trữ (mặc định: uploads)',
    default: 'uploads',
  })
  @IsOptional()
  @IsString()
  folder?: string;
}
