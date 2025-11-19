import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

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

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);
  private queryMetrics: QueryMetrics[] = [];
  private readonly slowQueryThreshold = 100; // ms

  /**
   * Log query performance
   */
  logQuery(query: string, duration: number, model?: string, operation?: string) {
    const metric: QueryMetrics = {
      query,
      duration,
      timestamp: new Date(),
      model,
      operation,
    };

    this.queryMetrics.push(metric);

    // Log slow queries
    if (duration > this.slowQueryThreshold) {
      this.logger.warn(
        `Slow query detected: ${duration}ms - ${model || 'unknown'}.${operation || 'unknown'}`,
        {
          query: query.substring(0, 200), // Truncate long queries
          duration,
          model,
          operation,
        },
      );
    }

    // Keep only last 1000 queries in memory
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics = this.queryMetrics.slice(-1000);
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    if (this.queryMetrics.length === 0) {
      return {
        totalQueries: 0,
        slowQueries: 0,
        averageQueryTime: 0,
        slowestQuery: null,
        queriesByModel: {},
      };
    }

    const slowQueries = this.queryMetrics.filter((q) => q.duration > this.slowQueryThreshold);
    const totalDuration = this.queryMetrics.reduce((sum, q) => sum + q.duration, 0);
    const averageQueryTime = totalDuration / this.queryMetrics.length;

    const slowestQuery = this.queryMetrics.reduce((prev, current) =>
      prev.duration > current.duration ? prev : current,
    );

    const queriesByModel: Record<string, number> = {};
    this.queryMetrics.forEach((q) => {
      if (q.model) {
        queriesByModel[q.model] = (queriesByModel[q.model] || 0) + 1;
      }
    });

    return {
      totalQueries: this.queryMetrics.length,
      slowQueries: slowQueries.length,
      averageQueryTime: Math.round(averageQueryTime * 100) / 100,
      slowestQuery,
      queriesByModel,
    };
  }

  /**
   * Get slow queries
   */
  getSlowQueries(limit = 10): QueryMetrics[] {
    return this.queryMetrics
      .filter((q) => q.duration > this.slowQueryThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.queryMetrics = [];
    this.logger.log('Performance metrics reset');
  }

  /**
   * Get query statistics by model
   */
  getModelStatistics() {
    const stats: Record<
      string,
      { count: number; avgDuration: number; maxDuration: number; minDuration: number }
    > = {};

    this.queryMetrics.forEach((q) => {
      if (q.model) {
        if (!stats[q.model]) {
          stats[q.model] = {
            count: 0,
            avgDuration: 0,
            maxDuration: 0,
            minDuration: Infinity,
          };
        }

        stats[q.model].count++;
        stats[q.model].maxDuration = Math.max(stats[q.model].maxDuration, q.duration);
        stats[q.model].minDuration = Math.min(stats[q.model].minDuration, q.duration);
      }
    });

    // Calculate averages
    Object.keys(stats).forEach((model) => {
      const modelQueries = this.queryMetrics.filter((q) => q.model === model);
      const totalDuration = modelQueries.reduce((sum, q) => sum + q.duration, 0);
      stats[model].avgDuration = Math.round((totalDuration / modelQueries.length) * 100) / 100;
    });

    return stats;
  }
}
