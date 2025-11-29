import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  IsDateString,
} from 'class-validator';

/**
 * RegisterWithEmailDto - DTO để đăng ký user mới qua EMAIL
 */
export class RegisterWithEmailDto {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsEmail({}, { message: 'Email is not valid' })
  @IsNotEmpty()
  email: string;

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

  @ApiPropertyOptional({
    description: 'User avatar URL',
    example: 'https://avatar.com/a.png',
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ description: 'User bio', example: 'I love coding' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: 'User gender', example: 'male' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ description: 'User birthday', example: '2000-01-01' })
  @IsOptional()
  @IsDateString()
  birthday?: Date;
}

/**
 * RequestPhoneOtpDto - DTO để request OTP (chỉ có phone)
 */
export class RequestPhoneOtpDto {
  @ApiProperty({ description: 'Phone number', example: '+84912345678' })
  @IsString()
  @IsNotEmpty()
  phone_number: string;
}

/**
 * VerifyPhoneOtpDto - DTO để verify OTP và đăng ký/đăng nhập
 */
export class VerifyPhoneOtpDto {
  @ApiProperty({ description: 'Phone number', example: '+84912345678' })
  @IsString()
  @IsNotEmpty()
  phone_number: string;

  @ApiProperty({ description: 'OTP code', example: '123456' })
  @IsString()
  @IsNotEmpty()
  otp: string;
}
