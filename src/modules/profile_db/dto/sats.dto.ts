import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class UserStatsDto {
  @ApiPropertyOptional({ description: 'User ID', example: 'user-123' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Number of posts', example: 10 })
  @IsOptional()
  @IsNumber()
  posts?: number;

  @ApiPropertyOptional({ description: 'Number of followers', example: 100 })
  @IsOptional()
  @IsNumber()
  followers?: number;

  @ApiPropertyOptional({ description: 'Number of following', example: 50 })
  @IsOptional()
  @IsNumber()
  following?: number;

  @ApiPropertyOptional({ description: 'Total profile views', example: 500 })
  @IsOptional()
  @IsNumber()
  totalViews?: number;
}
