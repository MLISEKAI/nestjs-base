import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { UserProfileService } from '../service/profile-user.service';
import { ProfileServiceDb } from '../../profile.service';
import { UpdateUserProfileDto } from '../dto/profile.dto';
import { StatsQueryDto } from '../dto/stats-query.dto';

@ApiTags('Profile')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('profile')
export class UserProfileController {
  constructor(
    private readonly userProfile: UserProfileService,
    private readonly service: ProfileServiceDb,
  ) {}

  @Get(':user_id')
  @ApiOperation({ summary: 'Lấy thông tin cơ bản của user' })
  @ApiParam({ name: 'user_id', description: 'ID của user', type: String })
  @ApiOkResponse({
    description: 'Hồ sơ user theo schema Prisma',
    schema: {
      type: 'object',
      properties: {
        id: { example: 'user-1' },
        union_id: { example: 'union-1' },
        role: { example: 'user' },
        nickname: { example: 'NguyenVanA' },
        bio: { example: 'I love coding' },
        avatar: { example: 'https://avatar.com/a.png' },
        gender: { example: 'male' },
        birthday: { example: '2000-01-01T00:00:00.000Z' },
        albums: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { example: 'album-1' },
              title: { example: 'Summer Memories' },
              image_url: { example: 'https://img.com/cover1.png' },
              photos: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { example: 'photo-1' },
                    album_id: { example: 'album-1' },
                    image_url: { example: 'https://img.com/1.png' },
                    created_at: { example: '2025-01-01T00:00:00.000Z' },
                  },
                },
              },
            },
          },
        },
        wallet: {
          type: 'object',
          properties: {
            id: { example: 'wallet-1' },
            balance: { example: 1000 },
            currency: { example: 'gem' },
          },
        },
        vipStatus: {
          type: 'object',
          properties: {
            id: { example: 'vip-1' },
            is_vip: { example: true },
            expiry: { example: '2025-12-31T00:00:00.000Z' },
          },
        },
        statusBadge: { example: 'Bronze' },
        isAccountLocked: { example: false },
        isBlockedByMe: { example: false },
        hasBlockedMe: { example: false },
        relationshipStatus: { example: 'single' },
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
        posts: { example: 10 },
        followers: { example: 100 },
        following: { example: 50 },
        totalViews: { example: 500 },
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
        roomId: { example: 'room-123' },
        status: {
          example: 'active',
          description: 'Trạng thái phòng (active, offline, in-game, etc.)',
        },
        participants: { example: 5 },
        role: { example: 'host', description: 'Vai trò của user trong phòng' },
        joinedAt: { example: '2025-11-12T08:00:00Z', description: 'Thời gian user vào phòng' },
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
          id: { example: 'interest-1' },
          name: { example: 'Football' },
          category: { example: 'Sports' },
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
        posts: { example: 12 },
        comments: { example: 34 },
        likesReceived: { example: 120 },
        shares: { example: 5 },
      },
    },
  })
  getUserContribution(@Param('user_id') userId: string) {
    return this.service.getUserContribution(userId);
  }
}
