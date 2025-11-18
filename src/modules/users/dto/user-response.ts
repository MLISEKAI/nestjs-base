import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

export class UserResponseDto {
  @ApiProperty({ example: 'user-123', description: 'ID của user' })
  id: string;

  @ApiProperty({ example: 'NguyenVanA', description: 'Nickname của user' })
  nickname: string;

  @ApiPropertyOptional({ example: 'I love coding', description: 'Bio của user' })
  bio?: string;

  @ApiPropertyOptional({ example: 'https://avatar.com/a.png', description: 'URL avatar' })
  avatar?: string;

  @ApiPropertyOptional({ example: 'male', description: 'Giới tính' })
  gender?: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z', description: 'Ngày tạo' })
  created_at: Date;
}

export class ConnectionsResponseDto {
  @ApiProperty({ type: [UserResponseDto], description: 'Danh sách users' })
  users: UserResponseDto[];

  @ApiPropertyOptional({ example: 1, description: 'Trang hiện tại' })
  page?: number;

  @ApiPropertyOptional({ example: 20, description: 'Số lượng mỗi trang' })
  limit?: number;

  @ApiPropertyOptional({ example: 100, description: 'Tổng số lượng' })
  total?: number;
}

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'NguyenVanA',
    description: 'Tên hiển thị / nickname của người dùng',
  })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({ example: 'https://avatar.com/a.png', description: 'URL ảnh đại diện' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ example: 'I love coding', description: 'Bio / mô tả bản thân' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 'male', description: 'Giới tính của người dùng' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ example: '2000-01-01', description: 'Ngày sinh (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  birthday?: string;
}

// Re-export from common for consistency
export { FileUploadDto as UploadAvatarDto } from '../../../common/dto/file-upload.dto';

/**
 * Search users query DTO
 * Extends BaseQueryDto which already includes page, limit, search, and sort
 */
export class SearchUsersQueryDto extends BaseQueryDto {
  // All properties (page, limit, search, sort) are inherited from BaseQueryDto
}
