import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '@nestjs-modules/ioredis';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
        return {
          type: 'single',
          url: redisUrl,
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
