import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

/**
 * RequestPasswordResetDto - DTO để request password reset code
 */
export class RequestPasswordResetDto {
  @ApiProperty({ description: 'Email để reset password', example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

/**
 * ResetPasswordDto - DTO để reset password
 */
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
