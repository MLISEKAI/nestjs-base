import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

/**
 * File upload DTO (for avatar, images, etc.)
 */
export class FileUploadDto {
  @ApiProperty({ 
    example: 'https://example.com/avatar.jpg', 
    description: 'URL of the uploaded file' 
  })
  @IsNotEmpty()
  @IsString()
  @IsUrl()
  fileUrl: string;
}

