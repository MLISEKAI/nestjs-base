// Import PerformanceService để log query performance
import { PerformanceService } from './performance.service';
// Import PrismaMiddlewareParams interface
import { PrismaMiddlewareParams } from '../interfaces/prisma.interface';

/**
 * createPrismaLoggerMiddleware - Factory function để tạo Prisma middleware log query performance
 *
 * @param performanceService - PerformanceService instance để log queries
 * @returns Prisma middleware function
 *
 * Chức năng chính:
 * - Measure query execution time
 * - Log query details (args, duration, model, action)
 * - Limit query string length để tránh log quá dài (max 500 chars)
 *
 * Lưu ý:
 * - Middleware này được setup trong MonitoringModule.onModuleInit()
 * - Tự động log tất cả Prisma queries với performance metrics
 * - Query args được stringify và limit 500 characters để tránh log quá dài
 */
export function createPrismaLoggerMiddleware(performanceService: PerformanceService) {
  return async (
    params: PrismaMiddlewareParams,
    next: (params: PrismaMiddlewareParams) => Promise<unknown>,
  ) => {
    const start = Date.now();
    const result = await next(params);
    const duration = Date.now() - start;

    // Log query với performance metrics
    performanceService.logQuery(
      JSON.stringify(params.args).substring(0, 500), // Limit query string length để tránh log quá dài
      duration,
      params.model || undefined,
      params.action || undefined,
    );

    return result;
  };
}
