/**
 * Monitoring interfaces
 */
export interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  model?: string;
  operation?: string;
}

export interface PerformanceMetrics {
  totalQueries: number;
  slowQueries: number;
  averageQueryTime: number;
  slowestQuery: QueryMetrics | null;
  queriesByModel: Record<string, number>;
}

export interface BenchmarkResult {
  name: string;
  duration: number;
  queries: number;
  cached: boolean;
}
