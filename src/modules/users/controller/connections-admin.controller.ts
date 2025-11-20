import { Controller, Get, Delete, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiOkResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { UserConnectionsService } from '../service/user-connections.service';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

/**
 * Admin Connections Controller - Chỉ admin mới truy cập được
 * Dùng để quản lý connections của bất kỳ user nào
 */
@ApiTags('Connections (Admin)')
@UseGuards(AuthGuard('account-auth'), AdminGuard)
@ApiBearerAuth('JWT-auth')
@Controller('admin/users/:user_id/connections')
export class ConnectionsAdminController {
  constructor(private readonly connectionsService: UserConnectionsService) {}

  @Get('stats')
  @ApiOperation({ summary: '[ADMIN] Lấy thông tin tổng quan của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiOkResponse({
    description: 'Stats',
    schema: {
      type: 'object',
      properties: {
        followers_count: { example: 100 },
        following_count: { example: 50 },
        friends_count: { example: 25 },
      },
    },
  })
  async getStats(@Param('user_id') userId: string) {
    return this.connectionsService.getStats(userId);
  }

  @Get('followers')
  @ApiOperation({ summary: '[ADMIN] Danh sách followers của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng mỗi trang (mặc định: 20)',
  })
  @ApiOkResponse({ description: 'Danh sách followers với pagination' })
  async getFollowers(@Param('user_id') userId: string, @Query() query: BaseQueryDto) {
    return this.connectionsService.getFollowers(userId, query.page || 1, query.limit || 20);
  }

  @Get('following')
  @ApiOperation({ summary: '[ADMIN] Danh sách following của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng mỗi trang (mặc định: 20)',
  })
  @ApiOkResponse({ description: 'Danh sách following với pagination' })
  async getFollowing(@Param('user_id') userId: string, @Query() query: BaseQueryDto) {
    return this.connectionsService.getFollowing(userId, query.page || 1, query.limit || 20);
  }

  @Delete('following/:following_id')
  @ApiOperation({ summary: '[ADMIN] Xóa following của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user' })
  @ApiParam({ name: 'following_id', description: 'ID của user muốn unfollow' })
  async removeFollowing(
    @Param('user_id') userId: string,
    @Param('following_id') followingId: string,
  ) {
    return this.connectionsService.unfollowUser(userId, followingId);
  }
}
