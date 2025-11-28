import { RedisModule } from '@nestjs-modules/ioredis';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApiModule } from 'src/apim';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RedisCachingService } from './cache.service';

@Module({
  imports: [
    PrismaModule,
    ApiModule,
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const host = await config.get('REDIS_HOST');
        const port = await config.get('REDIS_PORT');
        const authPass = await config.get('REDIS_PASSWORD');
        return {
          type: 'single',
          url: `redis://${host}:${port}`,
          options: {
            password: authPass,
          },
        };
      },
    }),
  ],
  providers: [RedisCachingService],
  exports: [RedisCachingService],
})
export class RedisBaseModule {}
