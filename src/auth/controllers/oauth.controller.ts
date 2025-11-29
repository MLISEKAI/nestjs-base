import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { AuthGuard as NestAuthGuard } from '@nestjs/passport';
import { AuthService } from '../auth.service';

/**
 * OAuthController - Xử lý OAuth callbacks (Google, Facebook)
 * 
 * ⚠️ QUAN TRỌNG: KHÔNG THỂ TEST BẰNG SWAGGER
 * 
 * OAuth flow yêu cầu browser redirects, Swagger không thể handle được.
 * 
 * 📖 CÁCH TEST ĐÚNG:
 * 
 * 1️⃣ Test bằng Browser (Recommended):
 *    - Mở browser: http://localhost:3001/api/auth/oauth/google
 *    - Đăng nhập Google và click "Allow"
 *    - Nhận JWT tokens trong response
 * 
 * 2️⃣ Test bằng HTML page:
 *    - Tạo file test-oauth.html:
 *      <a href="http://localhost:3001/api/auth/oauth/google">
 *        <button>Login with Google</button>
 *      </a>
 *    - Mở file trong browser và click button
 * 
 * 3️⃣ Test bằng Frontend app:
 *    - React/Vue/Angular: window.location.href = 'http://localhost:3001/api/auth/oauth/google'
 *    - Sau khi OAuth thành công, lưu tokens vào localStorage
 * 
 * 🔧 CONFIG REQUIRED:
 * 
 * .env file:
 *   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
 *   GOOGLE_CLIENT_SECRET=your-client-secret
 *   GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/oauth/google/callback
 * 
 * Google Cloud Console:
 *   Authorized redirect URIs:
 *   - http://localhost:3001/api/auth/oauth/google/callback
 *   - http://localhost:3001/auth/oauth/google/callback (nếu không dùng global prefix)
 * 
 * 📝 FLOW HOÀN CHỈNH:
 * 
 * 1. User click "Login with Google"
 * 2. GET /auth/oauth/google → Redirect đến Google
 * 3. User authorize trên Google
 * 4. Google redirect về /auth/oauth/google/callback?code=...
 * 5. Server exchange code → access_token
 * 6. Server lấy user profile từ Google
 * 7. Server tạo/login user
 * 8. Server trả về JWT tokens
 * 
 * ✅ RESPONSE SUCCESS:
 * {
 *   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "refresh_token": "a1b2c3d4e5f6...",
 *   "expires_at": "2025-11-29T11:00:00Z"
 * }
 * 
 * ❌ COMMON ERRORS:
 * 
 * 1. "redirect_uri_mismatch"
 *    → Callback URL trong .env không match với Google Console
 * 
 * 2. "Google OAuth is not configured"
 *    → Thiếu GOOGLE_CLIENT_ID hoặc GOOGLE_CLIENT_SECRET trong .env
 * 
 * 3. "Invalid Google access token"
 *    → Access token đã expire hoặc không hợp lệ
 */
@ApiTags('Auth - OAuth')
@Controller('auth/oauth')
export class OAuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @ApiOperation({ 
    summary: '🔐 Login with Google (Server-Side OAuth Flow)',
    description: `
⚠️ KHÔNG THỂ TEST BẰNG SWAGGER - Cần dùng browser

📖 CÁCH TEST:
1. Mở browser: http://localhost:3001/api/auth/oauth/google
2. Đăng nhập Google và click "Allow"
3. Nhận JWT tokens trong response

🔧 CONFIG REQUIRED:
- GOOGLE_CLIENT_ID trong .env
- GOOGLE_CLIENT_SECRET trong .env
- GOOGLE_CALLBACK_URL trong .env
- Authorized redirect URIs trong Google Cloud Console

📝 FLOW:
User → Google OAuth → Authorize → Callback → JWT Tokens

✅ RESPONSE:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "a1b2c3d4e5f6...",
  "expires_at": "2025-11-29T11:00:00Z"
}
    `
  })
  @UseGuards(NestAuthGuard('google'))
  googleAuth() {
    // Passport Strategy sẽ tự động xử lý redirect
  }

  @Get('google/callback')
  @ApiExcludeEndpoint()
  @UseGuards(NestAuthGuard('google'))
  async googleAuthCallback(@Req() req: any) {
    const profile = req.user as any;
    return this.authService.loginOAuth(
      {
        provider: 'google',
        provider_id: profile.providerId,
        email: profile.email,
        nickname: profile.nickname,
      },
      req.ip,
      true,
    );
  }

  @Get('facebook')
  @ApiOperation({ 
    summary: '🔐 Login with Facebook (Server-Side OAuth Flow)',
    description: `
⚠️ KHÔNG THỂ TEST BẰNG SWAGGER - Cần dùng browser

📖 CÁCH TEST:
1. Mở browser: http://localhost:3001/api/auth/oauth/facebook
2. Đăng nhập Facebook và click "Continue"
3. Nhận JWT tokens trong response

🔧 CONFIG REQUIRED:
- FACEBOOK_APP_ID trong .env
- FACEBOOK_APP_SECRET trong .env
- FACEBOOK_CALLBACK_URL trong .env
- Valid OAuth Redirect URIs trong Facebook App Settings

📝 FLOW:
User → Facebook OAuth → Authorize → Callback → JWT Tokens

✅ RESPONSE:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "a1b2c3d4e5f6...",
  "expires_at": "2025-11-29T11:00:00Z"
}
    `
  })
  @UseGuards(NestAuthGuard('facebook'))
  facebookAuth() {
    // Passport Strategy sẽ tự động xử lý redirect
  }

  @Get('facebook/callback')
  @ApiExcludeEndpoint()
  @UseGuards(NestAuthGuard('facebook'))
  async facebookAuthCallback(@Req() req: any) {
    const profile = req.user as any;
    return this.authService.loginOAuth(
      {
        provider: 'facebook',
        provider_id: profile.providerId,
        email: profile.email,
        nickname: profile.nickname,
      },
      req.ip,
      true,
    );
  }
}
