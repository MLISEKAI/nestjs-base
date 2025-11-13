import { Controller, Get, Post, Delete, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiOkResponse } from '@nestjs/swagger';
import { UserConnectionsService } from '../service/user-connections.service';
import { ConnectionsResponseDto } from '../dto/user-response';

@ApiTags('Connections')
@Controller('users')
export class ConnectionsController {
  constructor(private readonly connectionsService: UserConnectionsService) {}

  @Get(':id/stats')
  @ApiOperation({ summary: 'Lấy thông tin tổng quan (followers, following, friends)' })
  @ApiParam({ name: 'id', description: 'ID của user' })
  @ApiOkResponse({ description: 'Stats', schema: { type: 'object', properties: { followers: { type: 'number' }, following: { type: 'number' }, friends: { type: 'number' } } } })
  async getStats(@Param('id') id: string) {
    return this.connectionsService.getStats(id);
  }

  @Post(':id/following/:target_id')
  @ApiOperation({ summary: 'Follow user khác' })
  async follow(@Param('id') userId: string, @Param('target_id') targetId: string) {
    return this.connectionsService.followUser(userId, targetId);
  }

  @Delete(':id/following/:following_id')
  @ApiOperation({ summary: 'Hủy follow user' })
  async unfollow(@Param('id') userId: string, @Param('following_id') followingId: string) {
    return this.connectionsService.unfollowUser(userId, followingId);
  }

  @Get(':id/followers')
  @ApiOperation({ summary: 'Danh sách followers' })
  @ApiOkResponse({ type: ConnectionsResponseDto })
  async getFollowers(@Param('id') id: string) {
    return this.connectionsService.getFollowers(id);
  }

  @Delete(':id/followers/:follower_id')
  @ApiOperation({ summary: 'Xóa follower' })
  async removeFollower(@Param('id') userId: string, @Param('follower_id') followerId: string) {
    return this.connectionsService.removeFollower(userId, followerId);
  }

  @Get(':id/friends')
  @ApiOperation({ summary: 'Danh sách friends' })
  @ApiOkResponse({ type: ConnectionsResponseDto })
  async getFriends(@Param('id') id: string) {
    return this.connectionsService.getFriends(id);
  }

  @Delete(':id/friends/:friend_id')
  @ApiOperation({ summary: 'Xóa friend' })
  async unfriend(@Param('id') userId: string, @Param('friend_id') friendId: string) {
    return this.connectionsService.unfriend(userId, friendId);
  }

  @Get(':id/connections')
  @ApiOperation({ summary: 'Lấy danh sách kết nối theo loại' })
  @ApiQuery({ name: 'type', required: true, example: 'followers', enum: ['followers','following','friends'] })
  @ApiQuery({ name: 'search', required: false })
  @ApiOkResponse({ type: ConnectionsResponseDto })
  async getConnections(
    @Param('id') userId: string,
    @Query('type') type: 'followers' | 'following' | 'friends',
    @Query('search') search?: string
  ) {
    return this.connectionsService.getConnections(userId, type, search);
  }
}
