import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiOkResponse } from '@nestjs/swagger';
import { UserConnectionsService } from '../service/user-connections.service';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

/**
 * Public Connections Controller - Không cần authentication
 * Dùng để xem followers/following của user khác (public profile)
 */
@ApiTags('Connections (Public)')
@Controller('public/users/:user_id/connections')
export class ConnectionsPublicController {
  constructor(private readonly connectionsService: UserConnectionsService) {}

  @Get('stats')
  @ApiOperation({ summary: '[PUBLIC] Xem stats của user (không cần đăng nhập)' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiOkResponse({
    description: 'Stats (followers_count, following_count)',
    schema: {
      type: 'object',
      properties: {
        followers_count: { example: 100 },
        following_count: { example: 50 },
      },
    },
  })
  async getStats(@Param('user_id') user_id: string) {
    const stats = await this.connectionsService.getStats(user_id);
    // Chỉ trả về public info (không có friends_count)
    return {
      followers_count: stats.followers_count,
      following_count: stats.following_count,
    };
  }

  @Get('followers')
  @ApiOperation({ summary: '[PUBLIC] Xem followers của user (không cần đăng nhập)' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng mỗi trang (mặc định: 20)',
  })
  @ApiOkResponse({ description: 'Danh sách followers với pagination' })
  async getFollowers(@Param('user_id') user_id: string, @Query() query: BaseQueryDto) {
    return this.connectionsService.getFollowers(user_id, query.page || 1, query.limit || 20);
  }

  @Get('following')
  @ApiOperation({ summary: '[PUBLIC] Xem following của user (không cần đăng nhập)' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng mỗi trang (mặc định: 20)',
  })
  @ApiOkResponse({ description: 'Danh sách following với pagination' })
  async getFollowing(@Param('user_id') user_id: string, @Query() query: BaseQueryDto) {
    return this.connectionsService.getFollowing(user_id, query.page || 1, query.limit || 20);
  }
}
