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
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor } from '../../../common/interceptors/cache.interceptor';
import { CacheResult } from '../../../common/decorators/cache-result.decorator';
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
import type { AuthenticatedRequest } from '../../../common/interfaces/request.interface';

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
  @UseInterceptors(CacheInterceptor)
  @CacheResult(300) // Cache 5 phút
  @ApiOperation({
    summary: 'Lấy thống kê tổng quan của user hiện tại',
    description:
      'Lấy tất cả thống kê của user hiện tại bao gồm: số bài post, số followers, số following, số friends, và tổng số views. Endpoint này gộp thông tin từ profile stats và connections stats.',
  })
  @ApiOkResponse({
    description: 'Thống kê đầy đủ của user',
    schema: {
      type: 'object',
      properties: {
        posts: { type: 'number', example: 10, description: 'Số bài post của user' },
        followers_count: { type: 'number', example: 100, description: 'Số người follow user' },
        following_count: {
          type: 'number',
          example: 50,
          description: 'Số người mà user đang follow',
        },
        friends_count: { type: 'number', example: 25, description: 'Số friends (mutual follow)' },
        views_count: { type: 'number', example: 500, description: 'Tổng số lượt xem profile' },
      },
    },
  })
  async getStats(@Req() req: AuthenticatedRequest) {
    const user_id = req.user.id;
    return this.connectionsService.getStats(user_id);
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
  async follow(@Req() req: AuthenticatedRequest, @Param('target_id') targetId: string) {
    const user_id = req.user.id;
    return this.connectionsService.followUser(user_id, targetId, req.user);
  }

  @Delete('following/:following_id')
  @ApiOperation({ summary: 'Hủy follow user' })
  @ApiParam({ name: 'following_id', description: 'ID của user muốn unfollow' })
  async unfollow(@Req() req: AuthenticatedRequest, @Param('following_id') followingId: string) {
    const user_id = req.user.id;
    return this.connectionsService.unfollowUser(user_id, followingId);
  }

  @Get('following')
  @UseInterceptors(CacheInterceptor)
  @CacheResult(300) // Cache 5 phút
  @ApiOperation({
    summary: 'Danh sách following của user hiện tại',
    description:
      'Lấy danh sách những người mà user hiện tại đang follow. Hỗ trợ pagination để phân trang kết quả.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng mỗi trang (mặc định: 20)',
  })
  @ApiOkResponse({
    description: 'Danh sách following với pagination (chuẩn format)',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'boolean', example: false },
        code: { type: 'number', example: 0 },
        message: { type: 'string', example: 'Success' },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'user-id-123' },
                  nickname: { type: 'string', example: 'John Doe' },
                  avatar: {
                    type: 'string',
                    nullable: true,
                    example: 'https://example.com/avatar.jpg',
                  },
                  is_following: { type: 'boolean', example: true },
                  is_friend: { type: 'boolean', example: false },
                },
              },
            },
            meta: {
              type: 'object',
              properties: {
                total: { type: 'number', example: 50 },
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 20 },
                totalPages: { type: 'number', example: 3 },
              },
            },
          },
        },
        traceId: { type: 'string' },
      },
    },
  })
  async getFollowing(@Req() req: AuthenticatedRequest, @Query() query: BaseQueryDto) {
    const user_id = req.user.id;
    return this.connectionsService.getFollowing(user_id, query.page || 1, query.limit || 20);
  }

  @Get('followers')
  @UseInterceptors(CacheInterceptor)
  @CacheResult(300) // Cache 5 phút
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
  async getFollowers(@Req() req: AuthenticatedRequest, @Query() query: BaseQueryDto) {
    const user_id = req.user.id;
    return this.connectionsService.getFollowers(user_id, query.page || 1, query.limit || 20);
  }

  @Delete('followers/:follower_id')
  @ApiOperation({ summary: 'Xóa follower của user hiện tại' })
  @ApiParam({ name: 'follower_id', description: 'ID của follower muốn xóa' })
  async removeFollower(@Req() req: AuthenticatedRequest, @Param('follower_id') followerId: string) {
    const user_id = req.user.id;
    return this.connectionsService.removeFollower(user_id, followerId);
  }

  @Get('friends')
  @UseInterceptors(CacheInterceptor)
  @CacheResult(300) // Cache 5 phút
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
  async getFriends(@Req() req: AuthenticatedRequest, @Query() query: BaseQueryDto) {
    const user_id = req.user.id;
    return this.connectionsService.getFriends(user_id, query.page || 1, query.limit || 20);
  }

  @Delete('friends/:friend_id')
  @ApiOperation({ summary: 'Xóa friend của user hiện tại' })
  @ApiParam({ name: 'friend_id', description: 'ID của friend muốn xóa' })
  async unfriend(@Req() req: AuthenticatedRequest, @Param('friend_id') friendId: string) {
    const user_id = req.user.id;
    return this.connectionsService.unfriend(user_id, friendId);
  }

  @Get('connections')
  @UseInterceptors(CacheInterceptor)
  @CacheResult(300) // Cache 5 phút
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
    @Req() req: AuthenticatedRequest,
    @Query('type') type: 'followers' | 'following' | 'friends',
    @Query() query: BaseQueryDto & { search?: string },
  ) {
    const user_id = req.user.id;
    return this.connectionsService.getConnections(
      user_id,
      type,
      query.search,
      query.page || 1,
      query.limit || 20,
    );
  }
}
