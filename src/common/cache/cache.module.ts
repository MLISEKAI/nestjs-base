// Import Module và Global decorator từ NestJS
import { Module, Global } from '@nestjs/common';
// Import ConfigModule và ConfigService để đọc environment variables
import { ConfigModule, ConfigService } from '@nestjs/config';
// Import RedisModule để kết nối Redis
import { RedisModule } from '@nestjs-modules/ioredis';
// Import CacheService
import { CacheService } from './cache.service';

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
        const redisHost = configService.get<string>('REDIS_HOST');
        const redisPort = configService.get<number>('REDIS_PORT');
        const redisPassword = configService.get<string>('REDIS_PASSWORD');
        const redisDb = configService.get<number>('REDIS_DB') || 0;

        // Build URL from individual params if REDIS_URL not provided
        const finalUrl = (redisHost && redisPort 
            ? `redis://${redisPassword ? `:${redisPassword}@` : ''}${redisHost}:${redisPort}/${redisDb}`
            : 'redis://localhost:6379');

        return {
          type: 'single',
          url: finalUrl,
          options: {
            retryStrategy: () => {
              // Return null to stop all retry attempts
              return null;
            },
            maxRetriesPerRequest: 0, // Don't retry individual requests
            enableOfflineQueue: false, // Disable offline queue to prevent connection spam
            lazyConnect: true, // Don't connect immediately
            connectTimeout: 3000, // 3 second timeout
            showFriendlyErrorStack: false,
            enableReadyCheck: false,
            enableAutoPipelining: false,
            // Disable automatic reconnection
            reconnectOnError: () => false,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
