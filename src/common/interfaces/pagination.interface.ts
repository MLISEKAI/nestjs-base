/**
 * Pagination metadata interface
 */
export interface IPaginationMeta {
  item_count: number;
  total_items: number;
  items_per_page: number;
  total_pages: number;
  current_page: number;
}

/**
 * Paginated response interface
 */
export interface IPaginatedResponse<T> {
  items: T[];
  meta: IPaginationMeta;
}

/**
 * Pagination query parameters interface
 */
export interface IPaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}

