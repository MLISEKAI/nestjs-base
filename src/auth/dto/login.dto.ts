import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

/**
 * LoginDto - DTO để đăng nhập
 */
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

/**
 * LoginOAuthDto - DTO để đăng nhập bằng OAuth (Google, Facebook, hoặc Anonymous)
 */
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
