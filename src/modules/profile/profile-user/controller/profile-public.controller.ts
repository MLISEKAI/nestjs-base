import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiOkResponse } from '@nestjs/swagger';
import { UserProfileService } from '../service/profile-user.service';
import { ProfileServiceDb } from '../../profile.service';
import { StatsQueryDto } from '../dto/stats-query.dto';

/**
 * Public Profile Controller - Không cần authentication
 * Dùng để xem public profile của user khác
 */
@ApiTags('Profile (Public)')
@Controller('public/users/:user_id/profile')
export class ProfilePublicController {
  constructor(
    private readonly userProfile: UserProfileService,
    private readonly service: ProfileServiceDb,
  ) {}

  @Get()
  @ApiOperation({ summary: '[PUBLIC] Xem public profile của user (không cần đăng nhập)' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiOkResponse({
    description: 'Public profile của user (read-only)',
  })
  getProfile(@Param('user_id') user_id: string) {
    return this.userProfile.getProfile(user_id);
  }

  @Get('stats')
  @ApiOperation({ summary: '[PUBLIC] Xem stats của user (không cần đăng nhập)' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiOkResponse({
    description: 'Thống kê user (public)',
    schema: {
      type: 'object',
      properties: {
        posts: { example: 10 },
        followers_count: { example: 100 },
        following_count: { example: 50 },
        views_count: { example: 500 },
      },
    },
  })
  getStats(@Param('user_id') user_id: string, @Query() query: StatsQueryDto) {
    return this.userProfile.getStats(user_id, query);
  }

  @Get('interests')
  @ApiOperation({ summary: '[PUBLIC] Xem sở thích của user (không cần đăng nhập)' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiOkResponse({ description: 'Danh sách sở thích' })
  getUserInterests(@Param('user_id') user_id: string) {
    return this.service.getUserInterests(user_id);
  }

  @Get('contribution')
  @ApiOperation({ summary: '[PUBLIC] Xem đóng góp của user (không cần đăng nhập)' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiOkResponse({ description: 'Thông tin đóng góp của user' })
  getUserContribution(@Param('user_id') user_id: string) {
    return this.service.getUserContribution(user_id);
  }
}
