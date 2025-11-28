import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsArray, IsBoolean } from 'class-validator';
import { ConversationType } from '../../../common/enums';
import type {
  IPaginatedResponse,
  IPaginationMeta,
} from '../../../common/interfaces/pagination.interface';

/**
 * DTO để tạo cuộc trò chuyện mới
 * - Nếu type = 'direct': cần có participantId (ID của người khác muốn nhắn tin, KHÔNG phải ID của bạn)
 * - Nếu type = 'group': cần có memberIds (danh sách ID các thành viên khác, KHÔNG bao gồm ID của bạn)
 *
 * Lưu ý: ID của bạn (người tạo conversation) sẽ tự động lấy từ JWT token, không cần gửi trong request
 */
export class CreateConversationDto {
  @ApiProperty({
    example: 'direct',
    enum: ConversationType,
    description: 'Loại cuộc trò chuyện: "direct" (tin nhắn 2 người) hoặc "group" (tin nhắn nhóm)',
  })
  @IsEnum(ConversationType)
  type: ConversationType;

  @ApiPropertyOptional({
    example: ['otherUser_id'],
    description:
      'ID người khác muốn nhắn tin (bắt buộc nếu type = "direct") - ID của người bạn muốn nhắn tin trực tiếp. KHÔNG phải ID của bạn (ID của bạn tự động lấy từ JWT token)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  otherUserId?: string[];
}

/**
 * DTO để cập nhật tên hiển thị của cuộc trò chuyện
 * Cho phép đặt tên tùy chỉnh cho cuộc trò chuyện (ví dụ: "Nhóm bạn thân", "Chat với Anh")
 */
export class UpdateConversationDisplayNameDto {
  @ApiProperty({
    example: 'Nhóm bạn thân',
    description:
      'Tên hiển thị tùy chỉnh cho cuộc trò chuyện này - Tên mà bạn muốn đặt cho cuộc chat',
  })
  @IsString()
  displayName: string;
}

/**
 * DTO để đánh dấu tin nhắn đã đọc
 * - Nếu không truyền messageIds: đánh dấu tất cả tin nhắn trong cuộc trò chuyện là đã đọc
 * - Nếu truyền messageIds: chỉ đánh dấu các tin nhắn có ID trong danh sách
 */
export class MarkReadDto {
  @ApiPropertyOptional({
    example: ['msg-1', 'msg-2'],
    description:
      'Danh sách ID các tin nhắn cần đánh dấu đã đọc. Nếu để trống hoặc không truyền, sẽ đánh dấu tất cả tin nhắn trong cuộc trò chuyện là đã đọc',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  messageIds?: string[];
}

/**
 * DTO để cập nhật cài đặt thông báo cho cuộc trò chuyện
 * - enabled = true: Bật thông báo (sẽ nhận thông báo khi có tin nhắn mới)
 * - enabled = false: Tắt thông báo (không nhận thông báo)
 */
export class UpdateNotificationsDto {
  @ApiProperty({
    example: false,
    description:
      'Bật/tắt thông báo cho cuộc trò chuyện này. true = bật thông báo, false = tắt thông báo',
  })
  @IsBoolean()
  enabled: boolean;
}

/**
 * DTO để cập nhật cài đặt âm thanh quà tặng
 * - enabled = true: Bật âm thanh khi có người gửi quà trong chat
 * - enabled = false: Tắt âm thanh quà tặng
 */
export class UpdateGiftSoundsDto {
  @ApiProperty({
    example: true,
    description: 'Bật/tắt âm thanh quà tặng. true = bật âm thanh khi có quà, false = tắt âm thanh',
  })
  @IsBoolean()
  enabled: boolean;
}

/**
 * DTO để báo cáo cuộc trò chuyện (spam, nội dung không phù hợp, v.v.)
 */
export class ReportChatDto {
  @ApiProperty({
    example: 'spam',
    description:
      'Lý do báo cáo cuộc trò chuyện (ví dụ: "spam", "harassment", "inappropriate_content")',
  })
  @IsString()
  reason: string;

  @ApiPropertyOptional({
    example: 'Người này gửi tin nhắn spam liên tục',
    description: 'Chi tiết bổ sung về lý do báo cáo - Mô tả thêm về vấn đề bạn gặp phải',
  })
  @IsOptional()
  @IsString()
  details?: string;
}

/**
 * Response DTO cho cuộc trò chuyện
 */
export class ConversationResponseDto {
  @ApiProperty({ example: 'conv-1', description: 'ID cuộc trò chuyện' })
  id: string;

  @ApiProperty({ example: 'direct', enum: ConversationType, description: 'Loại cuộc trò chuyện' })
  type: ConversationType;

  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Tên hiển thị' })
  name: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', description: 'URL avatar' })
  avatar?: string;

  @ApiPropertyOptional({
    example: {
      id: 'message-1',
      content: 'Xin chào!',
      type: 'text',
      sender: {
        id: 'user-1',
        nickname: 'Nguyễn Văn A',
        avatar: 'https://example.com/avatar.jpg',
      },
      createdAt: '2025-11-12T10:00:00.000Z',
    },
    description: 'Tin nhắn cuối cùng',
  })
  lastMessage?: any;

  @ApiProperty({ example: 2, description: 'Số tin nhắn chưa đọc' })
  unreadCount: number;

  @ApiProperty({ example: '2025-11-12T10:00:00.000Z', description: 'Thời gian cập nhật' })
  updatedAt: Date;

  @ApiProperty({
    example: [
      {
        id: 'user-1',
        nickname: 'Nguyễn Văn A',
        avatar: 'https://example.com/avatar.jpg',
        displayName: 'Anh A',
      },
    ],
    description: 'Danh sách thành viên',
  })
  participants: any[];

  @ApiPropertyOptional({ description: 'Thông tin nhóm (nếu là group chat)' })
  group?: any;

  @ApiPropertyOptional({ description: 'Cài đặt cuộc trò chuyện' })
  settings?: any;
}

/**
 * Response DTO cho danh sách cuộc trò chuyện với pagination
 */
export class ConversationListResponseDto implements IPaginatedResponse<ConversationResponseDto> {
  @ApiProperty({
    type: [ConversationResponseDto],
    example: [
      {
        id: 'conv-1',
        type: 'direct',
        name: 'Nguyễn Văn A',
        avatar: 'https://example.com/avatar.jpg',
        lastMessage: {
          id: 'message-1',
          content: 'Xin chào!',
          type: 'text',
          sender: {
            id: 'user-1',
            nickname: 'Nguyễn Văn A',
          },
          createdAt: '2025-11-12T10:00:00.000Z',
        },
        unreadCount: 2,
        updatedAt: '2025-11-12T10:00:00.000Z',
        participants: [
          {
            id: 'user-1',
            nickname: 'Nguyễn Văn A',
            avatar: 'https://example.com/avatar.jpg',
          },
        ],
      },
    ],
    description: 'Danh sách cuộc trò chuyện',
  })
  items: ConversationResponseDto[];

  @ApiProperty({
    example: {
      item_count: 20,
      total_items: 50,
      items_per_page: 20,
      total_pages: 3,
      current_page: 1,
    },
    description: 'Thông tin phân trang',
  })
  meta: IPaginationMeta;
}
