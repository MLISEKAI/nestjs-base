import { Controller, Get, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
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
import { AdminGuard } from '../../../../common/guards/admin.guard';
import { UserProfileService } from '../service/profile-user.service';
import { ProfileServiceDb } from '../../profile.service';
import { UpdateUserProfileDto } from '../dto/profile.dto';
import { StatsQueryDto } from '../dto/stats-query.dto';

/**
 * Admin Profile Controller - Chỉ admin mới truy cập được
 * Dùng để quản lý profiles của bất kỳ user nào
 */
@ApiTags('Profile (Admin)')
@UseGuards(AuthGuard('account-auth'), AdminGuard)
@ApiBearerAuth('JWT-auth')
@Controller('admin/users/:user_id/profile')
export class ProfileAdminController {
  constructor(
    private readonly userProfile: UserProfileService,
    private readonly service: ProfileServiceDb,
  ) {}

  @Get()
  @ApiOperation({ summary: '[ADMIN] Lấy thông tin profile của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiQuery({
    name: 'current_user_id',
    description: 'ID của admin đang xem (optional)',
    required: false,
    type: String,
  })
  @ApiOkResponse({ description: 'Hồ sơ user theo schema Prisma' })
  getProfile(@Param('user_id') userId: string, @Query('current_user_id') currentUserId?: string) {
    return this.userProfile.getProfile(userId, currentUserId);
  }

  @Patch()
  @ApiOperation({ summary: '[ADMIN] Cập nhật profile của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user' })
  @ApiBody({ type: UpdateUserProfileDto })
  updateProfile(@Param('user_id') userId: string, @Body() dto: UpdateUserProfileDto) {
    return this.userProfile.updateProfile(userId, dto);
  }

  @Delete()
  @ApiOperation({ summary: '[ADMIN] Xóa profile của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user' })
  deleteProfile(@Param('user_id') userId: string) {
    return this.userProfile.deleteProfile(userId);
  }

  @Get('stats')
  @ApiOperation({ summary: '[ADMIN] Lấy thống kê của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiOkResponse({
    description: 'Thống kê user theo schema Prisma',
  })
  getStats(@Param('user_id') userId: string, @Query() query: StatsQueryDto) {
    return this.userProfile.getStats(userId, query);
  }

  @Get('room/status')
  @ApiOperation({ summary: '[ADMIN] Trạng thái phòng của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiOkResponse({ description: 'Trạng thái phòng hiện tại của user' })
  getRoomStatus(@Param('user_id') userId: string) {
    return this.userProfile.getRoomStatus(userId);
  }

  @Get('interests')
  @ApiOperation({ summary: '[ADMIN] Danh sách sở thích của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiOkResponse({ description: 'Danh sách sở thích' })
  getUserInterests(@Param('user_id') userId: string) {
    return this.service.getUserInterests(userId);
  }

  @Get('contribution')
  @ApiOperation({ summary: '[ADMIN] Lấy đóng góp của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiOkResponse({ description: 'Thông tin đóng góp của user' })
  getUserContribution(@Param('user_id') userId: string) {
    return this.service.getUserContribution(userId);
  }
}
