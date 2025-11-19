import { IPaginationMeta, IPaginatedResponse } from '../interfaces/pagination.interface';

/**
 * Build pagination metadata from query results
 */
export function buildPaginationMeta(
  itemCount: number,
  totalItems: number,
  itemsPerPage: number,
  currentPage: number,
): IPaginationMeta {
  return {
    item_count: itemCount,
    total_items: totalItems,
    items_per_page: itemsPerPage,
    total_pages: Math.ceil(totalItems / itemsPerPage) || 1,
    current_page: currentPage,
  };
}

/**
 * Build paginated response
 */
export function buildPaginatedResponse<T>(
  items: T[],
  totalItems: number,
  page: number,
  limit: number,
): IPaginatedResponse<T> {
  return {
    items,
    meta: buildPaginationMeta(items.length, totalItems, limit, page),
  };
}
