import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

/**
 * Prometheus-style metrics for cache monitoring
 */
export interface CacheMetrics {
  cache_warmup_duration_seconds: number;
  cache_warmup_status: 'idle' | 'running' | 'completed' | 'failed';
  cache_hits_total: number;
  cache_misses_total: number;
  cache_keys_warmed: number;
  redis_memory_usage_bytes: number;
  last_warmup_timestamp: number;
}

@Injectable()
export class MetricsService {
  private metrics: CacheMetrics = {
    cache_warmup_duration_seconds: 0,
    cache_warmup_status: 'idle',
    cache_hits_total: 0,
    cache_misses_total: 0,
    cache_keys_warmed: 0,
    redis_memory_usage_bytes: 0,
    last_warmup_timestamp: 0,
  };

  constructor(@InjectRedis() private readonly redis: Redis) {}

  /**
   * Update cache warmup metrics
   */
  recordWarmupStart() {
    this.metrics.cache_warmup_status = 'running';
  }

  recordWarmupComplete(durationMs: number, keysWarmed: number) {
    this.metrics.cache_warmup_duration_seconds = durationMs / 1000;
    this.metrics.cache_warmup_status = 'completed';
    this.metrics.cache_keys_warmed = keysWarmed;
    this.metrics.last_warmup_timestamp = Date.now();
  }

  recordWarmupFailed() {
    this.metrics.cache_warmup_status = 'failed';
  }

  /**
   * Record cache hit/miss
   */
  recordCacheHit() {
    this.metrics.cache_hits_total++;
  }

  recordCacheMiss() {
    this.metrics.cache_misses_total++;
  }

  /**
   * Get Redis memory usage
   */
  async updateRedisMemory() {
    try {
      const info = await this.redis.info('memory');
      const match = info.match(/used_memory:(\d+)/);
      if (match) {
        this.metrics.redis_memory_usage_bytes = parseInt(match[1], 10);
      }
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Get all metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    await this.updateRedisMemory();

    const lines: string[] = [];

    // Cache warmup duration
    lines.push('# HELP cache_warmup_duration_seconds Duration of cache warmup in seconds');
    lines.push('# TYPE cache_warmup_duration_seconds gauge');
    lines.push(`cache_warmup_duration_seconds ${this.metrics.cache_warmup_duration_seconds}`);

    // Cache warmup status
    lines.push('# HELP cache_warmup_status Status of cache warmup (0=idle, 1=running, 2=completed, 3=failed)');
    lines.push('# TYPE cache_warmup_status gauge');
    const statusMap = { idle: 0, running: 1, completed: 2, failed: 3 };
    lines.push(`cache_warmup_status{status="${this.metrics.cache_warmup_status}"} ${statusMap[this.metrics.cache_warmup_status]}`);

    // Cache hits
    lines.push('# HELP cache_hits_total Total number of cache hits');
    lines.push('# TYPE cache_hits_total counter');
    lines.push(`cache_hits_total ${this.metrics.cache_hits_total}`);

    // Cache misses
    lines.push('# HELP cache_misses_total Total number of cache misses');
    lines.push('# TYPE cache_misses_total counter');
    lines.push(`cache_misses_total ${this.metrics.cache_misses_total}`);

    // Keys warmed
    lines.push('# HELP cache_keys_warmed Number of keys warmed in last warmup');
    lines.push('# TYPE cache_keys_warmed gauge');
    lines.push(`cache_keys_warmed ${this.metrics.cache_keys_warmed}`);

    // Redis memory
    lines.push('# HELP redis_memory_usage_bytes Redis memory usage in bytes');
    lines.push('# TYPE redis_memory_usage_bytes gauge');
    lines.push(`redis_memory_usage_bytes ${this.metrics.redis_memory_usage_bytes}`);

    // Last warmup timestamp
    lines.push('# HELP cache_last_warmup_timestamp Unix timestamp of last warmup');
    lines.push('# TYPE cache_last_warmup_timestamp gauge');
    lines.push(`cache_last_warmup_timestamp ${this.metrics.last_warmup_timestamp}`);

    return lines.join('\n') + '\n';
  }

  /**
   * Get metrics as JSON (for dashboard)
   */
  async getMetricsJson(): Promise<CacheMetrics> {
    await this.updateRedisMemory();
    return { ...this.metrics };
  }

  /**
   * Check if alert conditions are met
   */
  getAlerts(): Array<{ severity: 'warning' | 'critical'; message: string }> {
    const alerts: Array<{ severity: 'warning' | 'critical'; message: string }> = [];

    // Alert: Warmup duration > 10s
    if (this.metrics.cache_warmup_duration_seconds > 10) {
      alerts.push({
        severity: 'warning',
        message: `Cache warmup took ${this.metrics.cache_warmup_duration_seconds.toFixed(2)}s (threshold: 10s)`,
      });
    }

    // Alert: Warmup failed
    if (this.metrics.cache_warmup_status === 'failed') {
      alerts.push({
        severity: 'critical',
        message: 'Cache warmup failed',
      });
    }

    // Alert: High cache miss rate (>50%)
    const totalRequests = this.metrics.cache_hits_total + this.metrics.cache_misses_total;
    if (totalRequests > 100) {
      const missRate = this.metrics.cache_misses_total / totalRequests;
      if (missRate > 0.5) {
        alerts.push({
          severity: 'warning',
          message: `High cache miss rate: ${(missRate * 100).toFixed(1)}%`,
        });
      }
    }

    return alerts;
  }
}
