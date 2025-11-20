import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Req,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiOkResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserConnectionsService } from '../service/user-connections.service';
import { ConnectionsResponseDto } from '../dto/user-response';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

/**
 * User Connections Controller - Yêu cầu authentication
 * User chỉ có thể follow/unfollow từ chính mình
 */
@ApiTags('Connections (User)')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard('account-auth'))
@ApiBearerAuth('JWT-auth')
@Controller('connections')
export class ConnectionsController {
  constructor(private readonly connectionsService: UserConnectionsService) {}

  @Get('stats')
  @ApiOperation({
    summary:
      'Lấy thông tin tổng quan của user hiện tại (followers_count, following_count, friends_count)',
  })
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
  async getStats(@Req() req: any) {
    const userId = req.user.id;
    return this.connectionsService.getStats(userId);
  }

  @Post('following/:target_id')
  @ApiOperation({ summary: 'Follow user khác' })
  @ApiParam({ name: 'target_id', description: 'ID của user muốn follow' })
  @ApiOkResponse({
    description: 'Follow relationship đã được tạo',
    schema: {
      type: 'object',
      properties: {
        follower_id: { type: 'string', example: 'user-id-123' },
        following_id: { type: 'string', example: 'user-id-456' },
        following: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            nickname: { type: 'string' },
            avatar: { type: 'string', nullable: true },
          },
        },
        is_friend: { type: 'boolean', example: false },
        created_at: { type: 'string', format: 'date-time' },
      },
    },
  })
  async follow(@Req() req: any, @Param('target_id') targetId: string) {
    const userId = req.user.id;
    return this.connectionsService.followUser(userId, targetId, req.user);
  }

  @Delete('following/:following_id')
  @ApiOperation({ summary: 'Hủy follow user' })
  @ApiParam({ name: 'following_id', description: 'ID của user muốn unfollow' })
  async unfollow(@Req() req: any, @Param('following_id') followingId: string) {
    const userId = req.user.id;
    return this.connectionsService.unfollowUser(userId, followingId);
  }

  @Get('followers')
  @ApiOperation({ summary: 'Danh sách followers của user hiện tại' })
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
  async getFollowers(@Req() req: any, @Query() query: BaseQueryDto) {
    const userId = req.user.id;
    return this.connectionsService.getFollowers(userId, query.page || 1, query.limit || 20);
  }

  @Delete('followers/:follower_id')
  @ApiOperation({ summary: 'Xóa follower của user hiện tại' })
  @ApiParam({ name: 'follower_id', description: 'ID của follower muốn xóa' })
  async removeFollower(@Req() req: any, @Param('follower_id') followerId: string) {
    const userId = req.user.id;
    return this.connectionsService.removeFollower(userId, followerId);
  }

  @Get('friends')
  @ApiOperation({ summary: 'Danh sách friends của user hiện tại' })
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
  async getFriends(@Req() req: any, @Query() query: BaseQueryDto) {
    const userId = req.user.id;
    return this.connectionsService.getFriends(userId, query.page || 1, query.limit || 20);
  }

  @Delete('friends/:friend_id')
  @ApiOperation({ summary: 'Xóa friend của user hiện tại' })
  @ApiParam({ name: 'friend_id', description: 'ID của friend muốn xóa' })
  async unfriend(@Req() req: any, @Param('friend_id') friendId: string) {
    const userId = req.user.id;
    return this.connectionsService.unfriend(userId, friendId);
  }

  @Get('connections')
  @ApiOperation({ summary: 'Lấy danh sách kết nối theo loại của user hiện tại' })
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
    @Req() req: any,
    @Query('type') type: 'followers' | 'following' | 'friends',
    @Query() query: BaseQueryDto & { search?: string },
  ) {
    const userId = req.user.id;
    return this.connectionsService.getConnections(
      userId,
      type,
      query.search,
      query.page || 1,
      query.limit || 20,
    );
  }
}
