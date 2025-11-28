import { IsString, IsEnum, IsOptional, MaxLength, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '../../../common/enums';

export class SendMessageDto {
  @ApiProperty({
    description: 'Loại tin nhắn (chỉ cho phép icon hoặc gift)',
    enum: [MessageType.ICON, MessageType.GIFT],
    example: MessageType.ICON,
  })
  @IsEnum(MessageType)
  type: MessageType;

  @ApiProperty({
    description: 'Nội dung tin nhắn (icon ID hoặc gift ID)',
    example: 'icon_heart',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  content: string;
}

export class SendGiftDto {
  @ApiProperty({
    description: 'ID của quà tặng',
    example: 'gift_diamond',
  })
  @IsString()
  gift_id: string;

  @ApiProperty({
    description: 'ID người nhận quà',
    example: 'u789',
  })
  @IsString()
  recipientId: string;

  @ApiPropertyOptional({
    description: 'Số lượng quà',
    example: 10,
    minimum: 1,
    default: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number = 1;
}
