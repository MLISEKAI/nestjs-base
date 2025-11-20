import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export enum SearchType {
  ALL = 'all',
  USERS = 'users',
  POSTS = 'posts',
  COMMENTS = 'comments',
}

export enum TrendingPeriod {
  DAY = '24h',
  WEEK = '7d',
  MONTH = '30d',
}

export class SearchQueryDto {
  @ApiProperty({
    example: 'john',
    description: 'Từ khóa tìm kiếm',
  })
  @IsString()
  q: string;

  @ApiPropertyOptional({
    enum: SearchType,
    default: SearchType.ALL,
    description: 'Loại nội dung muốn tìm (all, users, posts, comments)',
  })
  @IsOptional()
  @IsEnum(SearchType)
  type?: SearchType = SearchType.ALL;

  @ApiPropertyOptional({
    example: 1,
    description: 'Số trang (mặc định: 1)',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20,
    description: 'Số lượng kết quả mỗi trang (mặc định: 20)',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({
    example: '2025-11-01',
    description: 'Lọc theo ngày bắt đầu (ISO date)',
  })
  @IsOptional()
  @IsDateString()
  from_date?: string;

  @ApiPropertyOptional({
    example: '2025-11-20',
    description: 'Lọc theo ngày kết thúc (ISO date)',
  })
  @IsOptional()
  @IsDateString()
  to_date?: string;
}

export class RecommendationQueryDto {
  @ApiPropertyOptional({
    example: 10,
    description: 'Số lượng recommendations (mặc định: 10)',
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}

export class TrendingQueryDto {
  @ApiPropertyOptional({
    enum: TrendingPeriod,
    default: TrendingPeriod.DAY,
    description: 'Khoảng thời gian trending (24h, 7d, 30d)',
  })
  @IsOptional()
  @IsEnum(TrendingPeriod)
  period?: TrendingPeriod = TrendingPeriod.DAY;

  @ApiPropertyOptional({
    example: 20,
    description: 'Số lượng kết quả (mặc định: 20)',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}
