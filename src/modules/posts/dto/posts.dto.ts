import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';

export class PostDto {
  @ApiProperty({ example: 'post-1' })
  id: string;

  @ApiProperty({ example: 'user-1' })
  userId: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'Hello world!' })
  content?: string;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ example: 100 })
  likes?: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ example: 20 })
  comments?: number;
}

export class CreatePostDto {
  @ApiProperty({ example: 'Hello world!' })
  @IsString()
  content?: string;
}

export class UpdatePostDto {
  @ApiProperty({ example: 'Edited content', required: false })
  @IsString()
  content?: string;
}

export class CreatePostMediaDto {
  @ApiProperty({ example: 'https://example.com/image.jpg', description: 'URL của media' })
  @IsString()
  media_url: string;

  @ApiProperty({ example: 'image', description: 'Loại media: image, video, audio, file' })
  @IsString()
  media_type: string;

  @ApiProperty({ example: 1, description: 'Thứ tự hiển thị', required: false })
  @IsOptional()
  @IsNumber()
  order?: number;
}

export class UpdatePostMediaDto {
  @ApiProperty({ example: 'https://example.com/image.jpg', required: false })
  @IsOptional()
  @IsString()
  media_url?: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  order?: number;
}
