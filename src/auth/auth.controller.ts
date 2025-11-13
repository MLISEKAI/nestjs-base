import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto, LoginDto, LoginOtpDto, LoginOAuthDto, LinkProviderDto } from './dto/auth.dto';
import { ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký user mới' })
  @ApiBody({ type: RegisterUserDto })
  register(@Body() dto: RegisterUserDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login' })
  @ApiBody({ type: LoginDto })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('login/otp')
  @ApiOperation({ summary: 'Login via phone OTP (mock)' })
  @ApiBody({ type: LoginOtpDto })
  loginOtp(@Body() dto: LoginOtpDto) {
    return this.authService.loginOtp(dto);
  }

  @Post('login/oauth')
  @ApiOperation({ summary: 'Login via OAuth provider (mock)' })
  @ApiBody({ type: LoginOAuthDto })
  loginOAuth(@Body() dto: LoginOAuthDto) {
    return this.authService.loginOAuth(dto);
  }

  @Post('link')
  @ApiOperation({ summary: 'Link provider to current account' })
  @ApiBody({ type: LinkProviderDto })
  @UseGuards(AuthGuard('account-auth'))
  link(@Body() body: LinkProviderDto, @Req() req: any) {
    const userId = req.user.id;
    return this.authService.linkProvider(userId, body.provider, body.ref_id, body.hash);
  }
}
