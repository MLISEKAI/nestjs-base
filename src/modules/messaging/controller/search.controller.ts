import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MessagingSearchService } from '../service/search.service';
import { SearchMessagesDto } from '../dto/search.dto';
import type { AuthenticatedRequest } from '../../../common/interfaces/request.interface';

@ApiTags('Messages Search')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard('account-auth'))
@ApiBearerAuth('JWT-auth')
@Controller('messages')
export class SearchController {
  constructor(private readonly searchService: MessagingSearchService) {}

  @Get('search')
  @ApiOperation({
    summary: 'Tìm kiếm người để nhắn tin',
    description:
      'Hiển thị gợi ý người liên hệ gần đây/kề xuất và cho phép tìm kiếm người dùng để bắt đầu cuộc trò chuyện mới.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Từ khóa tìm kiếm người dùng (nickname, id, số điện thoại...)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Số trang kết quả (mặc định: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng kết quả mỗi trang (mặc định: 20)',
  })
  @ApiQuery({
    name: 'suggestions',
    required: false,
    type: Number,
    description: 'Số lượng gợi ý cần lấy (mặc định: 8)',
  })
  @ApiOkResponse({
    description: 'Danh sách gợi ý + kết quả tìm kiếm người dùng',
    schema: {
      type: 'object',
      properties: {
        suggestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userId: { type: 'string', example: 'user-1' },
              nickname: { type: 'string', example: 'Loc' },
              avatar: { type: 'string', nullable: true },
              preview: { type: 'string', example: 'Đã gửi một hình ảnh' },
              conversationId: { type: 'string', nullable: true },
              lastInteractionAt: { type: 'string', format: 'date-time', nullable: true },
            },
          },
        },
        results: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  nickname: { type: 'string' },
                  avatar: { type: 'string', nullable: true },
                  bio: { type: 'string', nullable: true },
                },
              },
            },
            meta: {
              type: 'object',
              properties: {
                item_count: { type: 'number' },
                total_items: { type: 'number' },
                items_per_page: { type: 'number' },
                total_pages: { type: 'number' },
                current_page: { type: 'number' },
              },
            },
          },
        },
      },
    },
  })
  async searchMessages(@Req() req: AuthenticatedRequest, @Query() query: SearchMessagesDto) {
    return this.searchService.searchPeople(req.user.id, query);
  }

  @Get('suggestions')
  @ApiOperation({
    summary: 'Lấy gợi ý cho cuộc trò chuyện mới',
    description:
      'Trả về danh sách gợi ý người dùng hoặc nhóm để bắt đầu cuộc trò chuyện mới. Dựa trên bạn bè, nhóm đã tham gia, v.v.',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['message', 'group'],
    description:
      'Loại gợi ý: "message" (gợi ý người để nhắn tin) hoặc "group" (gợi ý nhóm để tham gia)',
  })
  @ApiOkResponse({
    description: 'Danh sách gợi ý người dùng hoặc nhóm để bắt đầu cuộc trò chuyện',
    example: {
      users: [
        {
          id: 'user-1',
          nickname: 'Nguyễn Văn A',
          avatar: 'https://example.com/avatar.jpg',
        },
      ],
      groups: [
        {
          id: 'group-1',
          name: 'Nhóm bạn thân',
          avatar: 'https://example.com/group-avatar.jpg',
          members_count: 25,
        },
      ],
    },
  })
  async getSuggestions(
    @Req() req: AuthenticatedRequest,
    @Query('type') type?: 'message' | 'group',
  ) {
    return this.searchService.getSuggestions(req.user.id, type);
  }
}
