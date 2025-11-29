import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * RequestEmailCodeDto - DTO để request email verification code
 */
export class RequestEmailCodeDto {
  @ApiProperty({ description: 'Email to verify', example: 'user@example.com' })
  @IsEmail()
  email: string;
}

/**
 * VerifyEmailCodeDto - DTO để verify email code
 */
export class VerifyEmailCodeDto extends RequestEmailCodeDto {
  @ApiProperty({ description: 'Verification code', example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

/**
 * RequestPhoneCodeDto - DTO để request phone verification code
 */
export class RequestPhoneCodeDto {
  @ApiProperty({ description: 'Phone number in E.164 format', example: '+84912345678' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}

/**
 * VerifyPhoneCodeDto - DTO để verify phone code
 */
export class VerifyPhoneCodeDto extends RequestPhoneCodeDto {
  @ApiProperty({ description: 'Verification code', example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;
}
