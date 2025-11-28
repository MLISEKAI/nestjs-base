// Import các decorator và class từ NestJS để tạo controller
import {
  Controller,
  Get,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
// Import các decorator từ Swagger để tạo API documentation
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
// Import AuthGuard từ Passport để xác thực JWT token
import { AuthGuard } from '@nestjs/passport';
// Import AdminGuard để kiểm tra quyền admin
import { AdminGuard } from '../../../common/guards/admin.guard';
// Import các services để xử lý business logic
import { GiftCrudService } from '../service/gift-crud.service';
import { GiftSummaryService } from '../service/gift-summary.service';
import { UserGiftWallService } from '../../users/service/user-gift-wall.service';
import { InventoryService } from '../../profile/inventory/service/inventory.service';
// Import BaseQueryDto cho pagination
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

/**
 * @ApiTags('Gifts (Admin)') - Nhóm các endpoints này trong Swagger UI với tag "Gifts (Admin)"
 * @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
 *   - transform: true - Tự động transform dữ liệu
 *   - whitelist: true - Chỉ giữ lại các properties được định nghĩa trong DTO
 * @UseGuards(AuthGuard('account-auth'), AdminGuard) - Yêu cầu authentication và admin role
 * @ApiBearerAuth('JWT-auth') - Yêu cầu JWT token trong header
 * @Controller('admin/users/:user_id/gifts') - Định nghĩa base route là /admin/users/:user_id/gifts
 * GiftsAdminController - Controller xử lý các HTTP requests liên quan đến gifts management (admin only)
 *
 * Chức năng chính:
 * - Xem top gifts của bất kỳ user nào (admin only)
 * - Xem gift wall của bất kỳ user nào (admin only)
 * - Xem milestones của bất kỳ user nào (admin only)
 * - Xem inventory của bất kỳ user nào (admin only)
 *
 * Lưu ý:
 * - Chỉ admin mới có quyền truy cập các endpoints này
 * - Có thể quản lý gifts của bất kỳ user nào (không chỉ của chính mình)
 */
@ApiTags('Gifts (Admin)')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard('account-auth'), AdminGuard)
@ApiBearerAuth('JWT-auth')
@Controller('admin/users/:user_id/gifts')
export class GiftsAdminController {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject các services khi tạo instance của controller
   */
  constructor(
    private readonly crudService: GiftCrudService,
    private readonly summaryService: GiftSummaryService,
    private readonly giftWallService: UserGiftWallService,
    private readonly inventoryService: InventoryService,
  ) {}

  @Get('top')
  @ApiOperation({ summary: '[ADMIN] Xem top gifts của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiOkResponse({ description: 'Danh sách top supporter' })
  getTopGifts(@Param('user_id') user_id: string) {
    return this.summaryService.getTopSupporters(user_id);
  }

  @Get('gift-wall')
  @ApiOperation({ summary: '[ADMIN] Xem gift wall của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiOkResponse({ description: 'Thông tin Gift Wall' })
  getGiftWall(@Param('user_id') user_id: string) {
    return this.giftWallService.getGiftWall(user_id);
  }

  /**
   * Route cho trường hợp không có milestone_id (lấy tất cả milestones)
   * Phải đặt TRƯỚC route có :milestone_id để NestJS match đúng
   */
  @Get('gift-wall/givers')
  @ApiOperation({
    summary: '[ADMIN] Xem milestones với progress của user bất kỳ - Tất cả milestones',
  })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
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
              required_count: {
                type: 'number',
                example: 10,
                description:
                  'Số lượng quà cần để unlock milestone này (mặc định = 10). Nếu current_count >= required_count, milestone đã được unlock. Ví dụ: nếu user đã nhận 100 quà và required_count = 10, thì milestone đã được unlock 10 lần (100/10 = 10).',
              },
              current_count: {
                type: 'number',
                example: 100,
                description:
                  'Số lượng quà user đã nhận được (tổng quantity từ res_gift). Ví dụ: nếu user đã nhận 100 quà Rose, thì current_count = 100. Progress = current_count / required_count.',
              },
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
  getGiftWallMilestonesAll(@Param('user_id') user_id: string, @Query() query?: BaseQueryDto) {
    return this.giftWallService.getGiftWallMilestones(user_id, undefined, query);
  }

  /**
   * Route cho trường hợp có milestone_id (lấy milestone cụ thể)
   * Phải đặt SAU route không có :milestone_id để NestJS match đúng
   */
  @Get('gift-wall/:milestone_id/givers')
  @ApiOperation({
    summary: '[ADMIN] Xem milestones với progress của user bất kỳ - Milestone cụ thể',
  })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiParam({
    name: 'milestone_id',
    description: 'ID của milestone (gift_item_id)',
    required: true,
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
              required_count: {
                type: 'number',
                example: 10,
                description:
                  'Số lượng quà cần để unlock milestone này (mặc định = 10). Nếu current_count >= required_count, milestone đã được unlock. Ví dụ: nếu user đã nhận 100 quà và required_count = 10, thì milestone đã được unlock 10 lần (100/10 = 10).',
              },
              current_count: {
                type: 'number',
                example: 100,
                description:
                  'Số lượng quà user đã nhận được (tổng quantity từ res_gift). Ví dụ: nếu user đã nhận 100 quà Rose, thì current_count = 100. Progress = current_count / required_count.',
              },
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
  getGiftWallMilestonesById(
    @Param('user_id') user_id: string,
    @Param('milestone_id') milestoneId: string,
    @Query() query?: BaseQueryDto,
  ) {
    return this.giftWallService.getGiftWallMilestones(user_id, milestoneId, query);
  }

  @Get('recent-gifts')
  @ApiOperation({ summary: '[ADMIN] Xem recent gifts của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng mỗi trang (mặc định: 20)',
  })
  @ApiOkResponse({ description: 'Danh sách quà nhận gần đây' })
  getRecentGifts(@Param('user_id') user_id: string, @Query() query: BaseQueryDto) {
    const page = query?.page && query.page > 0 ? query.page : 1;
    const limit = query?.limit && query.limit > 0 ? query.limit : 20;
    return this.giftWallService.getRecentGifts(user_id, page, limit);
  }

  @Get('inventory')
  @ApiOperation({ summary: '[ADMIN] Xem inventory của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng mỗi trang (mặc định: 20)',
  })
  @ApiOkResponse({ description: 'Danh sách vật phẩm trong inventory' })
  getInventory(@Param('user_id') user_id: string, @Query() query: BaseQueryDto) {
    return this.inventoryService.getInventory(user_id, query);
  }

  @Get()
  @ApiOperation({ summary: '[ADMIN] Xem danh sách gifts của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng mỗi trang (mặc định: 20)',
  })
  @ApiOkResponse({ description: 'Danh sách quà tặng với pagination' })
  findAll(@Param('user_id') user_id: string, @Query() query: BaseQueryDto) {
    return this.crudService.findAll(user_id, query);
  }
}
