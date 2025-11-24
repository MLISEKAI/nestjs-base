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
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedRequest } from '../../../common/interfaces/request.interface';
import { GiftCrudService } from '../service/gift-crud.service';
import { GiftSummaryService } from '../service/gift-summary.service';
import { UserGiftWallService } from '../../users/service/user-gift-wall.service';
import { InventoryService } from '../../profile/inventory/service/inventory.service';
import { InventoryItemDto } from '../../profile/inventory/dto/inventory.dto';
import {
  CreateGiftDto,
  GiftSummaryResponseDto,
  TopSupporterDto,
  PurchaseGiftDto,
  PurchaseGiftResponseDto,
} from '../dto/gift.dto';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/base-response.dto';
import { UserRateLimitGuard } from '../../../common/rate-limit/guards/user-rate-limit.guard';
import {
  UserRateLimit,
  RateLimitPresets,
} from '../../../common/rate-limit/decorators/user-rate-limit.decorator';

/**
 * User Gifts Controller - Yêu cầu authentication
 * User chỉ có thể xem/sửa gifts của chính mình
 */
@ApiTags('Gifts (User)')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard('account-auth'))
@ApiBearerAuth('JWT-auth')
@Controller('gifts')
export class GiftsController {
  constructor(
    private readonly crudService: GiftCrudService,
    private readonly summaryService: GiftSummaryService,
    private readonly giftWallService: UserGiftWallService,
    private readonly inventoryService: InventoryService,
  ) {}

  @Get('top-supporters')
  @ApiOperation({ summary: 'Top quà tặng của user hiện tại' })
  @ApiOkResponse({ type: [TopSupporterDto], description: 'Danh sách top supporter' })
  getTopGifts(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return this.summaryService.getTopSupporters(userId);
  }

