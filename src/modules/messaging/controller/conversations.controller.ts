import {
  Controller,
  Get,
  Post,
  Patch,
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
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ConversationService } from '../service/conversation.service';
import {
  CreateConversationDto,
  UpdateConversationDisplayNameDto,
  MarkReadDto,
  UpdateNotificationsDto,
  UpdateGiftSoundsDto,
  ReportChatDto,
  ConversationResponseDto,
  ConversationListResponseDto,
} from '../dto/conversation.dto';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import type { AuthenticatedRequest } from '../../../common/interfaces/request.interface';

@ApiTags('Messages')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard('account-auth'))
@ApiBearerAuth('JWT-auth')
@Controller('messages')
export class ConversationsController {
  constructor(private readonly conversationService: ConversationService) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách cuộc trò chuyện của người dùng',
    description:
      'Trả về danh sách tất cả các cuộc trò chuyện (direct và group) mà người dùng đang tham gia, có phân trang và tìm kiếm',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng mỗi trang (mặc định: 20)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Từ khóa tìm kiếm tên cuộc trò chuyện',
  })
  @ApiOkResponse({
    type: ConversationListResponseDto,
    description: 'Danh sách cuộc trò chuyện với thông tin chi tiết và phân trang',
    example: {
      items: [
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
      meta: {
        item_count: 20,
        total_items: 50,
        items_per_page: 20,
        total_pages: 3,
        current_page: 1,
      },
    },
  })
  async getConversations(@Req() req: AuthenticatedRequest, @Query() query: BaseQueryDto) {
    return this.conversationService.getConversations(req.user.id, query);
  }

  @Get('categories')
  @ApiOperation({
    summary: 'Lấy danh sách danh mục cuộc trò chuyện',
    description:
      'Trả về các danh mục để phân loại cuộc trò chuyện (ví dụ: Tất cả, Chưa đọc, Nhóm, v.v.)',
  })
  @ApiOkResponse({ description: 'Danh sách các danh mục cuộc trò chuyện' })
  async getCategories(@Req() req: AuthenticatedRequest) {
    return this.conversationService.getCategories(req.user.id);
  }

  @Get(':conversationId')
  @ApiOperation({
    summary: 'Lấy thông tin chi tiết cuộc trò chuyện',
    description:
      'Trả về thông tin đầy đủ về một cuộc trò chuyện cụ thể, bao gồm danh sách thành viên, tin nhắn gần nhất, v.v.',
  })
  @ApiParam({ name: 'conversationId', description: 'ID của cuộc trò chuyện muốn xem chi tiết' })
  @ApiOkResponse({
    type: ConversationResponseDto,
    description: 'Thông tin chi tiết cuộc trò chuyện bao gồm thành viên, tin nhắn, cài đặt',
    example: {
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
          displayName: 'Anh A',
        },
      ],
      settings: {
        notifications: { enabled: true },
        giftSounds: { enabled: true },
        displayName: null,
      },
    },
  })
  async getConversationById(
    @Param('conversationId') conversationId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.conversationService.getConversationById(conversationId, req.user.id);
  }

  @Post()
  @ApiOperation({
    summary: 'Tạo cuộc trò chuyện mới',
    description:
      'Tạo cuộc trò chuyện mới (direct message hoặc group chat). Nếu là direct message với người đã có conversation thì trả về conversation cũ',
  })
  @ApiBody({ type: CreateConversationDto })
  @ApiCreatedResponse({
    type: ConversationResponseDto,
    description: 'Cuộc trò chuyện đã được tạo thành công hoặc trả về conversation đã tồn tại',
    example: {
      id: 'conv-1',
      type: 'direct',
      name: 'Nguyễn Văn A',
      avatar: 'https://example.com/avatar.jpg',
      lastMessage: null,
      unreadCount: 0,
      updatedAt: '2025-11-12T10:00:00.000Z',
      participants: [
        {
          id: 'user-1',
          nickname: 'Nguyễn Văn A',
          avatar: 'https://example.com/avatar.jpg',
        },
      ],
    },
  })
  async createConversation(@Req() req: AuthenticatedRequest, @Body() dto: CreateConversationDto) {
    return this.conversationService.createConversation(req.user.id, dto);
  }

  @Delete(':conversationId')
  @ApiOperation({
    summary: 'Xóa cuộc trò chuyện',
    description:
      'Xóa cuộc trò chuyện khỏi danh sách của bạn (soft delete). Cuộc trò chuyện vẫn tồn tại cho các thành viên khác',
  })
  @ApiParam({ name: 'conversationId', description: 'ID của cuộc trò chuyện muốn xóa' })
  @ApiOkResponse({
    description: 'Cuộc trò chuyện đã được xóa khỏi danh sách của bạn',
    example: {
      message: 'Conversation deleted successfully',
    },
  })
  async deleteConversation(
    @Param('conversationId') conversationId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.conversationService.deleteConversation(conversationId, req.user.id);
  }

  @Patch(':conversationId/read')
  @ApiOperation({
    summary: 'Đánh dấu tin nhắn đã đọc',
    description:
      'Đánh dấu một hoặc nhiều tin nhắn trong cuộc trò chuyện là đã đọc. Nếu không truyền messageIds thì đánh dấu tất cả',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'ID của cuộc trò chuyện chứa tin nhắn cần đánh dấu đã đọc',
  })
  @ApiBody({ type: MarkReadDto })
  @ApiOkResponse({
    description: 'Các tin nhắn đã được đánh dấu là đã đọc',
    example: {
      message: 'Messages marked as read',
      markedCount: 5,
    },
  })
  async markAsRead(
    @Param('conversationId') conversationId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: MarkReadDto,
  ) {
    return this.conversationService.markAsRead(conversationId, req.user.id, dto.messageIds);
  }

  @Patch(':conversationId/notifications')
  @ApiOperation({
    summary: 'Cập nhật cài đặt thông báo cho cuộc trò chuyện',
    description:
      'Bật hoặc tắt thông báo cho cuộc trò chuyện này. Khi tắt, bạn sẽ không nhận thông báo khi có tin nhắn mới',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'ID của cuộc trò chuyện muốn cập nhật cài đặt thông báo',
  })
  @ApiBody({ type: UpdateNotificationsDto })
  @ApiOkResponse({
    description: 'Cài đặt thông báo đã được cập nhật thành công',
    example: {
      message: 'Notifications updated successfully',
      enabled: false,
    },
  })
  async updateNotifications(
    @Param('conversationId') conversationId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateNotificationsDto,
  ) {
    return this.conversationService.updateNotifications(conversationId, req.user.id, dto.enabled);
  }

  @Get(':conversationId/settings')
  @ApiOperation({
    summary: 'Lấy cài đặt cuộc trò chuyện',
    description:
      'Lấy tất cả cài đặt của cuộc trò chuyện bao gồm: tên hiển thị, thông báo, âm thanh quà tặng, v.v.',
  })
  @ApiParam({ name: 'conversationId', description: 'ID của cuộc trò chuyện muốn xem cài đặt' })
  @ApiOkResponse({
    description: 'Các cài đặt của cuộc trò chuyện',
    example: {
      notifications: {
        enabled: true,
      },
      giftSounds: {
        enabled: true,
      },
      displayName: 'Nhóm bạn thân',
    },
  })
  async getChatSettings(
    @Param('conversationId') conversationId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.conversationService.getChatSettings(conversationId, req.user.id);
  }

  @Patch(':conversationId/display-name')
  @ApiOperation({
    summary: 'Cập nhật tên hiển thị cuộc trò chuyện',
    description:
      'Đặt tên tùy chỉnh cho cuộc trò chuyện (ví dụ: "Nhóm bạn thân", "Chat với Anh"). Chỉ ảnh hưởng đến bạn, không ảnh hưởng người khác',
  })
  @ApiParam({ name: 'conversationId', description: 'ID của cuộc trò chuyện muốn đổi tên' })
  @ApiBody({ type: UpdateConversationDisplayNameDto })
  @ApiOkResponse({
    description: 'Tên hiển thị đã được cập nhật thành công',
    example: {
      message: 'Display name updated successfully',
      displayName: 'Nhóm bạn thân',
    },
  })
  async updateDisplayName(
    @Param('conversationId') conversationId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateConversationDisplayNameDto,
  ) {
    return this.conversationService.updateDisplayName(conversationId, req.user.id, dto.displayName);
  }

  @Patch(':conversationId/gift-sounds')
  @ApiOperation({
    summary: 'Cập nhật cài đặt âm thanh quà tặng',
    description: 'Bật hoặc tắt âm thanh khi có người gửi quà tặng trong cuộc trò chuyện này',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'ID của cuộc trò chuyện muốn cập nhật cài đặt âm thanh quà',
  })
  @ApiBody({ type: UpdateGiftSoundsDto })
  @ApiOkResponse({
    description: 'Cài đặt âm thanh quà tặng đã được cập nhật thành công',
    example: {
      message: 'Gift sounds updated successfully',
      enabled: true,
    },
  })
  async updateGiftSounds(
    @Param('conversationId') conversationId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateGiftSoundsDto,
  ) {
    return this.conversationService.updateGiftSounds(conversationId, req.user.id, dto.enabled);
  }

  @Post(':conversationId/report')
  @ApiOperation({
    summary: 'Báo cáo cuộc trò chuyện',
    description:
      'Báo cáo cuộc trò chuyện vi phạm quy tắc (spam, quấy rối, nội dung không phù hợp, v.v.)',
  })
  @ApiParam({ name: 'conversationId', description: 'ID của cuộc trò chuyện muốn báo cáo' })
  @ApiBody({ type: ReportChatDto })
  @ApiOkResponse({
    description: 'Cuộc trò chuyện đã được báo cáo thành công. Admin sẽ xem xét',
    example: {
      message: 'Chat reported successfully',
      reportId: 'report-1',
    },
  })
  async reportChat(
    @Param('conversationId') conversationId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: ReportChatDto,
  ) {
    return this.conversationService.reportChat(
      conversationId,
      req.user.id,
      dto.reason,
      dto.details,
    );
  }
}
