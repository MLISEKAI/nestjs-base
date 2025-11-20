import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiOkResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { ProfileViewsServiceDb } from './profile-views.service';

/**
 * Admin Profile Views Controller - Chỉ admin mới truy cập được
 * Dùng để xem profile views của bất kỳ user nào (analytics)
 */
@ApiTags('Profile Views (Admin)')
@UseGuards(AuthGuard('account-auth'), AdminGuard)
@ApiBearerAuth('JWT-auth')
@Controller('admin/users/:user_id/profile-views')
export class ProfileViewsAdminController {
  constructor(private readonly profileViewsService: ProfileViewsServiceDb) {}

  @Get()
  @ApiOperation({ summary: '[ADMIN] Lấy danh sách hoặc tổng lượt xem hồ sơ của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiQuery({
    name: 'full',
    required: false,
    description: 'Có lấy chi tiết đầy đủ không (true/false)',
    type: String,
  })
  @ApiOkResponse({
    description: 'Danh sách lượt xem theo schema Prisma',
  })
  getProfileViews(@Param('user_id') userId: string, @Query('full') full?: string) {
    return this.profileViewsService.getProfileViews(userId, full === 'true');
  }
}
