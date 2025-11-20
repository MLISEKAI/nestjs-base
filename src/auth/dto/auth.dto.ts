import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import { UserBasicRole, ProviderEnum } from '@prisma/client';

export class RegisterUserDto {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Email is not valid' })
  email?: string;

  @ApiProperty({ description: 'User phone number', example: '+84912345678' })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiProperty({
    description:
      'Password (8-20 characters, at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character)',
    example: 'P@ssw0rd1',
    minLength: 8,
    maxLength: 20,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/, {
    message:
      'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character',
  })
  password: string;

  @ApiProperty({ description: 'Nickname of user', example: 'NguyenVanA' })
  @IsString()
  @IsNotEmpty()
  nickname: string;

  @ApiProperty({
    description: 'User avatar URL',
    example: 'https://avatar.com/a.png',
    required: false,
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ description: 'User bio', example: 'I love coding', required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ description: 'User gender', example: 'male', required: false })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ description: 'User birthday', example: '2000-01-01', required: false })
  @IsOptional()
  @IsDateString()
  birthday?: Date;

  @ApiProperty({ description: 'Role', example: 'user', enum: UserBasicRole, required: false })
  @IsOptional()
  @IsEnum(UserBasicRole)
  role?: UserBasicRole = 'user';
}

export class LoginDto {
  @ApiProperty({ description: 'Email or phone to login', example: 'user@example.com' })
  @IsNotEmpty()
  @IsString()
  ref_id: string;

  @ApiProperty({ description: 'Password', example: 'P@ssw0rd1' })
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class LoginOtpDto {
  @ApiProperty({ description: 'Phone number for OTP login', example: '+84912345678' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: 'OTP code (mock: 123456)', example: '123456' })
  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class LoginOAuthDto {
  @ApiProperty({
    description: 'Provider (google, facebook, hoặc anonymous)',
    example: 'google',
    enum: ['google', 'facebook', 'anonymous'],
  })
  @IsString()
  @IsNotEmpty()
  provider: 'google' | 'facebook' | 'anonymous';

  @ApiProperty({
    description:
      'Access token từ OAuth provider. BẮT BUỘC cho Google/Facebook (client-side flow). Server sẽ verify token và tự động lấy provider_id, email, nickname từ API. Không cần cho anonymous.',
    example: 'ya29.a0AfH6SMBx...',
  })
  @ValidateIf((dto: LoginOAuthDto) => dto.provider !== 'anonymous')
  @IsString()
  @IsNotEmpty()
  access_token?: string;

  @ApiPropertyOptional({
    description:
      '⚠️ CHỈ CẦN CHO ANONYMOUS - Provider unique id. Với Google/Facebook, provider_id sẽ được tự động lấy từ access_token sau khi verify. KHÔNG gửi trường này khi đăng nhập qua Google/Facebook.',
    example: 'anonymous-uid-123',
  })
  @ValidateIf((dto: LoginOAuthDto) => dto.provider === 'anonymous')
  @IsOptional()
  @IsString()
  provider_id?: string;

  @ApiPropertyOptional({
    description:
      '⚠️ CHỈ CẦN CHO ANONYMOUS - Email. Với Google/Facebook, email sẽ được tự động lấy từ access_token sau khi verify. KHÔNG gửi trường này khi đăng nhập qua Google/Facebook.',
    example: 'user@example.com',
  })
  @ValidateIf((dto: LoginOAuthDto) => dto.provider === 'anonymous')
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description:
      '⚠️ CHỈ CẦN CHO ANONYMOUS - Nickname. Với Google/Facebook, nickname sẽ được tự động lấy từ access_token sau khi verify. KHÔNG gửi trường này khi đăng nhập qua Google/Facebook.',
    example: 'NguyenVanA',
  })
  @ValidateIf((dto: LoginOAuthDto) => dto.provider === 'anonymous')
  @IsOptional()
  @IsString()
  nickname?: string;
}

export class LinkProviderDto {
  @ApiProperty({
    description: 'Provider',
    example: 'google',
    enum: ['google', 'facebook', 'phone', 'password'],
  })
  @IsString()
  @IsNotEmpty()
  provider: 'google' | 'facebook' | 'phone' | 'password';

  @ApiProperty({ description: 'Reference id for provider', example: 'user@example.com or +849...' })
  @IsString()
  @IsNotEmpty()
  ref_id: string;

  @ApiPropertyOptional({
    description: 'Bcrypt hash (bắt buộc khi provider = password, bỏ trống các provider khác)',
    example: '$2b$10$...',
  })
  @ValidateIf((dto: LinkProviderDto) => dto.provider === 'password')
  @IsString()
  @IsNotEmpty()
  hash?: string;
}

export class RequestEmailCodeDto {
  @ApiProperty({ description: 'Email to verify', example: 'user@example.com' })
  @IsEmail()
  email: string;
}

export class VerifyEmailCodeDto extends RequestEmailCodeDto {
  @ApiProperty({ description: 'Verification code', example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class RequestPhoneCodeDto {
  @ApiProperty({ description: 'Phone number in E.164 format', example: '+84912345678' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class VerifyPhoneCodeDto extends RequestPhoneCodeDto {
  @ApiProperty({ description: 'Verification code', example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class TwoFactorCodeDto {
  @ApiProperty({ description: 'Two-factor authentication code', example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class VerifyTwoFactorLoginDto {
  @ApiProperty({
    description: 'Temporary 2FA token returned from login',
    example: 'temp-token-value',
  })
  @IsString()
  @IsNotEmpty()
  temp_token: string;

  @ApiProperty({ description: 'Two-factor authentication code', example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token', example: 'refresh-token-value' })
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}

export class LogoutDto {
  @ApiPropertyOptional({
    description:
      'Refresh token (optional). Nếu có, sẽ revoke refresh token này. Nếu không, chỉ blacklist access token hiện tại.',
    example: 'refresh-token-value',
  })
  @IsOptional()
  @IsString()
  refresh_token?: string;
}

export class RequestPasswordResetDto {
  @ApiProperty({ description: 'Email để reset password', example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Email', example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Verification code từ email', example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description:
      'Password mới (8-20 characters, at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character)',
    example: 'NewP@ssw0rd1',
    minLength: 8,
    maxLength: 20,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/, {
    message:
      'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character',
  })
  newPassword: string;
}
