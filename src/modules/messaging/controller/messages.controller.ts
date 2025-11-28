import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  getSchemaPath,
  ApiExtraModels,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MessageService } from '../service/message.service';
import {
  SendMessageDto,
  ForwardMessageDto,
  MessageResponseDto,
  MessageListResponseDto,
} from '../dto/message.dto';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import type { AuthenticatedRequest } from '../../../common/interfaces/request.interface';
import { MessageType } from 'src/common/enums';

@ApiTags('Messages')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard('account-auth'))
@ApiBearerAuth('JWT-auth')
@ApiExtraModels()
@Controller('messages/:conversationId')
export class MessagesController {
  constructor(private readonly messageService: MessageService) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách tin nhắn trong cuộc trò chuyện',
    description:
      'Trả về danh sách tin nhắn trong cuộc trò chuyện, có phân trang và tìm kiếm. Tin nhắn được sắp xếp theo thời gian (mới nhất trước)',
  })
  @ApiParam({ name: 'conversationId', description: 'ID của cuộc trò chuyện muốn xem tin nhắn' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng tin nhắn mỗi trang (mặc định: 50)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Từ khóa tìm kiếm trong nội dung tin nhắn',
  })
  @ApiOkResponse({
    type: MessageListResponseDto,
    description: 'Danh sách tin nhắn với thông tin người gửi, thời gian, và phân trang',
    example: {
      items: [
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
        {
          id: 'message-2',
          conversationId: 'conv-1',
          sender: {
            id: 'user-2',
            nickname: 'Trần Thị B',
            avatar: 'https://example.com/avatar2.jpg',
          },
          type: 'image',
          content: null,
          mediaUrl: 'https://example.com/image.jpg',
          mediaThumbnail: 'https://example.com/thumb.jpg',
          mediaSize: 1024000,
          isRead: true,
          isForwarded: false,
          createdAt: '2025-11-12T10:05:00.000Z',
          updatedAt: '2025-11-12T10:05:00.000Z',
        },
      ],
      meta: {
        item_count: 50,
        total_items: 200,
        items_per_page: 50,
        total_pages: 4,
        current_page: 1,
      },
    },
  })
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Req() req: AuthenticatedRequest,
    @Query() query: BaseQueryDto,
  ) {
    return this.messageService.getMessages(conversationId, req.user.id, query);
  }

  @Post('messages')
  @ApiOperation({
    summary: 'Gửi tin nhắn trong cuộc trò chuyện',
    description:
      'Gửi tin nhắn mới vào cuộc trò chuyện. Hỗ trợ nhiều loại: văn bản, hình ảnh, video, audio, quà tặng, danh thiếp',
  })
  @ApiParam({ name: 'conversationId', description: 'ID của cuộc trò chuyện muốn gửi tin nhắn' })
  @ApiBody({ type: SendMessageDto })
  @ApiCreatedResponse({
    type: MessageResponseDto,
    description: 'Tin nhắn đã được gửi thành công và trả về thông tin tin nhắn vừa gửi',
    examples: {
      text: {
        summary: 'Tin nhắn văn bản',
        value: {
          id: 'message-1',
          conversationId: 'conv-1',
          sender: {
            id: 'user-1',
            nickname: 'Nguyễn Văn A',
            avatar: 'https://example.com/avatar.jpg',
          },
          type: 'text',
          content: 'Xin chào! Bạn khỏe không?',
          isRead: false,
          isForwarded: false,
          createdAt: '2025-11-12T10:00:00.000Z',
          updatedAt: '2025-11-12T10:00:00.000Z',
        },
      },
      image: {
        summary: 'Tin nhắn hình ảnh',
        value: {
          id: 'message-2',
          conversationId: 'conv-1',
          sender: {
            id: 'user-1',
            nickname: 'Nguyễn Văn A',
            avatar: 'https://example.com/avatar.jpg',
          },
          type: 'image',
          mediaUrl: 'https://example.com/image.jpg',
          mediaThumbnail: 'https://example.com/thumb.jpg',
          mediaSize: 1024000,
          mediaDuration: null,
          isRead: false,
          isForwarded: false,
          createdAt: '2025-11-12T10:05:00.000Z',
          updatedAt: '2025-11-12T10:05:00.000Z',
        },
      },
      video: {
        summary: 'Tin nhắn video',
        value: {
          id: 'message-3',
          conversationId: 'conv-1',
          sender: {
            id: 'user-1',
            nickname: 'Nguyễn Văn A',
            avatar: 'https://example.com/avatar.jpg',
          },
          type: 'video',
          mediaUrl: 'https://example.com/video.mp4',
          mediaThumbnail: 'https://example.com/video-thumb.jpg',
          mediaSize: 5242880,
          mediaDuration: 120,
          isRead: false,
          isForwarded: false,
          createdAt: '2025-11-12T10:10:00.000Z',
          updatedAt: '2025-11-12T10:10:00.000Z',
        },
      },
      audio: {
        summary: 'Tin nhắn audio',
        value: {
          id: 'message-4',
          conversationId: 'conv-1',
          sender: {
            id: 'user-1',
            nickname: 'Nguyễn Văn A',
            avatar: 'https://example.com/avatar.jpg',
          },
          type: 'audio',
          mediaUrl: 'https://example.com/audio.mp3',
          mediaSize: 2048000,
          mediaDuration: 30,
          waveform: [0.2, 0.5, 0.8, 0.6, 0.3],
          isRead: false,
          isForwarded: false,
          createdAt: '2025-11-12T10:15:00.000Z',
          updatedAt: '2025-11-12T10:15:00.000Z',
        },
      },
      gift: {
        summary: 'Tin nhắn quà tặng',
        value: {
          id: 'message-5',
          conversationId: 'conv-1',
          sender: {
            id: 'user-1',
            nickname: 'Nguyễn Văn A',
            avatar: 'https://example.com/avatar.jpg',
          },
          type: 'gift',
          gift_id: 'gift-123',
          giftItem_id: 101,
          content: 'Chúc bạn vui vẻ!',
          isRead: false,
          isForwarded: false,
          createdAt: '2025-11-12T10:20:00.000Z',
          updatedAt: '2025-11-12T10:20:00.000Z',
        },
      },
      business_card: {
        summary: 'Tin nhắn danh thiếp',
        value: {
          id: 'message-6',
          conversationId: 'conv-1',
          sender: {
            id: 'user-1',
            nickname: 'Nguyễn Văn A',
            avatar: 'https://example.com/avatar.jpg',
          },
          type: 'business_card',
          businessCard: {
            user_id: 'user-1',
            nickname: 'Nguyễn Văn A',
            avatar: 'https://example.com/avatar.jpg',
            bio: 'Xin chào, tôi là Nguyễn Văn A',
            gender: 'male',
          },
          isRead: false,
          isForwarded: false,
          createdAt: '2025-11-12T10:25:00.000Z',
          updatedAt: '2025-11-12T10:25:00.000Z',
        },
      },
    },
  })
  @ApiCreatedResponse({ type: MessageResponseDto, description: 'Tin nhắn đã gửi thành công' })
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: SendMessageDto,
  ) {
    return this.messageService.sendMessage(conversationId, req.user.id, dto);
  }

  @Delete(':messageId')
  @ApiOperation({
    summary: 'Xóa tin nhắn',
    description: 'Xóa tin nhắn khỏi cuộc trò chuyện. Chỉ người gửi hoặc admin mới có quyền xóa',
  })
  @ApiParam({ name: 'conversationId', description: 'ID của cuộc trò chuyện chứa tin nhắn' })
  @ApiParam({ name: 'messageId', description: 'ID của tin nhắn muốn xóa' })
  @ApiOkResponse({
    description: 'Tin nhắn đã được xóa thành công',
    example: {
      message: 'Message deleted successfully',
    },
  })
  async deleteMessage(@Param('messageId') messageId: string, @Req() req: AuthenticatedRequest) {
    return this.messageService.deleteMessage(messageId, req.user.id);
  }

  @Get('media')
  @ApiOperation({
    summary: 'Lấy thư viện media của cuộc trò chuyện',
    description:
      'Trả về danh sách tất cả hình ảnh, video, audio đã được gửi trong cuộc trò chuyện này, có phân trang',
  })
  @ApiParam({ name: 'conversationId', description: 'ID của cuộc trò chuyện muốn xem media' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng media mỗi trang (mặc định: 20)',
  })
  @ApiOkResponse({
    description: 'Danh sách media (hình ảnh, video, audio) đã được gửi trong cuộc trò chuyện',
    example: {
      items: [
        {
          id: 'message-1',
          type: 'image',
          mediaUrl: 'https://example.com/image.jpg',
          mediaThumbnail: 'https://example.com/thumb.jpg',
          createdAt: '2025-11-12T10:00:00.000Z',
        },
        {
          id: 'message-2',
          type: 'video',
          mediaUrl: 'https://example.com/video.mp4',
          mediaThumbnail: 'https://example.com/video-thumb.jpg',
          mediaDuration: 120,
          createdAt: '2025-11-12T10:05:00.000Z',
        },
      ],
      meta: {
        item_count: 20,
        total_items: 50,
        items_per_page: 20,
        total_pages: 3,
        current_page: 1,
      },
    },
  })
  async getMediaGallery(
    @Param('conversationId') conversationId: string,
    @Req() req: AuthenticatedRequest,
    @Query() query: BaseQueryDto,
  ) {
    return this.messageService.getMediaGallery(conversationId, req.user.id, query);
  }
}
