import { PerformanceService } from './performance.service';

/**
 * Prisma middleware để log query performance
 * Prisma middleware params type
 */
interface PrismaMiddlewareParams {
  model?: string;
  action: string;
  args: any;
  dataPath: string[];
  runInTransaction: boolean;
}

export function createPrismaLoggerMiddleware(performanceService: PerformanceService) {
  return async (
    params: PrismaMiddlewareParams,
    next: (params: PrismaMiddlewareParams) => Promise<any>,
  ) => {
    const start = Date.now();
    const result = await next(params);
    const duration = Date.now() - start;

    // Log query
    performanceService.logQuery(
      JSON.stringify(params.args).substring(0, 500), // Limit query string length
      duration,
      params.model || undefined,
      params.action || undefined,
    );

    return result;
  };
}
