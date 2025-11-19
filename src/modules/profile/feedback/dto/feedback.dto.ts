import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class FeedbackDto {
  @ApiProperty({ example: 'This app is great!', description: 'Nội dung phản hồi' })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({ example: 'user-1', description: 'ID user gửi phản hồi', required: false })
  @IsString()
  @IsOptional()
  user_id?: string;
}

export class FeedbackResponseDto {
  @ApiProperty({ example: 'fb-1' })
  id: string;

  @ApiProperty({ example: 'user-1' })
  user_id: string;

  @ApiProperty({ example: 'This app is great!' })
  message: string;

  @ApiProperty({ example: '2025-11-12T00:00:00.000Z' })
  created_at: string;

  @ApiProperty({ example: '2025-11-12T01:00:00.000Z', required: false })
  updated_at?: string;
}
