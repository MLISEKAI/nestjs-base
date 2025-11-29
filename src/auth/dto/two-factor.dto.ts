import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * TwoFactorCodeDto - DTO để verify two-factor code
 */
export class TwoFactorCodeDto {
  @ApiProperty({ description: 'Two-factor authentication code', example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

/**
 * VerifyTwoFactorLoginDto - DTO để verify two-factor code khi login
 */
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
