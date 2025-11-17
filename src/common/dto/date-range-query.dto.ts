import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

/**
 * Date range query DTO for filtering by date
 */
export class DateRangeQueryDto {
  @ApiPropertyOptional({ 
    example: '2025-01-01', 
    description: 'Start date (YYYY-MM-DD)' 
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ 
    example: '2025-12-31', 
    description: 'End date (YYYY-MM-DD)' 
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

