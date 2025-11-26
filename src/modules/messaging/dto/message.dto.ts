import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  IsObject,
  ValidateIf,
} from 'class-validator';
import { MessageType } from '../../../common/enums';
import type { BusinessCardData } from '../../../common/interfaces';
import type {
  IPaginatedResponse,
  IPaginationMeta,
} from '../../../common/interfaces/pagination.interface';

/**
 * DTO để gửi tin nhắn trong cuộc trò chuyện
 * Tùy theo loại tin nhắn (type) mà các trường khác nhau sẽ được sử dụng:
 * - text: chỉ cần content
 * - image/video/audio: cần mediaUrl, có thể có mediaThumbnail, mediaSize, mediaDuration
 * - audio: có thể có waveform (dữ liệu sóng âm để hiển thị)
 * - gift: cần giftId hoặc giftItemId
 * - business_card: cần userId và có thể có cardData
 */
export class SendMessageDto {
  @ApiProperty({ enum: MessageType, description: 'Loại tin nhắn' })
  @IsEnum(MessageType)
  type: MessageType;

  @ApiPropertyOptional({ example: 'Xin chào!', description: 'Nội dung tin nhắn' })
  @IsString()
  @ValidateIf((o) => o.type === MessageType.TEXT)
  content?: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg', description: 'URL media' })
  @IsString()
  @ValidateIf((o) => [MessageType.IMAGE, MessageType.VIDEO, MessageType.AUDIO].includes(o.type))
  mediaUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/thumb.jpg', description: 'Thumbnail' })
  @IsString()
  @IsOptional()
  mediaThumbnail?: string;

  @ApiPropertyOptional({ example: 1024000, description: 'Dung lượng file' })
  @IsNumber()
  @IsOptional()
  mediaSize?: number;

  @ApiPropertyOptional({ example: 8, description: 'Thời lượng media (s)' })
  @IsNumber()
  @IsOptional()
  mediaDuration?: number;

  @ApiPropertyOptional({ example: [0.2, 0.5, 0.8], description: 'Waveform audio' })
  @IsArray()
  @IsOptional()
  waveform?: number[];

  @ApiPropertyOptional({ example: 'gift-123', description: 'Gift ID' })
  @IsString()
  @ValidateIf((o) => o.type === MessageType.GIFT)
  giftId?: string;

  @ApiPropertyOptional({ example: 101, description: 'Gift item ID' })
  @IsNumber()
  @ValidateIf((o) => o.type === MessageType.GIFT)
  giftItemId?: number;
}

/**
 * DTO để chuyển tiếp tin nhắn
 * Cho phép chuyển tiếp một hoặc nhiều tin nhắn từ cuộc trò chuyện này sang các cuộc trò chuyện khác
 */
export class ForwardMessageDto {
  @ApiProperty({
    example: ['msg-1', 'msg-2'],
    description:
      'Danh sách ID các tin nhắn muốn chuyển tiếp - ID của các tin nhắn bạn muốn gửi lại cho người khác',
  })
  @IsArray()
  @IsString({ each: true })
  messageIds: string[];

  @ApiProperty({
    example: ['user-1', 'user-2'],
    description:
      'Danh sách ID người nhận (có thể chuyển tiếp đến nhiều người) - ID của những người bạn muốn gửi tin nhắn này đến',
  })
  @IsArray()
  @IsString({ each: true })
  recipientIds: string[];

  @ApiProperty({
    example: 'conv-123',
    description:
      'ID của cuộc trò chuyện nguồn (nơi chứa tin nhắn muốn chuyển tiếp) - ID của cuộc chat mà tin nhắn đang ở đó',
  })
  @IsString()
  conversationId: string;
}

/**
 * Response DTO cho tin nhắn
 */
export class MessageResponseDto {
  @ApiProperty({ example: 'message-1', description: 'ID của tin nhắn' })
  id: string;

  @ApiProperty({ example: 'conv-1', description: 'ID của cuộc trò chuyện' })
  conversationId: string;

  @ApiProperty({
    example: {
      id: 'user-1',
      nickname: 'Nguyễn Văn A',
      avatar: 'https://example.com/avatar.jpg',
    },
    description: 'Thông tin người gửi',
  })
  sender: {
    id: string;
    nickname: string;
    avatar?: string;
  };

  @ApiProperty({ example: 'text', enum: MessageType, description: 'Loại tin nhắn' })
  type: MessageType;

  @ApiPropertyOptional({ example: 'Xin chào!', description: 'Nội dung tin nhắn' })
  content?: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg', description: 'URL media' })
  mediaUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/thumb.jpg', description: 'URL thumbnail' })
  mediaThumbnail?: string;

  @ApiPropertyOptional({ example: 1024000, description: 'Kích thước file (bytes)' })
  mediaSize?: number;

  @ApiPropertyOptional({ example: 8, description: 'Thời lượng media (giây)' })
  mediaDuration?: number;

  @ApiPropertyOptional({ example: [0.2, 0.5, 0.8], description: 'Waveform cho audio' })
  waveform?: number[];

  @ApiProperty({ example: false, description: 'Đã đọc chưa' })
  isRead: boolean;

  @ApiProperty({ example: false, description: 'Có phải tin nhắn chuyển tiếp không' })
  isForwarded: boolean;

  @ApiPropertyOptional({
    example: {
      id: 'gift-1',
      giftItem: {
        id: 101,
        name: 'Hoa hồng',
        image_url: 'https://example.com/rose.jpg',
        price: 1000,
      },
      quantity: 1,
      message: 'Tặng bạn một bông hoa',
    },
    description: 'Thông tin quà tặng (nếu có)',
  })
  gift?: any;

  @ApiPropertyOptional({ example: 'user-456', description: 'ID người dùng trong business card' })
  businessCardUserId?: string;

  @ApiProperty({ example: '2025-11-12T10:00:00.000Z', description: 'Thời gian tạo' })
  createdAt: Date;

  @ApiProperty({ example: '2025-11-12T10:00:00.000Z', description: 'Thời gian cập nhật' })
  updatedAt: Date;
}

/**
 * Response DTO cho danh sách tin nhắn với pagination
 */
export class MessageListResponseDto implements IPaginatedResponse<MessageResponseDto> {
  @ApiProperty({
    type: [MessageResponseDto],
    example: [
      {
        id: 'message-1',
        conversationId: 'conv-1',
        sender: {
          id: 'user-1',
          nickname: 'Nguyễn Văn A',
          avatar: 'https://example.com/avatar.jpg',
        },
        type: 'text',
        content: 'Xin chào!',
        isRead: false,
        isForwarded: false,
        createdAt: '2025-11-12T10:00:00.000Z',
        updatedAt: '2025-11-12T10:00:00.000Z',
      },
    ],
    description: 'Danh sách tin nhắn',
  })
  items: MessageResponseDto[];

  @ApiProperty({
    example: {
      item_count: 50,
      total_items: 200,
      items_per_page: 50,
      total_pages: 4,
      current_page: 1,
    },
    description: 'Thông tin phân trang',
  })
  meta: IPaginationMeta;
}
