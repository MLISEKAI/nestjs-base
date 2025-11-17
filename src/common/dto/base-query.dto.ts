import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

/**
 * Base Query DTO for pagination, search, and sorting
 */
export class BaseQueryDto {
  @ApiPropertyOptional({ 
    example: 1, 
    description: 'Page number (starts from 1)',
    default: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ 
    example: 20, 
    description: 'Number of items per page',
    default: 20 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit: number = 20;

  @ApiPropertyOptional({ 
    example: '', 
    description: 'Search keyword' 
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    example: 'created_at:desc', 
    description: 'Sort field and order (field:asc or field:desc)' 
  })
  @IsOptional()
  @IsString()
  sort?: string;
}

