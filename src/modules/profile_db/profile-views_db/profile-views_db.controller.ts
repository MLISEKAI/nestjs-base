import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProfileViewsServiceDb } from '../profile-views_db/profile-views_db.service';

@ApiTags('Profile Views')
@Controller('/profile')
export class ProfileViewsControllerDb {
    constructor(
    private prisma: PrismaService,
    private profileViewsService: ProfileViewsServiceDb
    ) {}
  
    // POST: Ghi log khi user A xem hồ sơ user B
    @Post(':target_user_id/profile-views')
    @ApiOperation({ summary: 'Ghi log khi user A xem hồ sơ của user B' })
    @ApiParam({ name: 'target_user_id', description: 'ID của user được xem hồ sơ', type: String })
    @ApiCreatedResponse({
      description: 'Profile view theo schema Prisma',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'pv-1' },
          target_user_id: { type: 'string', example: 'user-2' },
          viewer_id: { type: 'string', example: 'user-1' },
          viewed_at: { type: 'string', example: '2025-11-12T00:00:00.000Z' },
        },
      },
    })
    logProfileView(@Param('target_user_id') targetId: string, @Query('viewer_id') viewerId: string) {
      return this.profileViewsService.logProfileView(targetId, viewerId);
    }
    
    // GET: Lấy thời gian cuối cùng user xem hồ sơ người khác
    @Get(':target_user_id/last-view')
    @ApiOperation({ summary: 'Lấy thời gian cuối cùng user xem hồ sơ của người khác' })
    @ApiParam({ name: 'target_user_id', description: 'ID của user được xem hồ sơ', type: String })
    @ApiQuery({ name: 'viewer_id', description: 'ID của user xem hồ sơ', type: String })
    @ApiOkResponse({
      description: 'Lần xem cuối cùng theo schema Prisma',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'pv-1' },
          target_user_id: { type: 'string', example: 'user-2' },
          viewer_id: { type: 'string', example: 'user-1' },
          viewed_at: { type: 'string', example: '2025-11-12T00:00:00.000Z' },
        },
      },
    })
    getLastView(@Param('target_user_id') targetId: string, @Query('viewer_id') viewerId: string) {
      return this.profileViewsService.getLastView(targetId, viewerId);
    }
    // GET: Lấy danh sách hoặc tổng lượt xem hồ sơ
    @Get(':user_id/profile-views')
    @ApiOperation({ summary: 'Lấy danh sách hoặc tổng lượt xem hồ sơ của user' })
    @ApiParam({ name: 'user_id', description: 'ID của user', type: String })
    @ApiQuery({ name: 'full', required: false, description: 'Có lấy chi tiết đầy đủ không (true/false)', type: String })
    @ApiOkResponse({
    description: 'Danh sách lượt xem theo schema Prisma',
    schema: {
      oneOf: [
        {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              viewer_id: { type: 'string' },
              viewed_at: { type: 'string' },
            },
          },
        },
        {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              viewer_id: { type: 'string' },
              viewed_at: { type: 'string' },
              viewer_name: { type: 'string' },
            },
          },
        },
      ],
    },
  })
   getProfileViews(@Param('user_id') userId: string, @Query('full') full?: string) {
     return this.profileViewsService.getProfileViews(userId, full === 'true');
    }
    

  // GET: Lấy thông tin các tính năng user đã kích hoạt
  @Get(':user_id/features')
  @ApiOperation({ summary: 'Lấy danh sách tính năng user đã kích hoạt (mock data)' })
  @ApiParam({ name: 'user_id', description: 'ID của user', type: String })
  @ApiOkResponse({
    description: 'Thông tin tính năng',
    schema: {
      type: 'object',
      properties: {
        user_id: { type: 'string' },
        features: {
          type: 'object',
          properties: {
            profile_view_full: { type: 'boolean' },
            boost_post: { type: 'boolean' },
            invisible_mode: { type: 'boolean' },
          },
        },
      },
    },
  })
  getUserFeatures(@Param('user_id') userId: string) {
    const features = {
      profile_view_full: false,
      boost_post: false,
      invisible_mode: false,
    };
    return { user_id: userId, features };
  }
}
