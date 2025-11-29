// Import Module và Global decorator từ NestJS
import { Module, Global } from '@nestjs/common';
// Import ConfigModule và ConfigService để đọc environment variables
import { ConfigModule, ConfigService } from '@nestjs/config';
// Import RedisModule để kết nối Redis
import { RedisModule } from '@nestjs-modules/ioredis';
// Import CacheService
import { CacheService } from './cache.service';
// Import MemoryCacheService
import { MemoryCacheService } from './memory-cache.service';

/**
 * @Global() - Module này là global, có thể được inject vào bất kỳ module nào mà không cần import
 * @Module() - Đánh dấu class này là NestJS module
 * CacheModule - Module cung cấp caching service với Redis
 *
 * Chức năng chính:
 * - Kết nối Redis
 * - Cung cấp CacheService để cache data
 * - Global module, tất cả modules có thể sử dụng
 *
 * Dependencies:
 * - ConfigModule: Environment variables
 * - RedisModule: Redis connection
 *
 * Exports:
 * - CacheService: Để các modules khác sử dụng
 *
 * Lưu ý:
 * - Redis URL từ REDIS_URL environment variable (default: redis://localhost:6379)
 * - Lazy connect: Không kết nối ngay khi module khởi động
 * - Connection timeout: 3 seconds
 * - Disable automatic reconnection để tránh connection spam
 */
@Global()
@Module({
  imports: [
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisHost = configService.get<string>('REDIS_HOST') || 'localhost';
        const redisPort = parseInt(configService.get<string>('REDIS_PORT') || '6379', 10);
        const redisPassword = configService.get<string>('REDIS_PASSWORD');
        const redisDb = parseInt(configService.get<string>('REDIS_DB') || '0', 10);

        // Build Redis URL with password authentication
        const finalUrl = redisPassword
          ? `redis://:${redisPassword}@${redisHost}:${redisPort}/${redisDb}`
          : `redis://${redisHost}:${redisPort}/${redisDb}`;

        return {
          type: 'single',
          url: finalUrl,
          options: {
            retryStrategy: (times: number) => {
              if (times > 3) return null; // Stop after 3 retries
              return Math.min(times * 100, 3000); // Exponential backoff
            },
            maxRetriesPerRequest: 3,
            enableOfflineQueue: false,
            connectTimeout: 10000, // 10 seconds
            commandTimeout: 5000, // 5 seconds
            keepAlive: 30000,
            showFriendlyErrorStack: true,
            enableReadyCheck: true,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [MemoryCacheService, CacheService],
  exports: [CacheService, MemoryCacheService], // Export MemoryCacheService để dùng ở modules khác
})
export class CacheModule {}
