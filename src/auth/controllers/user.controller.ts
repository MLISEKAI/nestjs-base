import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../auth.service';
import { LinkProviderDto } from '../dto';

/**
 * UserController - Xử lý user info và link provider
 */
@ApiTags('Auth - User')
@Controller('auth')
export class UserController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @ApiOperation({ summary: 'Lấy thông tin user hiện tại từ token' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('account-auth'))
  async getCurrentUser(@Req() req: any) {
    return this.authService.getCurrentUser(req.user);
  }

  @Post('link')
  @ApiOperation({ summary: 'Thêm tài khoản bên thứ 3 vào tài khoản hiện có' })
  @ApiBody({ type: LinkProviderDto })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('account-auth'))
  linkProvider(@Body() dto: LinkProviderDto, @Req() req: any) {
    return this.authService.linkProvider(req.user.id, dto);
  }
}
