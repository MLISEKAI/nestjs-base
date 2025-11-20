import { Controller, Get, Post, Delete, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiOkResponse } from '@nestjs/swagger';
import { UserConnectionsService } from '../service/user-connections.service';
import { ConnectionsResponseDto } from '../dto/user-response';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

@ApiTags('Connections')
@Controller('users')
export class ConnectionsController {
  constructor(private readonly connectionsService: UserConnectionsService) {}

  @Get(':id/stats')
  @ApiOperation({
    summary: 'Lấy thông tin tổng quan (followers_count, following_count, friends_count)',
  })
  @ApiParam({ name: 'id', description: 'ID của user' })
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
  async getStats(@Param('id') id: string) {
    return this.connectionsService.getStats(id);
  }

  @Post(':id/following/:target_id')
  @ApiOperation({ summary: 'Follow user khác' })
  async follow(@Param('id') userId: string, @Param('target_id') targetId: string, @Req() req: any) {
    // Tối ưu: Truyền req.user nếu có để tránh query lại
    return this.connectionsService.followUser(userId, targetId, req.user);
  }

  @Delete(':id/following/:following_id')
  @ApiOperation({ summary: 'Hủy follow user' })
  async unfollow(@Param('id') userId: string, @Param('following_id') followingId: string) {
    return this.connectionsService.unfollowUser(userId, followingId);
  }

  @Get(':id/followers')
  @ApiOperation({ summary: 'Danh sách followers' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng mỗi trang (mặc định: 20)',
  })
  @ApiOkResponse({
    description: 'Danh sách followers với pagination (chuẩn format)',
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
  async getFollowers(@Param('id') id: string, @Query() query: BaseQueryDto) {
    return this.connectionsService.getFollowers(id, query.page || 1, query.limit || 20);
  }

  @Delete(':id/followers/:follower_id')
  @ApiOperation({ summary: 'Xóa follower' })
  async removeFollower(@Param('id') userId: string, @Param('follower_id') followerId: string) {
    return this.connectionsService.removeFollower(userId, followerId);
  }

  @Get(':id/friends')
  @ApiOperation({ summary: 'Danh sách friends' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng mỗi trang (mặc định: 20)',
  })
  @ApiOkResponse({
    description: 'Danh sách friends với pagination (chuẩn format)',
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
  async getFriends(@Param('id') id: string, @Query() query: BaseQueryDto) {
    return this.connectionsService.getFriends(id, query.page || 1, query.limit || 20);
  }

  @Delete(':id/friends/:friend_id')
  @ApiOperation({ summary: 'Xóa friend' })
  async unfriend(@Param('id') userId: string, @Param('friend_id') friendId: string) {
    return this.connectionsService.unfriend(userId, friendId);
  }

  @Get(':id/connections')
  @ApiOperation({ summary: 'Lấy danh sách kết nối theo loại' })
  @ApiQuery({
    name: 'type',
    required: true,
    example: 'followers',
    enum: ['followers', 'following', 'friends'],
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng mỗi trang (mặc định: 20)',
  })
  @ApiOkResponse({
    description: 'Danh sách connections với pagination (chuẩn format)',
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
  async getConnections(
    @Param('id') userId: string,
    @Query('type') type: 'followers' | 'following' | 'friends',
    @Query() query: BaseQueryDto & { search?: string },
  ) {
    return this.connectionsService.getConnections(
      userId,
      type,
      query.search,
      query.page || 1,
      query.limit || 20,
    );
  }
}
