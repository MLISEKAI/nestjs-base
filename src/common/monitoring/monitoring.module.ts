// Import Module, Global và OnModuleInit từ NestJS
import { Module, Global, OnModuleInit } from '@nestjs/common';
// Import services
import { PerformanceService } from './performance.service';
import { BenchmarkService } from './benchmark.service';
import { MetricsService } from './metrics.service';
// Import controllers
import { PerformanceController } from './controller/performance.controller';
import { MetricsController } from './controller/metrics.controller';
// Import modules
import { PrismaModule } from 'src/prisma/prisma.module';
import { CacheModule } from '../cache/cache.module';
// Import PrismaService để setup middleware
import { PrismaService } from 'src/prisma/prisma.service';
// Import Prisma logger middleware
import { createPrismaLoggerMiddleware } from './prisma-logger.middleware';

/**
 * @Global() - Module này là global, có thể được inject vào bất kỳ module nào mà không cần import
 * @Module() - Đánh dấu class này là NestJS module
 * MonitoringModule - Module xử lý performance monitoring và benchmarking
 *
 * Chức năng chính:
 * - Performance monitoring (query time, response time, etc.)
 * - Benchmarking
 * - Prisma query logging
 *
 * Dependencies:
 * - PrismaModule: Database access
 * - CacheModule: Caching
 *
 * Exports:
 * - PerformanceService: Để các modules khác sử dụng
 * - BenchmarkService: Để các modules khác sử dụng
 *
 * Lưu ý:
 * - Setup Prisma middleware để log query performance
 * - Middleware được setup trong onModuleInit
 */
@Global()
@Module({
  imports: [PrismaModule, CacheModule],
  controllers: [PerformanceController, MetricsController],
  providers: [
    PerformanceService,
    BenchmarkService,
    MetricsService,
    {
      provide: 'MetricsService',
      useExisting: MetricsService,
    },
  ],
  exports: [PerformanceService, BenchmarkService, MetricsService, 'MetricsService'],
})
export class MonitoringModule implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private performanceService: PerformanceService,
  ) {}

  async onModuleInit() {
    // Setup Prisma middleware for performance logging
    try {
      // Prisma middleware must be set up after connection
      if (this.prisma && typeof (this.prisma as any).$use === 'function') {
        (this.prisma as any).$use(createPrismaLoggerMiddleware(this.performanceService));
      }
    } catch (error) {
      // Silently fail if middleware setup fails
      console.warn('Performance middleware setup skipped:', error.message);
    }
  }
}
