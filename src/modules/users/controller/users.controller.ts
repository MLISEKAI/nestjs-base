// Import các decorator và class từ NestJS để tạo controller
import {
  Controller,
  Get,
  Param,
  Put,
  Body,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
// Import interface để type-check request có user authenticated
import type { AuthenticatedRequest } from '../../../common/interfaces/request.interface';
// Import Cache để tối ưu performance
import { CacheInterceptor } from '../../../common/interceptors/cache.interceptor';
import { CacheResult } from '../../../common/decorators/cache-result.decorator';
// Import các decorator từ Swagger để tạo API documentation
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
// Import AuthGuard từ Passport để xác thực JWT token
import { AuthGuard } from '@nestjs/passport';
// Import OptionalAuthGuard để cho phép optional authentication
import { OptionalAuthGuard } from '../../../auth/guards/optional-auth.guard';
// Import các services để xử lý business logic
import { UserProfileService } from '../service/user-profile.service';
import { UserConnectionsService } from '../service/user-connections.service';
import { UserLevelService } from '../service/user-level.service';
// Import các DTO để validate và type-check dữ liệu
import { UserResponseDto, UpdateUserDto, UploadAvatarDto, SearchUsersQueryDto } from '../dto';
import { UserBalanceDto } from '../dto/user-level.dto';

/**
 * @ApiTags('Users (User)') - Nhóm các endpoints này trong Swagger UI với tag "Users (User)"
 * @Controller('users') - Định nghĩa base route là /users
 * UserController - Controller xử lý các HTTP requests liên quan đến user operations
 *
 * Chức năng chính:
 * - Tìm kiếm users (public hoặc optional auth)
 * - Xem profile của user khác (public)
 * - Update profile của chính mình (cần auth)
 * - Upload avatar (cần auth)
 * - Xem connections stats (cần auth)
 * - Xem user level và balance (cần auth)
 *
 * Lưu ý:
 * - Một số endpoints cần authentication, một số public
 * - OptionalAuthGuard cho phép endpoint hoạt động với hoặc không có token
 */
@ApiTags('Users (User)')
@Controller('users')
export class UserController {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject các services khi tạo instance của controller
   */
  constructor(
    private readonly profileService: UserProfileService,
    private readonly connectionsService: UserConnectionsService,
    private readonly levelService: UserLevelService,
  ) {}

  @Get()
  @UseInterceptors(CacheInterceptor) // Cache search results
  @CacheResult(60) // Cache 1 phút (search results thay đổi thường xuyên)
  @UseGuards(OptionalAuthGuard) // Optional auth: Nếu có token thì lấy user, không có thì vẫn cho phép
  @ApiBearerAuth('JWT-auth')
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
    // Loại bỏ user hiện tại khỏi kết quả nếu có authenticated
    const result = await this.profileService.searchUsers({
      ...query,
      excludeUserId: currentUserId,
    });
    // Convert readonly array to mutable array để tương thích với attachStatus signature
    const usersWithStatus = await this.connectionsService.attachStatus(currentUserId, [
      ...result.items,
    ]);
    // ResponseInterceptor sẽ tự động wrap với format chuẩn
    return {
      items: usersWithStatus,
      meta: result.meta,
    };
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor) // Cache để giảm từ 480ms xuống <50ms
  @CacheResult(300) // Cache 5 phút
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
  async updateProfile(@Req() req: AuthenticatedRequest, @Body() dto: UpdateUserDto) {
    const user_id = req.user.id;
    return this.profileService.updateProfile(user_id, dto);
  }

  @Post('me/avatar')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload avatar cho user hiện tại' })
  @ApiBody({ type: UploadAvatarDto })
  async uploadAvatar(@Req() req: AuthenticatedRequest, @Body() dto: UploadAvatarDto) {
    const user_id = req.user.id;
    return this.profileService.uploadAvatar(user_id, dto.fileUrl);
  }

  @Get('me/balance')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy thông tin cấp độ và XP của user hiện tại' })
  @ApiOkResponse({ type: UserBalanceDto })
  async getBalance(@Req() req: AuthenticatedRequest) {
    const user_id = req.user.id;
    return this.levelService.getUserBalance(user_id);
  }
}
