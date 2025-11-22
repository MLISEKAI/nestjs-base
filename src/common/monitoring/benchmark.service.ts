import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { PerformanceService } from './performance.service';
import { BenchmarkResult } from '../interfaces';

@Injectable()
export class BenchmarkService {
  private readonly logger = new Logger(BenchmarkService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly performanceService: PerformanceService,
  ) {}

  /**
   * Benchmark a function
   */
  async benchmark<T>(name: string, fn: () => Promise<T>, iterations = 1): Promise<BenchmarkResult> {
    const start = Date.now();
    const metricsBefore = this.performanceService.getMetrics();
    const queriesBefore = metricsBefore.totalQueries;

    for (let i = 0; i < iterations; i++) {
      await fn();
    }

    const end = Date.now();
    const metricsAfter = this.performanceService.getMetrics();
    const queriesAfter = metricsAfter.totalQueries;

    const duration = end - start;
    const queries = queriesAfter - queriesBefore;

    this.logger.log(
      `Benchmark: ${name} - ${duration}ms (${queries} queries, ${iterations} iterations)`,
    );

    return {
      name,
      duration: Math.round((duration / iterations) * 100) / 100,
      queries: Math.round(queries / iterations),
      cached: false,
    };
  }

  /**
   * Benchmark with cache
   */
  async benchmarkWithCache<T>(
    name: string,
    cacheKey: string,
    fn: () => Promise<T>,
    ttl = 3600,
  ): Promise<BenchmarkResult> {
    // Clear cache first
    await this.cacheService.del(cacheKey);

    // First call (cache miss)
    const firstCall = await this.benchmark(`${name} (cache miss)`, fn, 1);

    // Second call (cache hit)
    const secondCall = await this.benchmark(`${name} (cache hit)`, fn, 1);

    return {
      name: `${name} (cached)`,
      duration: secondCall.duration,
      queries: secondCall.queries,
      cached: true,
    };
  }

  /**
   * Compare performance before and after optimization
   */
  async comparePerformance<T>(
    name: string,
    beforeFn: () => Promise<T>,
    afterFn: () => Promise<T>,
    iterations = 10,
  ) {
    this.logger.log(`\n=== Performance Comparison: ${name} ===`);

    // Before optimization
    const before = await this.benchmark(`${name} (before)`, beforeFn, iterations);

    // After optimization
    const after = await this.benchmark(`${name} (after)`, afterFn, iterations);

    const improvement = ((before.duration - after.duration) / before.duration) * 100;
    const queryReduction = ((before.queries - after.queries) / before.queries) * 100;

    this.logger.log(`\nResults:`);
    this.logger.log(
      `Duration: ${before.duration}ms → ${after.duration}ms (${improvement.toFixed(2)}% improvement)`,
    );
    this.logger.log(
      `Queries: ${before.queries} → ${after.queries} (${queryReduction.toFixed(2)}% reduction)`,
    );

    return {
      before,
      after,
      improvement: {
        duration: improvement,
        queries: queryReduction,
      },
    };
  }

  /**
   * Run all benchmarks
   */
  async runAllBenchmarks(userId: string) {
    const results: BenchmarkResult[] = [];

    // Benchmark 1: Get user profile
    results.push(
      await this.benchmark(
        'Get User Profile',
        async () => {
          await this.prisma.resUser.findUnique({ where: { id: userId } });
        },
        10,
      ),
    );

    // Benchmark 2: Get user profile with cache
    results.push(
      await this.benchmarkWithCache('Get User Profile', `user:${userId}:profile`, async () => {
        return this.cacheService.getOrSet(
          `user:${userId}:profile`,
          () => this.prisma.resUser.findUnique({ where: { id: userId } }),
          3600,
        );
      }),
    );

    // Benchmark 3: Get gifts list
    results.push(
      await this.benchmark(
        'Get Gifts List',
        async () => {
          await this.prisma.resGift.findMany({
            where: { receiver_id: userId },
            take: 20,
            include: {
              sender: { select: { id: true, nickname: true, avatar: true } },
              giftItem: { select: { id: true, name: true } },
            },
          });
        },
        10,
      ),
    );

    return results;
  }
}
