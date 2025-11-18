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

  @ApiProperty({ description: 'User avatar URL', example: 'https://avatar.com/a.png', required: false })
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

  @ApiPropertyOptional({ description: 'Two-factor authentication code', example: '123456' })
  @IsOptional()
  @IsString()
  twoFactorCode?: string;
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
  @ApiProperty({ description: 'Provider', example: 'google', enum: ['google', 'facebook', 'anonymous'] })
  @IsString()
  @IsNotEmpty()
  provider: 'google' | 'facebook' | 'anonymous';

  @ApiProperty({ description: 'Provider unique id', example: 'google-uid-123' })
  @IsString()
  @IsNotEmpty()
  provider_id: string;

  @ApiPropertyOptional({ description: 'Email from provider', example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Preferred nickname', example: 'NguyenVanA' })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({ description: 'Two-factor authentication code', example: '' })
  @IsOptional()
  @IsString()
  twoFactorCode?: string;
}

export class LinkProviderDto {
  @ApiProperty({ description: 'Provider', example: 'google', enum: ['google', 'facebook', 'phone', 'password'] })
  @IsString()
  @IsNotEmpty()
  provider: 'google' | 'facebook' | 'phone' | 'password';

  @ApiProperty({ description: 'Reference id for provider', example: 'user@example.com or +849...' })
  @IsString()
  @IsNotEmpty()
  ref_id: string;

  @ApiPropertyOptional({ description: 'Password (server sẽ tự hash)', example: 'P@ssw0rd1' })
  @ValidateIf((dto: LinkProviderDto) => dto.provider === 'password' && !dto.hash)
  @IsString()
  @IsNotEmpty()
  password?: string;

  @ApiPropertyOptional({
    description: 'Bcrypt hash (tùy chọn khi provider = password, dùng thay cho password)',
    example: '$2b$10$...',
  })
  @ValidateIf((dto: LinkProviderDto) => dto.provider === 'password' && !dto.password)
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
  @ApiProperty({ description: 'Temporary 2FA token returned from login', example: 'temp-token-value' })
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
