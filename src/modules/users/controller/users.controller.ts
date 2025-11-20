import { Controller, Get, Param, Put, Body, Post, Query, Req, UseGuards } from '@nestjs/common';
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
import { UserProfileService } from '../service/user-profile.service';
import {
  UserResponseDto,
  UpdateUserDto,
  UploadAvatarDto,
  SearchUsersQueryDto,
} from '../dto/user-response';
import { UserConnectionsService } from '../service/user-connections.service';
import { UserLevelService } from '../service/user-level.service';
import { UserBalanceDto } from '../dto/user-level.dto';

/**
 * User Controller - Một số endpoints cần auth, một số public
 */
@ApiTags('Users (User)')
@Controller('users')
export class UserController {
  constructor(
    private readonly profileService: UserProfileService,
    private readonly connectionsService: UserConnectionsService,
    private readonly levelService: UserLevelService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Tìm kiếm tất cả người dùng theo nickname hoặc ID' })
  @ApiQuery({ name: 'search', required: false, description: 'Từ khóa tìm kiếm (nickname hoặc ID)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng mỗi trang (mặc định: 20)',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Sắp xếp (field:asc hoặc field:desc, ví dụ: created_at:desc)',
  })
  @ApiOkResponse({
    description: 'Danh sách users với pagination (chuẩn format)',
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
              items: { $ref: '#/components/schemas/UserResponseDto' },
            },
            meta: {
              type: 'object',
              properties: {
                item_count: { type: 'number', example: 10 },
                total_items: { type: 'number', example: 100 },
                items_per_page: { type: 'number', example: 20 },
                total_pages: { type: 'number', example: 5 },
                current_page: { type: 'number', example: 1 },
              },
            },
          },
        },
        traceId: { type: 'string', example: 'VIHOLaKaWe' },
      },
    },
  })
  async searchUsers(@Req() req, @Query() query: SearchUsersQueryDto) {
    const currentUserId = req?.user?.id ?? null;
    const result = await this.profileService.searchUsers(query);
    const usersWithStatus = await this.connectionsService.attachStatus(currentUserId, result.items);
    // ResponseInterceptor sẽ tự động wrap với format chuẩn
    return {
      items: usersWithStatus,
      meta: result.meta,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy thông tin chi tiết user theo id',
    description:
      'Lấy thông tin public profile của user theo ID. Để lấy thông tin user hiện tại, dùng GET /auth/me',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của user',
    example: 'user-id-123',
  })
  @ApiOkResponse({ type: UserResponseDto })
  async getProfile(@Param('id') id: string) {
    // Lấy user theo ID (public profile, không cần token)
    return this.profileService.findOne(id);
  }

  @Put('me')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cập nhật thông tin cá nhân của user hiện tại' })
  @ApiBody({ type: UpdateUserDto })
  async updateProfile(@Req() req: any, @Body() dto: UpdateUserDto) {
    const userId = req.user.id;
    return this.profileService.updateProfile(userId, dto);
  }

  @Post('me/avatar')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload avatar cho user hiện tại' })
  @ApiBody({ type: UploadAvatarDto })
  async uploadAvatar(@Req() req: any, @Body() dto: UploadAvatarDto) {
    const userId = req.user.id;
    return this.profileService.uploadAvatar(userId, dto.fileUrl);
  }

  @Get('me/balance')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy thông tin cấp độ và XP của user hiện tại' })
  @ApiOkResponse({ type: UserBalanceDto })
  async getBalance(@Req() req: any) {
    const userId = req.user.id;
    return this.levelService.getUserBalance(userId);
  }
}
