import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for sending direct message to user (legacy endpoint POST /messages)
 * This is different from SendMessageDto in messaging module which is for conversation messages
 * Using different name to avoid Swagger duplicate DTO warning
 */
export class SendDirectMessageDto {
  @ApiProperty({ example: 'user-456', description: 'ID người nhận' })
  @IsNotEmpty()
  @IsString()
  recipient_id: string;

  @ApiProperty({
    example: 'Xin chào, bạn khỏe không?',
    description: 'Nội dung tin nhắn',
  })
  @IsNotEmpty()
  @IsString()
  content: string;
}
