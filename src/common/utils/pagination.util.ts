// Import interfaces để type-check
import { IPaginationMeta, IPaginatedResponse } from '../interfaces/pagination.interface';

/**
 * Xây dựng pagination metadata từ kết quả query
 * @param itemCount - Số lượng items trong trang hiện tại (thường là items.length)
 * @param totalItems - Tổng số items trong database (từ count query)
 * @param itemsPerPage - Số lượng items mỗi trang (limit)
 * @param currentPage - Trang hiện tại (page)
 * @returns IPaginationMeta - Object chứa thông tin pagination
 *
 * Ví dụ:
 * - itemCount: 20 (có 20 items trong trang hiện tại)
 * - totalItems: 100 (tổng có 100 items)
 * - itemsPerPage: 20 (mỗi trang 20 items)
 * - currentPage: 2 (đang ở trang 2)
 * => total_pages = Math.ceil(100 / 20) = 5
 */
export function buildPaginationMeta(
  itemCount: number,
  totalItems: number,
  itemsPerPage: number,
  currentPage: number,
): IPaginationMeta {
  return {
    item_count: itemCount, // Số lượng items trong trang hiện tại
    total_items: totalItems, // Tổng số items trong database
    items_per_page: itemsPerPage, // Số lượng items mỗi trang
    total_pages: Math.ceil(totalItems / itemsPerPage) || 1, // Tổng số trang (làm tròn lên, tối thiểu 1)
    current_page: currentPage, // Trang hiện tại
  };
}

/**
 * Xây dựng paginated response với format chuẩn
 * @param items - Mảng các items trong trang hiện tại
 * @param totalItems - Tổng số items trong database
 * @param page - Trang hiện tại
 * @param limit - Số lượng items mỗi trang
 * @returns IPaginatedResponse<T> - Object chứa items và metadata
 *
 * @template T - Type của items trong mảng
 *
 * Ví dụ response:
 * {
 *   items: [...], // Mảng các items
 *   meta: {
 *     item_count: 20,
 *     total_items: 100,
 *     items_per_page: 20,
 *     total_pages: 5,
 *     current_page: 2
 *   }
 * }
 */
export function buildPaginatedResponse<T>(
  items: T[],
  totalItems: number,
  page: number,
  limit: number,
): IPaginatedResponse<T> {
  return {
    items, // Mảng các items trong trang hiện tại
    meta: buildPaginationMeta(items.length, totalItems, limit, page), // Metadata pagination
  };
}
