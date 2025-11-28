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
import type { AuthenticatedRequest } from '../../../../common/interfaces/request.interface';

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
  getMyProfile(@Req() req: AuthenticatedRequest) {
    const user_id = req.user.id;
    return this.userProfile.getProfile(user_id, user_id);
  }

  @Patch('me')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cập nhật hồ sơ của user hiện tại' })
  @ApiBody({ type: UpdateUserProfileDto })
  updateProfile(@Req() req: AuthenticatedRequest, @Body() dto: UpdateUserProfileDto) {
    const user_id = req.user.id;
    return this.userProfile.updateProfile(user_id, dto);
  }

  @Delete('me')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Xóa hồ sơ của user hiện tại' })
  deleteProfile(@Req() req: AuthenticatedRequest) {
    const user_id = req.user.id;
    return this.userProfile.deleteProfile(user_id);
  }

  // @Get('me/stats') - Đã gộp vào GET /connections/stats
  // Endpoint này đã được gộp vào /connections/stats để tránh trùng lặp
  // Sử dụng GET /connections/stats để lấy đầy đủ thống kê (posts, followers, following, friends, views)

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
  getRoomStatus(@Req() req: AuthenticatedRequest) {
    const user_id = req.user.id;
    return this.userProfile.getRoomStatus(user_id);
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
  getUserInterests(@Req() req: AuthenticatedRequest) {
    const user_id = req.user.id;
    return this.service.getUserInterests(user_id);
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
  getUserContribution(@Req() req: AuthenticatedRequest) {
    const user_id = req.user.id;
    return this.service.getUserContribution(user_id);
  }
}
