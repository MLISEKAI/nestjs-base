/**
 * QueryMetrics - Interface cho query performance metrics
 *
 * Lưu ý:
 * - query: Query string (có thể bị truncate nếu quá dài)
 * - duration: Query execution time (milliseconds)
 * - timestamp: Thời điểm query được thực thi
 * - model: Prisma model name (optional)
 * - operation: Prisma operation (findMany, create, update, etc.)
 */
export interface QueryMetrics {
  /** Query string (có thể bị truncate nếu quá dài) */
  readonly query: string;
  /** Query execution time (milliseconds) */
  readonly duration: number;
  /** Thời điểm query được thực thi */
  readonly timestamp: Date;
  /** Prisma model name (optional) */
  readonly model?: string;
  /** Prisma operation (findMany, create, update, delete, etc.) */
  readonly operation?: string;
}

/**
 * PerformanceMetrics - Interface cho tổng hợp performance metrics
 *
 * Lưu ý:
 * - totalQueries: Tổng số queries đã thực thi
 * - slowQueries: Số queries chậm (vượt threshold)
 * - averageQueryTime: Thời gian trung bình của queries (milliseconds)
 * - slowestQuery: Query chậm nhất (null nếu chưa có)
 * - queriesByModel: Số queries theo từng model
 */
export interface PerformanceMetrics {
  /** Tổng số queries đã thực thi */
  readonly totalQueries: number;
  /** Số queries chậm (vượt threshold) */
  readonly slowQueries: number;
  /** Thời gian trung bình của queries (milliseconds) */
  readonly averageQueryTime: number;
  /** Query chậm nhất (null nếu chưa có) */
  readonly slowestQuery: QueryMetrics | null;
  /** Số queries theo từng model */
  readonly queriesByModel: Readonly<Record<string, number>>;
}

/**
 * BenchmarkResult - Interface cho benchmark result
 *
 * Lưu ý:
 * - name: Tên benchmark test
 * - duration: Execution time (milliseconds)
 * - queries: Số Prisma queries đã thực thi
 * - cached: Có sử dụng cache không
 */
export interface BenchmarkResult {
  /** Tên benchmark test */
  readonly name: string;
  /** Execution time (milliseconds) */
  readonly duration: number;
  /** Số Prisma queries đã thực thi */
  readonly queries: number;
  /** Có sử dụng cache không */
  readonly cached: boolean;
}
