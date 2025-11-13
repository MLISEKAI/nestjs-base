import { Controller, Get, Patch, Delete, Param, Body, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { UserProfileService } from '../service/user-profile.service';
import { ProfileServiceDb } from '../profile_db.service';
import { UpdateUserProfileDto, UserProfileDto } from '../dto/profile.dto';
import { StatsQueryDto } from '../dto/stats-query.dto';

@ApiTags('Profile')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('profile')
export class UserProfileController {
  constructor(private readonly userProfile: UserProfileService, private readonly service: ProfileServiceDb) {}

  @Get(':user_id')
  @ApiOperation({ summary: 'Lấy thông tin cơ bản của user' })
  @ApiParam({ name: 'user_id', description: 'ID của user', type: String })
  @ApiOkResponse({
    description: 'Hồ sơ user theo schema Prisma',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'user-1' },
        union_id: { type: 'string', example: 'union-1' },
        role: { type: 'string', example: 'user' },
        nickname: { type: 'string', example: 'NguyenVanA' },
        bio: { type: 'string', example: 'I love coding' },
        avatar: { type: 'string', example: 'https://avatar.com/a.png' },
        gender: { type: 'string', example: 'male' },
        birthday: { type: 'string', example: '2000-01-01T00:00:00.000Z' },
        albums: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              image_url: { type: 'string' },
              photos: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    album_id: { type: 'string' },
                    image_url: { type: 'string' },
                    created_at: { type: 'string' },
                  },
                },
              },
            },
          },
        },
        wallet: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            balance: { type: 'number' },
            currency: { type: 'string' },
          },
        },
        vipStatus: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            is_vip: { type: 'boolean' },
            expiry: { type: 'string' },
          },
        },
        statusBadge: { type: 'string', example: 'Bronze' },
        isAccountLocked: { type: 'boolean', example: false },
        isBlockedByMe: { type: 'boolean', example: false },
        hasBlockedMe: { type: 'boolean', example: false },
        relationshipStatus: { type: 'string', example: 'single' },
      },
    },
  })
  getProfile(@Param('user_id') userId: string) {
    return this.userProfile.getProfile(userId);
  }

  @Patch(':user_id')
  @ApiOperation({ summary: 'Cập nhật hồ sơ user' })
  @ApiBody({ type: UpdateUserProfileDto })
  updateProfile(@Param('user_id') userId: string, @Body() dto: UpdateUserProfileDto) {
    return this.userProfile.updateProfile(userId, dto);
  }

  @Delete(':user_id')
  @ApiOperation({ summary: 'Xóa hồ sơ user' })
  deleteProfile(@Param('user_id') userId: string) {
    return this.userProfile.deleteProfile(userId);
  }

  @Get(':user_id/stats')
  @ApiOperation({ summary: 'Lấy thống kê của user' })
  @ApiOkResponse({
    description: 'Thống kê user theo schema Prisma',
    schema: {
      type: 'object',
      properties: {
        posts: { type: 'number', example: 10 },
        followers: { type: 'number', example: 100 },
        following: { type: 'number', example: 50 },
        totalViews: { type: 'number', example: 500 },
      },
    },
  })
  getStats(@Param('user_id') userId: string, @Query() query: StatsQueryDto) {
    return this.userProfile.getStats(userId, query);
  }

  @Get(':user_id/room/status')
  @ApiOperation({ summary: 'Trạng thái phòng của user' })
  @ApiOkResponse({
    description: 'Trạng thái phòng hiện tại của user',
    schema: {
      type: 'object',
      properties: {
        roomId: { type: 'string', example: 'room-123' },
        status: { type: 'string', example: 'active', description: 'Trạng thái phòng (active, offline, in-game, etc.)' },
        participants: { type: 'number', example: 5 },
        role: { type: 'string', example: 'host', description: 'Vai trò của user trong phòng' },
        joinedAt: { type: 'string', example: '2025-11-12T08:00:00Z', description: 'Thời gian user vào phòng' },
      },
    },
  })
  getRoomStatus(@Param('user_id') userId: string) {
    return this.userProfile.getRoomStatus(userId);
  }

  @Get(':user_id/interests')
  @ApiOperation({ summary: 'Danh sách sở thích của user' })
  @ApiOkResponse({
    description: 'Danh sách sở thích',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'interest-1' },
          name: { type: 'string', example: 'Football' },
          category: { type: 'string', example: 'Sports' },
        },
      },
    },
  })
  getUserInterests(@Param('user_id') userId: string) {
    return this.service.getUserInterests(userId);
  }

  @Get(':user_id/contribution')
  @ApiOperation({ summary: 'Lấy đóng góp của user' })
  @ApiOkResponse({
    description: 'Thông tin đóng góp của user',
    schema: {
      type: 'object',
      properties: {
        posts: { type: 'number', example: 12 },
        comments: { type: 'number', example: 34 },
        likesReceived: { type: 'number', example: 120 },
        shares: { type: 'number', example: 5 },
      },
    },
  })
  getUserContribution(@Param('user_id') userId: string) {
    return this.service.getUserContribution(userId);
  }
}