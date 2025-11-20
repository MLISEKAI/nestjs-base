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
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiOkResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserProfileService } from '../service/profile-user.service';
import { ProfileServiceDb } from '../../profile.service';
import { UpdateUserProfileDto } from '../dto/profile.dto';
import { StatsQueryDto } from '../dto/stats-query.dto';

/**
 * User Profile Controller - Một số endpoints cần auth, một số public
 */
@ApiTags('Profile (User)')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('profile')
export class UserProfileController {
  constructor(
    private readonly userProfile: UserProfileService,
    private readonly service: ProfileServiceDb,
  ) {}

  @Get('me')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy thông tin cơ bản của user hiện tại' })
  @ApiOkResponse({
    description: 'Hồ sơ user theo schema Prisma',
  })
  getMyProfile(@Req() req: any) {
    const userId = req.user.id;
    return this.userProfile.getProfile(userId, userId);
  }

  @Patch('me')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cập nhật hồ sơ của user hiện tại' })
  @ApiBody({ type: UpdateUserProfileDto })
  updateProfile(@Req() req: any, @Body() dto: UpdateUserProfileDto) {
    const userId = req.user.id;
    return this.userProfile.updateProfile(userId, dto);
  }

  @Delete('me')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Xóa hồ sơ của user hiện tại' })
  deleteProfile(@Req() req: any) {
    const userId = req.user.id;
    return this.userProfile.deleteProfile(userId);
  }

  @Get('me/stats')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy thống kê của user hiện tại' })
  @ApiOkResponse({
    description: 'Thống kê user theo schema Prisma',
    schema: {
      type: 'object',
      properties: {
        posts: { example: 10 },
        followers_count: { example: 100 },
        following_count: { example: 50 },
        totalViews_count: { example: 500 },
      },
    },
  })
  getStats(@Req() req: any, @Query() query: StatsQueryDto) {
    const userId = req.user.id;
    return this.userProfile.getStats(userId, query);
  }

  @Get('me/room/status')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Trạng thái phòng của user hiện tại' })
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
  getRoomStatus(@Req() req: any) {
    const userId = req.user.id;
    return this.userProfile.getRoomStatus(userId);
  }

  @Get('me/interests')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Danh sách sở thích của user hiện tại' })
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
  getUserInterests(@Req() req: any) {
    const userId = req.user.id;
    return this.service.getUserInterests(userId);
  }

  @Get('me/contribution')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy đóng góp của user hiện tại' })
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
  getUserContribution(@Req() req: any) {
    const userId = req.user.id;
    return this.service.getUserContribution(userId);
  }
}
