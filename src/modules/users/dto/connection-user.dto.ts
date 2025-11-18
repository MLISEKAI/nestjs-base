import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * User connection DTO (for followers, following, friends)
 */
export class UserConnectionDto {
  @ApiProperty({ example: 'user-id-123', description: 'User ID' })
  id: string;

  @ApiProperty({ example: 'Nguyen Van A', description: 'User nickname' })
  nickname: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', description: 'Avatar URL' })
  avatar?: string;

  @ApiProperty({ example: true, description: 'Is following this user' })
  is_following: boolean;

  @ApiProperty({ example: false, description: 'Is friend with this user' })
  is_friend: boolean;
}
