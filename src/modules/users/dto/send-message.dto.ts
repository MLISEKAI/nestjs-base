import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: 'Target ID' })
  @IsNotEmpty()
  @IsString()
  recipientId: string;

  @ApiProperty({ example: 'Xin chào, bạn khỏe không?' })
  @IsNotEmpty()
  @IsString()
  content: string;
}
