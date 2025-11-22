import { Controller, Get, Param, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { UserGiftWallService } from '../../users/service/user-gift-wall.service';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

/**
 * Public Gifts Controller - Không cần authentication
 * Dùng để xem gift wall của user khác (public profile)
 */
@ApiTags('Gifts (Public)')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('public/users/:user_id/gifts')
export class GiftsPublicController {
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
  getGiftWall(@Param('user_id') userId: string) {
    return this.giftWallService.getGiftWall(userId);
  }

  @Get('gift-wall/:milestone_id/givers')
  @ApiOperation({ summary: '[PUBLIC] Xem milestones của user (không cần đăng nhập)' })
  @ApiParam({ name: 'user_id', description: 'ID của user' })
  @ApiParam({
    name: 'milestone_id',
    description: 'ID của milestone (optional)',
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
          id: { type: 'string', example: 'gift-item-1' },
          name: { type: 'string', example: 'Quà tặng 1' },
          image_url: { type: 'string', example: '/images/gift_milestone_1.png' },
          required_count: { type: 'number', example: 10 },
          current_count: { type: 'number', example: 5 },
        },
      },
    },
  })
  getGiftWallMilestones(
    @Param('user_id') userId: string,
    @Param('milestone_id') milestoneId?: string,
  ) {
    return this.giftWallService.getGiftWallMilestones(userId, milestoneId);
  }
}
