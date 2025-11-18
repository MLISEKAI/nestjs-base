// import { Injectable, BadRequestException, Logger, Inject } from '@nestjs/common';
// import { Redis } from 'ioredis';

// interface CounterEntry {
//   count: number;
//   expiresAt: number;
// }

// @Injectable()
// export class AuthRateLimitService {
//   private readonly logger = new Logger(AuthRateLimitService.name);
//   private readonly ttlSeconds = 15 * 60; // 15 phút
//   private readonly maxLoginFailures = 5;
//   private readonly maxOtpFailures = 5;
//   private readonly maxTwoFactorFailures = 6;

//   private readonly inMemoryStore = new Map<string, CounterEntry>();
//   private redisClient: Redis | null = null;

//   constructor(@Inject('REDIS_CLIENT') private readonly redis?: Redis) {
//     if (redis) {
//       this.redisClient = redis;
//       this.logger.log('Using Redis for rate limiting');
//     } else {
//       this.logger.warn('Redis not available, using in-memory store');
//     }
//   }

//   private getKey(prefix: string, parts: (string | undefined)[]): string {
//     const safe = parts.map((v) => (v || '').toLowerCase().trim());
//     return `auth:fail:${prefix}:${safe.join(':')}`;
//   }

//   private async touch(
//     key: string,
//     limit: number,
//     type: 'login' | 'otp' | '2fa',
//     identifier?: string,
//   ) {
//     if (this.redisClient) {
//       try {
//         const count = await this.redisClient.incr(key);
//         if (count === 1) {
//           await this.redisClient.expire(key, this.ttlSeconds);
//         }
//         if (count > limit) {
//           this.logger.warn(
//             `Brute-force detected: ${type} failures exceeded for ${identifier || key}`,
//           );
//           throw new BadRequestException('Too many attempts, please try again later');
//         }
//         return;
//       } catch (error) {
//         if (error instanceof BadRequestException) {
//           throw error;
//         }
//         this.logger.error('Redis error, falling back to in-memory', error);
//       }
//     }

//     // Fallback to in-memory
//     const now = Date.now();
//     const existing = this.inMemoryStore.get(key);
//     if (existing && existing.expiresAt > now) {
//       existing.count += 1;
//       if (existing.count > limit) {
//         this.logger.warn(
//           `Brute-force detected: ${type} failures exceeded for ${identifier || key}`,
//         );
//         throw new BadRequestException('Too many attempts, please try again later');
//       }
//       this.inMemoryStore.set(key, existing);
//       return;
//     }

//     this.inMemoryStore.set(key, {
//       count: 1,
//       expiresAt: now + this.ttlSeconds * 1000,
//     });
//   }

//   async checkLogin(refId: string, ip?: string) {
//     const key = this.getKey('login', [refId, ip]);
//     await this.touch(key, this.maxLoginFailures, 'login', refId);
//   }

//   async checkOtp(phone: string, ip?: string) {
//     const key = this.getKey('otp', [phone, ip]);
//     await this.touch(key, this.maxOtpFailures, 'otp', phone);
//   }

//   async checkTwoFactor(userId: string, ip?: string) {
//     const key = this.getKey('2fa', [userId, ip]);
//     await this.touch(key, this.maxTwoFactorFailures, '2fa', userId);
//   }

//   async resetCounter(key: string) {
//     if (this.redisClient) {
//       await this.redisClient.del(key);
//     } else {
//       this.inMemoryStore.delete(key);
//     }
//   }
// }
