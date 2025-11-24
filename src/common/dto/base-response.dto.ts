// Import decorators từ Swagger để tạo API documentation
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * BaseResponseDto<T> - Standard API Response wrapper
 * DTO này được dùng để wrap tất cả API responses với format chuẩn
 *
 * @template T - Type của data trong response
 *
 * Format chuẩn:
 * {
 *   error: false,
 *   code: 0,
 *   message: "Success",
 *   data: T,
 *   traceId: "trace-123456"
 * }
 */
export class BaseResponseDto<T> {
  @ApiProperty({ example: false, description: 'Error flag' })
  error: boolean;

  @ApiProperty({
    example: 1,
    description: 'Response code (1 = success, others = error)',
  })
  code: number;

  @ApiProperty({ example: 'Success', description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Response data' })
  data: T | null;

  @ApiProperty({
    example: 'trace-123456',
    description: 'Trace ID for debugging',
  })
  traceId: string;
}

/**
 * PaginationMetaDto - DTO cho pagination metadata
 * Chứa thông tin về pagination: item_count, total_items, items_per_page, total_pages, current_page
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
 * PaginatedResponseDto<T> - DTO cho paginated response
 * Chứa items array và pagination metadata
 *
 * @template T - Type của items trong mảng
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Array of items', isArray: true })
  items: T[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  meta: PaginationMetaDto;
}
