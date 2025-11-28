// Import các decorator và class từ NestJS để tạo controller
import { Controller, Get, Param, Query, UsePipes, ValidationPipe } from '@nestjs/common';
// Import các decorator từ Swagger để tạo API documentation
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
// Import UserGiftWallService để xử lý business logic
import { UserGiftWallService } from '../../users/service/user-gift-wall.service';
// Import BaseQueryDto cho pagination
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

/**
 * @ApiTags('Gifts (Public)') - Nhóm các endpoints này trong Swagger UI với tag "Gifts (Public)"
 * @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
 *   - transform: true - Tự động transform dữ liệu
 *   - whitelist: true - Chỉ giữ lại các properties được định nghĩa trong DTO
 * @Controller('public/users/:user_id/gifts') - Định nghĩa base route là /public/users/:user_id/gifts
 * GiftsPublicController - Controller xử lý các HTTP requests liên quan đến gifts (public endpoints)
 *
 * Chức năng chính:
 * - Xem gift wall của user khác (public profile)
 * - Xem milestones của user (public)
 * - Không cần authentication (public endpoints)
 *
 * Lưu ý:
 * - Tất cả endpoints đều public (không cần đăng nhập)
 * - Dùng để xem gift wall của user khác trong public profile
 */
@ApiTags('Gifts (Public)')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('public/users/:user_id/gifts')
export class GiftsPublicController {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject UserGiftWallService khi tạo instance của controller
   */
  constructor(private readonly giftWallService: UserGiftWallService) {}

  @Get('gift-wall')
  @ApiOperation({ summary: '[PUBLIC] Xem Gift Wall của user (không cần đăng nhập)' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem gift wall' })
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
  getGiftWall(@Param('user_id') user_id: string) {
    return this.giftWallService.getGiftWall(user_id);
  }

  /**
   * Route cho trường hợp không có milestone_id (lấy tất cả milestones)
   * Phải đặt TRƯỚC route có :milestone_id để NestJS match đúng
   */
  @Get('gift-wall/givers')
  @ApiOperation({
    summary: '[PUBLIC] Xem milestones của user (không cần đăng nhập) - Tất cả milestones',
  })
  @ApiParam({ name: 'user_id', description: 'ID của user' })
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
    summary: '[PUBLIC] Xem milestones của user (không cần đăng nhập) - Milestone cụ thể',
  })
  @ApiParam({ name: 'user_id', description: 'ID của user' })
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
}
