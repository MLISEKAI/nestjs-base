import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Min } from 'class-validator';

export class UserResponseDto {
  id: string;
  nickname : string;
  bio?: string;
  avatar?: string;
  gender?: string;
  created_at: Date;
}

export class ConnectionsResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  users: UserResponseDto[];
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'NguyenVanA', description: 'Tên hiển thị / nickname của người dùng' })
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

export class UploadAvatarDto {
  @ApiProperty({ example: 'https://example.com/avatar.jpg' })
  @IsNotEmpty()
  @IsString()
  fileUrl: string;
}

export class SearchUsersQueryDto {
  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Trang hiện tại', default: 1 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Số lượng mỗi trang', default: 20 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  limit?: number;

 @ApiPropertyOptional({ 
    description: 'Sắp xếp, ví dụ: created_at:asc hoặc nickname:desc', 
    example: 'created_at:asc' 
  })
  @IsOptional()
  @IsString()
  @Matches(/^\w+:(asc|desc)$/i)
  sort?: string;
}
