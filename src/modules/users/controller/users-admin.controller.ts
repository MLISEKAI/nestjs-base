import { Controller, Get, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { UserProfileService } from '../service/user-profile.service';
import { UserLevelService } from '../service/user-level.service';
import { UpdateUserDto } from '../dto/user-response';
import { UserBalanceDto } from '../dto/user-level.dto';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

/**
 * Admin Users Controller - Chỉ admin mới truy cập được
 * Dùng để quản lý users (ban, unban, xem thông tin)
 */
@ApiTags('Users (Admin)')
@UseGuards(AuthGuard('account-auth'), AdminGuard)
@ApiBearerAuth('JWT-auth')
@Controller('admin/users')
export class UsersAdminController {
  constructor(
    private readonly profileService: UserProfileService,
    private readonly levelService: UserLevelService,
  ) {}

  @Get()
  @ApiOperation({ summary: '[ADMIN] Lấy danh sách tất cả users' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng mỗi trang (mặc định: 20)',
  })
  @ApiOkResponse({ description: 'Danh sách users với pagination' })
  async getAllUsers(@Query() query: BaseQueryDto) {
    // TODO: Implement getAllUsers method
    return { items: [], meta: { total_items: 0, current_page: 1, items_per_page: 20 } };
  }

  @Get(':user_id')
  @ApiOperation({ summary: '[ADMIN] Lấy thông tin chi tiết user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiOkResponse({ description: 'Thông tin user' })
  async getUser(@Param('user_id') userId: string) {
    return this.profileService.findOne(userId);
  }

  @Put(':user_id')
  @ApiOperation({ summary: '[ADMIN] Cập nhật thông tin user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user' })
  @ApiBody({ type: UpdateUserDto })
  async updateUser(@Param('user_id') userId: string, @Body() dto: UpdateUserDto) {
    return this.profileService.updateProfile(userId, dto);
  }

  @Delete(':user_id')
  @ApiOperation({ summary: '[ADMIN] Xóa user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user' })
  @ApiOkResponse({
    description: 'User đã bị xóa',
    schema: {
      type: 'object',
      properties: {
        message: { example: 'User deleted successfully' },
      },
    },
  })
  async deleteUser(@Param('user_id') userId: string) {
    // TODO: Implement deleteUser method
    return { message: 'User deleted successfully' };
  }

  @Get(':user_id/balance')
  @ApiOperation({ summary: '[ADMIN] Lấy thông tin cấp độ và XP của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiOkResponse({ type: UserBalanceDto })
  async getBalance(@Param('user_id') userId: string) {
    return this.levelService.getUserBalance(userId);
  }
}
