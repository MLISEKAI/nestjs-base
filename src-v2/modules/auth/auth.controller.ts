import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { AuthMockService } from './auth.mock.service';

@ApiTags('Auth (Mock)')
@Controller('api/v2/auth')
export class AuthController {
  constructor(private readonly authService: AuthMockService) {}

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký user mới (Mock)' })
  @ApiBody({
    schema: {
      properties: {
        email: { example: 'user@example.com' },
        phone_number: { example: '+84912345678' },
        password: { example: 'P@ssw0rd1' },
        nickname: { example: 'NguyenVanA' },
        avatar: { example: 'https://avatar.com/a.png' },
        bio: { example: 'I love coding' },
        gender: { example: 'male' },
        birthday: { example: '2000-01-01' },
        role: { example: 'user' },
      },
    },
  })
  @ApiOkResponse({ description: 'User đã được đăng ký' })
  register(@Body() data: any) {
    return this.authService.register(data);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login (Mock)' })
  @ApiBody({
    schema: {
      properties: {
        ref_id: { example: 'user@example.com' },
        password: { example: 'P@ssw0rd1' },
      },
    },
  })
  @ApiOkResponse({ description: 'Login thành công' })
  login(@Body() body: { ref_id: string; password: string }) {
    return this.authService.login(body.ref_id, body.password);
  }
}

