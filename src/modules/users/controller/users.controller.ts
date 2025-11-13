import { Controller, Get, Param, Put, Body, Post, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiOkResponse, ApiBody } from '@nestjs/swagger';
import { UserProfileService } from '../service/user-profile.service';
import { UserResponseDto, UpdateUserDto, UploadAvatarDto, SearchUsersQueryDto } from '../dto/user-response';
import { UserConnectionsService } from '../service/user-connections.service';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly profileService: UserProfileService,
       private readonly connectionsService: UserConnectionsService
  ) {}


  @Get()
  @ApiOperation({ summary: 'Tìm kiếm tất cả người dùng theo nickname hoặc ID' })
  @ApiOkResponse({ type: [UserResponseDto] })
  async searchUsers(@Req() req, @Query() query: SearchUsersQueryDto) {
    const currentUserId = req?.user?.id ?? null;
    const result = await this.profileService.searchUsers(query);
    const usersWithStatus = await this.connectionsService.attachStatus(currentUserId, result.users);
    return { message: result.message, users: usersWithStatus, page: result.page, limit: result.limit, total: result.total };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết user theo id' })
  @ApiParam({ name: 'id', description: 'ID của user', example: 'User ID' })
  @ApiOkResponse({ type: UserResponseDto })
  async getProfile(@Param('id') id: string) {
    return this.profileService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin cá nhân của user' })
  @ApiParam({ name: 'id', description: 'ID của user', example: 'User ID' })
  @ApiBody({ type: UpdateUserDto })
  async updateProfile(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.profileService.updateProfile(id, dto);
  }

  @Post(':id/avatar')
  @ApiOperation({ summary: 'Upload avatar cho user' })
  @ApiParam({ name: 'id', description: 'ID user', example: 'User ID' })
  @ApiBody({ type: UploadAvatarDto })
  async uploadAvatar(@Param('id') id: string, @Body() dto: UploadAvatarDto) {
    return this.profileService.uploadAvatar(id, dto.fileUrl);
  }
}
