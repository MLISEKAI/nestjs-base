import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

/**
 * DTO để gửi tín hiệu đang gõ (typing indicator)
 * Cho phép thông báo cho người khác biết bạn đang gõ tin nhắn
 * - isTyping = true: Bắt đầu gõ (hiển thị "đang gõ...")
 * - isTyping = false: Dừng gõ (ẩn indicator)
 */
export class TypingIndicatorDto {
  @ApiProperty({
    example: true,
    description:
      'Trạng thái đang gõ: true = đang gõ tin nhắn (hiển thị "đang gõ..."), false = dừng gõ (ẩn indicator)',
  })
  @IsBoolean()
  isTyping: boolean;
}
