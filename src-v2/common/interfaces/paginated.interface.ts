export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}

