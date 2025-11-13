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
