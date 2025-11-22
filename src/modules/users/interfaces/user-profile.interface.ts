/**
 * Interface for search users parameters
 */
export interface SearchUsersParams {
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  excludeUserId?: string | null;
}
