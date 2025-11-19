import { Module, Global, OnModuleInit } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { BenchmarkService } from './benchmark.service';
import { PerformanceController } from './controller/performance.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CacheModule } from '../cache/cache.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { createPrismaLoggerMiddleware } from './prisma-logger.middleware';

@Global()
@Module({
  imports: [PrismaModule, CacheModule],
  controllers: [PerformanceController],
  providers: [PerformanceService, BenchmarkService],
  exports: [PerformanceService, BenchmarkService],
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
