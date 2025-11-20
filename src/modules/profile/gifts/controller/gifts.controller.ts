import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { GiftCrudService } from '../service/gift-crud.service';
import { GiftSummaryService } from '../service/gift-summary.service';
import { UserGiftWallService } from '../../../users/service/user-gift-wall.service';
import { InventoryService } from '../../inventory/service/inventory.service';
import {
  CreateGiftDto,
  GiftSummaryResponseDto,
  TopSupporterDto,
  UpdateGiftDto,
} from '../dto/gift.dto';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';
import { UserRateLimitGuard } from '../../../../common/rate-limit/guards/user-rate-limit.guard';
import {
  UserRateLimit,
  RateLimitPresets,
} from '../../../../common/rate-limit/decorators/user-rate-limit.decorator';

@ApiTags('Gifts')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('profile/:user_id/gifts')
export class GiftsController {
  constructor(
    private readonly crudService: GiftCrudService,
    private readonly summaryService: GiftSummaryService,
    private readonly giftWallService: UserGiftWallService,
    private readonly inventoryService: InventoryService,
  ) {}

  @Get('summary')
  @ApiOperation({ summary: 'Tổng quan quà tặng của user (với pagination)' })
  @ApiParam({ name: 'user_id', description: 'ID của user nhận quà' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng mỗi trang (mặc định: 20)',
  })
  @ApiOkResponse({
    description: 'Tổng quan quà tặng với pagination (chuẩn format)',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'boolean', example: false },
        code: { type: 'number', example: 0 },
        message: { type: 'string', example: 'Success' },
        data: {
          type: 'object',
          properties: {
            items: { type: 'array' },
            meta: { type: 'object' },
          },
        },
        traceId: { type: 'string' },
      },
    },
  })
  getGiftsSummary(@Param('user_id') userId: string, @Query() query: BaseQueryDto) {
    return this.summaryService.getGiftsSummary(userId, query);
  }

  @Get('top')
  @ApiOperation({ summary: 'Top quà tặng của user' })
  @ApiOkResponse({ type: [TopSupporterDto], description: 'Danh sách top supporter' })
  getTopGifts(@Param('user_id') userId: string) {
    return this.summaryService.getTopSupporters(userId);
  }

  @Get('milestones')
  @ApiOperation({ summary: 'Mốc quà tặng của user' })
  @ApiOkResponse({
    description: 'Danh sách mốc quà tặng',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          milestone: { example: '100 gifts' },
          achieved: { example: true },
          achieved_at: { example: '2025-01-01T00:00:00.000Z' },
        },
      },
    },
  })
  getMilestones(@Param('user_id') userId: string) {
    return this.summaryService.getGiftMilestones(userId);
  }

  @Get('gift-wall')
  @ApiOperation({ summary: 'Lấy thông tin tổng quan Gift Wall' })
  @ApiParam({ name: 'user_id', description: 'ID của user', type: String })
  @ApiOkResponse({
    description: 'Thông tin Gift Wall',
    schema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', example: '123' },
        username: { type: 'string', example: 'Darlene Bears' },
        avatar_url: { type: 'string', example: '/avatars/darlene.jpg' },
        total_gifts: { type: 'number', example: 112 },
        xp_to_next_level: { type: 'number', example: 200 },
        level: { type: 'number', example: 34 },
        description: { type: 'string', example: 'Help me light up the Gift Wall.' },
      },
    },
  })
  getGiftWall(@Param('user_id') userId: string) {
    return this.giftWallService.getGiftWall(userId);
  }

  @Get('gift-wall/:milestone_id/givers')
  @ApiOperation({ summary: 'Lấy danh sách milestones với progress' })
  @ApiParam({ name: 'user_id', description: 'ID của user', type: String })
  @ApiParam({
    name: 'milestone_id',
    description: 'ID của milestone (optional, nếu không có thì trả về tất cả)',
    required: false,
    type: String,
  })
  @ApiOkResponse({
    description: 'Danh sách milestones với progress',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          milestone_id: { type: 'string', example: 'gift-item-1' },
          name: { type: 'string', example: 'Quà tặng 1' },
          icon_url: { type: 'string', example: '/images/gift_milestone_1.png' },
          required_count: { type: 'number', example: 10 },
          current_count: { type: 'number', example: 5 },
          is_unlocked: { type: 'boolean', example: false },
          progress: { type: 'number', example: 0.5 },
        },
      },
    },
  })
  getGiftWallMilestones(
    @Param('user_id') userId: string,
    @Param('milestone_id') milestoneId?: string,
  ) {
    return this.giftWallService.getGiftWallMilestones(userId);
  }

  @Get('recent-gifts')
  @ApiOperation({ summary: 'Lấy danh sách quà nhận gần đây' })
  @ApiParam({ name: 'user_id', description: 'ID của user', type: String })
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
                  user_id: { type: 'string', example: '101' },
                  username: { type: 'string', example: 'Malenna Calzoni' },
                  avatar_url: { type: 'string', example: '/avatars/malenna.jpg' },
                },
              },
              gift_info: {
                type: 'object',
                properties: {
                  gift_name: { type: 'string', example: 'Quà x1' },
                  icon_url: { type: 'string', example: '/images/gift_icon_a.png' },
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
  getRecentGifts(@Param('user_id') userId: string, @Query() query: BaseQueryDto) {
    const page = query?.page && query.page > 0 ? query.page : 1;
    const limit = query?.limit && query.limit > 0 ? query.limit : 20;
    return this.giftWallService.getRecentGifts(userId, page, limit);
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Lấy danh sách vật phẩm trong inventory (gift bag)' })
  @ApiParam({ name: 'user_id', description: 'ID của user', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng mỗi trang (mặc định: 20)',
  })
  @ApiOkResponse({
    description: 'Danh sách vật phẩm trong inventory',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item_id: { example: '101' },
              name: { example: 'Rose' },
              quantity: { example: 5 },
            },
          },
        },
        meta: { type: 'object' },
      },
    },
  })
  getInventory(@Param('user_id') userId: string, @Query() query: BaseQueryDto) {
    return this.inventoryService.getInventory(userId, query);
  }

  @Post()
  @UseGuards(UserRateLimitGuard)
  @UserRateLimit({ limit: 10, ttl: 60000 }) // 10 requests per minute
  @ApiOperation({ summary: 'Tạo mới quà tặng' })
  @ApiBody({ type: CreateGiftDto })
  @ApiCreatedResponse({ description: 'Quà tặng được tạo thành công' })
  create(@Param('user_id') userId: string, @Body() dto: CreateGiftDto) {
    // Set sender_id từ path param nếu chưa có
    const giftDto = { ...dto, sender_id: dto.sender_id || userId };
    return this.crudService.create(giftDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách quà tặng của user (với pagination)',
    description:
      'Lấy danh sách quà tặng mà user nhận được. Nếu không có user_id trong path, trả về tất cả quà tặng (admin only).',
  })
  @ApiParam({ name: 'user_id', description: 'ID của user nhận quà' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng mỗi trang (mặc định: 20)',
  })
  @ApiOkResponse({
    description: 'Danh sách quà tặng với pagination (chuẩn format)',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'boolean', example: false },
        code: { type: 'number', example: 0 },
        message: { type: 'string', example: 'Success' },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/CreateGiftDto' },
            },
            meta: { type: 'object' },
          },
        },
        traceId: { type: 'string' },
      },
    },
  })
  findAll(@Param('user_id') userId: string, @Query() query: BaseQueryDto) {
    return this.crudService.findAll(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết 1 quà tặng' })
  @ApiOkResponse({ description: 'Chi tiết quà tặng', type: CreateGiftDto })
  findOne(@Param('id') id: string) {
    return this.crudService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật quà tặng' })
  @ApiBody({ type: UpdateGiftDto })
  @ApiOkResponse({ description: 'Quà tặng cập nhật thành công', type: CreateGiftDto })
  update(@Param('id') id: string, @Body() dto: UpdateGiftDto) {
    return this.crudService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa quà tặng' })
  @ApiOkResponse({
    description: 'Quà tặng đã bị xóa',
    schema: { type: 'object', properties: { message: { example: 'Gift deleted' } } },
  })
  remove(@Param('id') id: string) {
    return this.crudService.remove(id);
  }
}
