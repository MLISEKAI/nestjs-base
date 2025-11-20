import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiOkResponse } from '@nestjs/swagger';
import { ProfileViewsServiceDb } from './profile-views.service';

/**
 * Public Profile Views Controller - Không cần authentication
 * Dùng để xem số lượt xem profile của user khác (social proof)
 */
@ApiTags('Profile Views (Public)')
@Controller('public/users/:user_id/profile-views')
export class ProfileViewsPublicController {
  constructor(private readonly profileViewsService: ProfileViewsServiceDb) {}

  @Get()
  @ApiOperation({ summary: '[PUBLIC] Xem số lượt xem profile của user (không cần đăng nhập)' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiOkResponse({
    description: 'Chỉ trả về tổng số lượt xem (không có danh sách chi tiết)',
    schema: {
      type: 'object',
      properties: {
        total_views: { type: 'number', example: 150 },
      },
    },
  })
  async getProfileViews(@Param('user_id') userId: string) {
    const views = await this.profileViewsService.getProfileViews(userId, false);
    // Chỉ trả về tổng số lượt xem
    return {
      total_views: Array.isArray(views) ? views.length : 0,
    };
  }
}
