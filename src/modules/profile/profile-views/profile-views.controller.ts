import { Controller, Get, Post, Param, Query, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProfileViewsServiceDb } from './profile-views.service';

/**
 * User Profile Views Controller - Yêu cầu authentication
 * User chỉ có thể xem profile views của chính mình
 */
@ApiTags('Profile Views (User)')
@UseGuards(AuthGuard('account-auth'))
@ApiBearerAuth('JWT-auth')
@Controller('profile-views')
export class ProfileViewsControllerDb {
  constructor(
    private prisma: PrismaService,
    private profileViewsService: ProfileViewsServiceDb,
  ) {}

  // POST: Ghi log khi user hiện tại xem hồ sơ user khác
  @Post(':target_user_id')
  @ApiOperation({ summary: 'Ghi log khi user hiện tại xem hồ sơ của user khác' })
  @ApiParam({ name: 'target_user_id', description: 'ID của user được xem hồ sơ', type: String })
  @ApiCreatedResponse({
    description: 'Profile view theo schema Prisma',
    schema: {
      type: 'object',
      properties: {
        id: { example: 'pv-1' },
        target_user_id: { example: 'user-2' },
        viewer_id: { example: 'user-1' },
        viewed_at: { example: '2025-11-12T00:00:00.000Z' },
      },
    },
  })
  logProfileView(@Req() req: any, @Param('target_user_id') targetId: string) {
    const viewerId = req.user.id;
    return this.profileViewsService.logProfileView(targetId, viewerId);
  }

  // GET: Lấy thời gian cuối cùng user hiện tại xem hồ sơ người khác
  @Get('last-view/:target_user_id')
  @ApiOperation({ summary: 'Lấy thời gian cuối cùng user hiện tại xem hồ sơ của người khác' })
  @ApiParam({ name: 'target_user_id', description: 'ID của user được xem hồ sơ', type: String })
  @ApiOkResponse({
    description: 'Lần xem cuối cùng theo schema Prisma',
    schema: {
      type: 'object',
      properties: {
        id: { example: 'pv-1' },
        target_user_id: { example: 'user-2' },
        viewer_id: { example: 'user-1' },
        viewed_at: { example: '2025-11-12T00:00:00.000Z' },
      },
    },
  })
  getLastView(@Req() req: any, @Param('target_user_id') targetId: string) {
    const viewerId = req.user.id;
    return this.profileViewsService.getLastView(targetId, viewerId);
  }

  // GET: Lấy danh sách hoặc tổng lượt xem hồ sơ của user hiện tại
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách hoặc tổng lượt xem hồ sơ của user hiện tại' })
  @ApiQuery({
    name: 'full',
    required: false,
    description: 'Có lấy chi tiết đầy đủ không (true/false)',
    type: String,
  })
  @ApiOkResponse({
    description: 'Danh sách lượt xem theo schema Prisma',
    schema: {
      oneOf: [
        {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              viewer_id: { example: 'user-1' },
              viewed_at: { example: '2025-11-12T00:00:00.000Z' },
            },
          },
        },
        {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              viewer_id: { example: 'user-1' },
              viewed_at: { example: '2025-11-12T00:00:00.000Z' },
              viewer_name: { example: 'NguyenVanA' },
            },
          },
        },
      ],
    },
  })
  getProfileViews(@Req() req: any, @Query('full') full?: string) {
    const userId = req.user.id;
    return this.profileViewsService.getProfileViews(userId, full === 'true');
  }

  // GET: Lấy thông tin các tính năng user hiện tại đã kích hoạt
  @Get('features')
  @ApiOperation({ summary: 'Lấy danh sách tính năng user hiện tại đã kích hoạt (mock data)' })
  @ApiOkResponse({
    description: 'Thông tin tính năng',
    schema: {
      type: 'object',
      properties: {
        user_id: { example: 'user-1' },
        features: {
          type: 'object',
          properties: {
            profile_view_full: { example: false },
            boost_post: { example: false },
            invisible_mode: { example: false },
          },
        },
      },
    },
  })
  getUserFeatures(@Req() req: any) {
    const userId = req.user.id;
    const features = {
      profile_view_full: false,
      boost_post: false,
      invisible_mode: false,
    };
    return { user_id: userId, features };
  }
}
