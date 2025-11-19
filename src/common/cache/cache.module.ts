import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IORedisModule } from '@nestjs-modules/ioredis';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [
    IORedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        if (redisUrl) {
          return {
            type: 'single',
            url: redisUrl,
            options: {
              retryStrategy: (times: number) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
              },
              maxRetriesPerRequest: 3,
            },
          };
        }
        // Fallback to localhost if REDIS_URL not provided
        return {
          type: 'single',
          url: 'redis://localhost:6379',
          options: {
            retryStrategy: (times: number) => {
              const delay = Math.min(times * 50, 2000);
              return delay;
            },
            maxRetriesPerRequest: 3,
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

