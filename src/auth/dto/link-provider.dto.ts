import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, ValidateIf } from 'class-validator';

/**
 * LinkProviderDto - DTO để link provider vào account hiện tại
 */
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