  @Get('gift-wall')
  @ApiOperation({ summary: 'Lấy thông tin tổng quan Gift Wall của user hiện tại' })
  @ApiOkResponse({
    description: 'Thông tin Gift Wall',
    schema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', example: '123' },
        username: { type: 'string', example: 'Darlene Bears' },
        avatar_url: { type: 'string', example: '/avatars/darlene.jpg' },
        total_diamond_value: {
          type: 'number',
          example: 112,
          description:
            'Tổng giá trị daimon (diamond value) của tất cả quà đã nhận = sum(price * quantity)',
        },
        xp_to_next_level: { type: 'number', example: 200 },
        level: { type: 'number', example: 34 },
        description: { type: 'string', example: 'Help me light up the Gift Wall.' },
      },
    },
  })
  getGiftWall(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return this.giftWallService.getGiftWall(userId);
  }

  @Get('gift-wall/:milestone_id/givers')
  @ApiOperation({ summary: 'Lấy danh sách milestones với progress của user hiện tại' })
  @ApiParam({
    name: 'milestone_id',
    description: 'ID của milestone (optional, nếu không có thì trả về tất cả)',
    required: false,
    type: String,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng mỗi trang (mặc định: 20)',
  })
  @ApiOkResponse({
    description: 'Danh sách milestones với progress và pagination',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'gift-item-1' },
              name: { type: 'string', example: 'Quà tặng 1' },
              image_url: { type: 'string', example: '/images/gift_milestone_1.png' },
              required_count: { type: 'number', example: 10 },
              current_count: { type: 'number', example: 5 },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            item_count: { type: 'number', example: 10 },
            total_items: { type: 'number', example: 100 },
            items_per_page: { type: 'number', example: 20 },
            total_pages: { type: 'number', example: 5 },
            current_page: { type: 'number', example: 1 },
          },
        },
      },
    },
  })
  getGiftWallMilestones(
    @Req() req: AuthenticatedRequest,
    @Param('milestone_id') milestoneId?: string,
    @Query() query?: BaseQueryDto,
  ) {
    const userId = req.user.id;
    return this.giftWallService.getGiftWallMilestones(userId, milestoneId, query);
  }

  @Get('recent-gifts')
  @ApiOperation({ summary: 'Lấy danh sách quà nhận gần đây của user hiện tại' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng mỗi trang (mặc định: 20)',
  })
  @ApiOkResponse({
    description: 'Danh sách quà nhận gần đây',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              transaction_id: { type: 'string', example: 'tx12345' },
              sender: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: '101' },
                  nickname: { type: 'string', example: 'Malenna Calzoni' },
                  avatar: { type: 'string', example: '/avatars/malenna.jpg' },
                },
              },
              gift_info: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Quà x1' },
                  image_url: { type: 'string', example: '/images/gift_icon_a.png' },
                  quantity: { type: 'number', example: 1 },
                },
              },
              timestamp: { type: 'string', example: '2025-11-07T18:00:00Z' },
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
  })
  getRecentGifts(@Req() req: AuthenticatedRequest, @Query() query: BaseQueryDto) {
    const userId = req.user.id;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const limit = query?.limit && query.limit > 0 ? query.limit : 20;
    return this.giftWallService.getRecentGifts(userId, page, limit);
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Lấy danh sách vật phẩm trong inventory (gift bag) của user hiện tại' })
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
    description: 'Tìm kiếm theo tên vật phẩm',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    description: 'Sắp xếp (field:asc hoặc field:desc, ví dụ: name:asc)',
  })
  @ApiOkResponse({
    description: 'Danh sách vật phẩm trong inventory với pagination',
    type: PaginatedResponseDto<InventoryItemDto>,
  })
  getInventory(@Req() req: AuthenticatedRequest, @Query() query: BaseQueryDto) {
    const userId = req.user.id;
    // Chỉ hiển thị gift items trong gift inventory
    return this.inventoryService.getInventory(userId, query, 'gift');
  }

  @Post()
  @UseGuards(UserRateLimitGuard)
  @UserRateLimit({ limit: 10, ttl: 60000 }) // 10 requests per minute
  @ApiOperation({
    summary: 'Gửi quà tặng (sender tự động từ JWT token)',
    description:
      'Có 2 cách gửi quà:\n' +
      '1. Mua mới từ catalog: Chỉ cần gift_item_id (sẽ trừ Diamond)\n' +
      '2. Gửi từ inventory: Chỉ cần item_id (KHÔNG trừ Diamond, quà đã được tặng)',
  })
  @ApiBody({
    type: CreateGiftDto,
    examples: {
      'from-catalog': {
        summary: 'Gửi quà từ catalog (mua mới)',
        description: 'Mua quà mới và gửi ngay. Sẽ trừ Diamond từ wallet.',
        value: {
          receiver_id: 'user-receiver-uuid',
          gift_item_id: 'gift-item-uuid',
          quantity: 1,
          message: 'Happy birthday!',
        },
      },
      'from-inventory': {
        summary: 'Gửi quà từ inventory (từ túi)',
        description: 'Gửi quà đã có trong túi. KHÔNG trừ Diamond (quà đã được tặng, miễn phí).',
        value: {
          receiver_id: 'user-receiver-uuid',
          item_id: 'item-uuid',
          quantity: 1,
          message: 'For you!',
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Quà tặng được tạo thành công' })
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateGiftDto) {
    // Lấy sender_id từ JWT token
    const senderId = req.user.id;
    const giftDto = { ...dto, sender_id: senderId };
    return this.crudService.create(giftDto);
  }

  @Post('purchase')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mua quà và bỏ vào túi',
    description:
      'Mua quà bằng Diamond và tự động thêm vào túi (inventory) của chính mình. Hệ thống sẽ trừ Diamond từ wallet và thêm gift vào inventory.',
  })
  @ApiBody({ type: PurchaseGiftDto })
  @ApiOkResponse({
    description: 'Mua quà thành công',
    type: PurchaseGiftResponseDto,
  })
  async purchaseGift(@Req() req: AuthenticatedRequest, @Body() dto: PurchaseGiftDto) {
    const userId = req.user.id;
    return this.crudService.purchaseGift(userId, dto.gift_item_id, dto.quantity ?? 1);
  }

  @Get()
  @ApiOperation({
    summary: 'Tổng quan quà tặng - Items mẫu + total_count',
    description:
      'Trả về một số quà mẫu (items) và tổng số quà đã nhận (total_count). Khác với GET /gifts/items (trả về tất cả), endpoint này chỉ trả về một số items mẫu để hiển thị icon quà. Dùng cho phần hiển thị "Gifts" với icon quà và số lượng.',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Lọc quà theo type (hot, event, lucky, friendship, vip, normal)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng items mẫu muốn lấy (mặc định: 3)',
  })
  @ApiOkResponse({
    description: 'Tổng quan quà tặng',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          description: 'Danh sách quà mẫu (chỉ một số items để hiển thị, không phải tất cả)',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                example: 'gift-item-uuid',
                description: 'ID của gift item (UUID)',
              },
              name: { type: 'string', example: 'Rose', description: 'Tên gift' },
              image_url: {
                type: 'string',
                example: 'https://...',
                description: 'URL hình ảnh gift',
              },
            },
          },
        },
        total_count: {
          type: 'number',
          example: 180,
          description: 'Tổng số quà đã nhận',
        },
      },
    },
  })
  getGiftsOverview(
    @Req() req: AuthenticatedRequest,
    @Query('type') type?: string,
    @Query('limit') limit?: number,
  ) {
    const userId = req.user.id;
    const itemsLimit = limit && limit > 0 ? limit : 3; // Mặc định 3 items
    return this.summaryService.getGiftsOverview(userId, type, itemsLimit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy thông tin chi tiết 1 quà tặng (chỉ gift mà user gửi hoặc nhận)',
    description:
      'Lấy thông tin chi tiết của một gift đã được gửi. ID ở đây là gift ID (ID của ResGift record), KHÔNG phải gift_item_id. Gift ID được trả về khi tạo gift thành công qua POST /gifts.',
  })
  @ApiParam({
    name: 'id',
    description: 'Gift ID (UUID) - ID của gift đã được gửi, không phải gift_item_id',
    example: '8f28a421-dd61-4628-8dec-0271d9e97546',
  })
  @ApiOkResponse({ description: 'Chi tiết quà tặng', type: CreateGiftDto })
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const userId = req.user.id;
    return this.crudService.findOne(id, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa quà tặng (chỉ gift mà user đã gửi)' })
  @ApiOkResponse({
    description: 'Quà tặng đã bị xóa',
    schema: { type: 'object', properties: { message: { example: 'Gift deleted' } } },
  })
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const userId = req.user.id;
    return this.crudService.remove(id, userId);
  }
}
