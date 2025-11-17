import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Standard API Response wrapper
 */
export class BaseResponseDto<T> {
  @ApiProperty({ example: false, description: 'Error flag' })
  error: boolean;

  @ApiProperty({ example: 1, description: 'Response code (1 = success, others = error)' })
  code: number;

  @ApiProperty({ example: 'Success', description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Response data' })
  data: T | null;

  @ApiProperty({ example: 'trace-123456', description: 'Trace ID for debugging' })
  traceId: string;
}

/**
 * Pagination metadata
 */
export class PaginationMetaDto {
  @ApiProperty({ example: 10, description: 'Number of items in current page' })
  item_count: number;

  @ApiProperty({ example: 100, description: 'Total number of items' })
  total_items: number;

  @ApiProperty({ example: 20, description: 'Items per page' })
  items_per_page: number;

  @ApiProperty({ example: 5, description: 'Total number of pages' })
  total_pages: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  current_page: number;
}

/**
 * Paginated response wrapper
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Array of items', isArray: true })
  items: T[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  meta: PaginationMetaDto;
}

