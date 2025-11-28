import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { CacheInterface, KeyCachingSystem } from './dto/cache.dto';

@Injectable()
export class RedisCachingService {
  private logger = new Logger(RedisCachingService.name);

  constructor(@InjectRedis() private readonly redisClient: Redis) {}

  getClient() {
    return this.redisClient;
  }

  async setItem(key: KeyCachingSystem, value: any, seconds?: number): Promise<void> {
    try {
      if (seconds) {
        await this.redisClient.set(`${process.env.NODE_ENV}:${key}`, value, 'EX', seconds);
      } else {
        await this.redisClient.set(`${process.env.NODE_ENV}:${key}`, value);
      }
    } catch (error: any) {
      this.logger.error(`❌ Fn setStore ERROR: ${error?.message}`);
    }
  }

  async getItem<T extends CacheInterface | any>(key: KeyCachingSystem): Promise<T | undefined> {
    try {
      const data = await this.redisClient.get(`${process.env.NODE_ENV}:${key}`);
      try {
        return JSON.parse(data!) as T;
      } catch (error) {
        return data as T;
      }
    } catch (error: any) {
      this.logger.error(`❌ Fn getStore ERROR: ${error?.message}`);
    }
  }

  async removeItem(key: KeyCachingSystem): Promise<any> {
    try {
      await this.redisClient.del(`${process.env.NODE_ENV}:${key}`);
    } catch (error: any) {
      this.logger.error(`❌ Fn getStore ERROR: ${error?.message}`);
    }
  }
}
