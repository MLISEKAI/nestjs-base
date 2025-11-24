/**
 * IPaginationMeta - Interface cho pagination metadata
 *
 * Lưu ý:
 * - item_count: Số items trong trang hiện tại
 * - total_items: Tổng số items
 * - items_per_page: Số items mỗi trang
 * - total_pages: Tổng số trang
 * - current_page: Trang hiện tại (1-based)
 */
export interface IPaginationMeta {
  /** Số items trong trang hiện tại */
  readonly item_count: number;
  /** Tổng số items */
  readonly total_items: number;
  /** Số items mỗi trang */
  readonly items_per_page: number;
  /** Tổng số trang */
  readonly total_pages: number;
  /** Trang hiện tại (1-based) */
  readonly current_page: number;
}

/**
 * IPaginatedResponse<T> - Interface cho paginated response
 *
 * @template T - Type của items trong mảng
 *
 * Lưu ý:
 * - items: Mảng items trong trang hiện tại
 * - meta: Pagination metadata
 */
export interface IPaginatedResponse<T> {
  /** Mảng items trong trang hiện tại */
  readonly items: T[];
  /** Pagination metadata */
  readonly meta: IPaginationMeta;
}

/**
 * IPaginationQuery - Interface cho pagination query parameters
 *
 * Lưu ý:
 * - page: Trang cần lấy (1-based, optional)
 * - limit: Số items mỗi trang (optional)
 * - search: Search keyword (optional)
 * - sort: Sort field và direction (optional, format: "field:asc" hoặc "field:desc")
 */
export interface IPaginationQuery {
  /** Trang cần lấy (1-based, optional) */
  page?: number;
  /** Số items mỗi trang (optional) */
  limit?: number;
  /** Search keyword (optional) */
  search?: string;
  /** Sort field và direction (optional, format: "field:asc" hoặc "field:desc") */
  sort?: string;
}

/**
 * CursorPaginationParams - Interface cho cursor-based pagination parameters
 *
 * Lưu ý:
 * - cursor: Cursor để lấy trang tiếp theo (optional)
 * - limit: Số items mỗi trang (optional)
 * - orderBy: Sort direction (optional, 'asc' hoặc 'desc')
 */
export interface CursorPaginationParams {
  /** Cursor để lấy trang tiếp theo (optional) */
  cursor?: string;
  /** Số items mỗi trang (optional) */
  limit?: number;
  /** Sort direction (optional, 'asc' hoặc 'desc') */
  orderBy?: 'asc' | 'desc';
}

/**
 * CursorPaginationResult<T> - Interface cho cursor-based pagination result
 *
 * @template T - Type của items trong mảng
 *
 * Lưu ý:
 * - items: Mảng items trong trang hiện tại
 * - nextCursor: Cursor cho trang tiếp theo (null nếu không còn)
 * - hasMore: Có còn trang tiếp theo không
 */
export interface CursorPaginationResult<T> {
  /** Mảng items trong trang hiện tại */
  readonly items: T[];
  /** Cursor cho trang tiếp theo (null nếu không còn) */
  readonly nextCursor: string | null;
  /** Có còn trang tiếp theo không */
  readonly hasMore: boolean;
}
