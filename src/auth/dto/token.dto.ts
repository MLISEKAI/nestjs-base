import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * RefreshTokenDto - DTO để refresh access token
 */
export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token', example: 'refresh-token-value' })
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}

/**
 * LogoutDto - DTO để logout
 */
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
