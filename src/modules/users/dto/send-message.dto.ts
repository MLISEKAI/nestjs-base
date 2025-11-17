import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: 'user-456', description: 'ID người nhận' })
  @IsNotEmpty()
  @IsString()
  recipientId: string;

  @ApiProperty({ example: 'Xin chào, bạn khỏe không?', description: 'Nội dung tin nhắn' })
  @IsNotEmpty()
  @IsString()
  content: string;
}
