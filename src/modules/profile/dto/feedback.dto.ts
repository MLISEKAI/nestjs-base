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
  userId?: string;
}
