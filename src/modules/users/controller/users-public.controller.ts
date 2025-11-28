import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiOkResponse } from '@nestjs/swagger';
import { UserProfileService } from '../service/user-profile.service';
import { UserResponseDto } from '../dto/user-response';

/**
 * Public Users Controller - Không cần authentication
 * Dùng để xem public profile của user khác
 */
@ApiTags('Users (Public)')
@Controller('public/users')
export class UsersPublicController {
  constructor(private readonly profileService: UserProfileService) {}

  @Get(':user_id')
  @ApiOperation({ summary: '[PUBLIC] Xem public profile của user (không cần đăng nhập)' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiOkResponse({ type: UserResponseDto, description: 'Public profile của user (read-only)' })
  async getPublicProfile(@Param('user_id') user_id: string) {
    return this.profileService.findOne(user_id);
  }
}
