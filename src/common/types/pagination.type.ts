import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PageOptionsDto {
  @ApiPropertyOptional({ required: false, default: '' })
  @IsString()
  @IsOptional()
  searchText: string = '';

  @ApiPropertyOptional({
    minimum: 1,
    default: 1,
  })
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 50,
    default: 10,
  })
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit: number = 10;
}

export interface PaginationResponse<T = any> {
  items: Array<T>;
  meta: {
    item_count: number;
    total_items: number;
    items_per_page: number;
    total_pages: number;
    current_page: number;
  };
}

export function calculatePagination(total: number, limit = 10, page = 1) {
  const totalItems = +total;
  const itemsPerPage = +limit;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return {
    item_count: +itemsPerPage,
    total_items: +totalItems,
    items_per_page: +itemsPerPage,
    total_pages: +totalPages,
    current_page: +page,
  };
}

export function mappingPagination<T = any>(
  items: Array<T>,
  options: { total: number; limit: number; page: number },
): PaginationResponse<T> {
  return {
    items,
    meta: calculatePagination(options.total, options.limit, options.page),
  };
}
