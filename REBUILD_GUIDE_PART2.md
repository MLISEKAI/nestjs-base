# 🚀 Hướng Dẫn Rebuild Dự Án - PART 2: Core Modules & Authentication

## 📋 Tổng Quan PART 2

Trong phần này, chúng ta sẽ xây dựng các **Core Modules** - nền tảng của toàn bộ application:

**Nội dung**:
1. ✅ **Prisma Module** - Database connection & ORM
2. ✅ **Config Module** - Environment configuration
3. ✅ **2-Layer Cache System** - Memory (L1) + Redis (L2)
4. ✅ **Common Module** - Shared utilities (Filters, Interceptors, Guards)
5. ✅ **Authentication Module** - JWT + OAuth + 2FA

**Thời gian**: ~45-60 phút

**Prerequisites**: Đã hoàn thành PART 1

---

## 🔧 BƯỚC 4: Setup Core Modules

### 4.1. Prisma Module

**Mục đích**: Quản lý database connection và cung cấp Prisma Client cho toàn bộ app.

**Đặc điểm**:
- `@Global()` decorator → Available trong tất cả modules (không cần import)
- Lifecycle hooks: `onModuleInit`, `onModuleDestroy`
- Auto-connect on startup, auto-disconnect on shutdown
- Logging cho connection status

#### File: `src/prisma/prisma.module.ts`

```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * @Global() - Module này sẽ available globally
 * Không cần import PrismaModule vào các module khác
 * Chỉ cần import vào AppModule một lần
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],  // Export để các module khác có thể inject
})
export class PrismaModule {}
```

#### File: `src/prisma/prisma.service.ts`

```typescript
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService - Wrapper around Prisma Client
 * 
 * Features:
 * - Auto-connect on module init
 * - Auto-disconnect on module destroy
 * - Logging for connection status
 * - Query logging (optional)
 * - Connection pooling (handled by Prisma)
 * 
 * Usage:
 * constructor(private prisma: PrismaService) {}
 * await this.prisma.resUser.findMany()
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      // Log configuration
      log: [
        { level: 'error', emit: 'stdout' },  // Log errors
        { level: 'warn', emit: 'stdout' },   // Log warnings
        // Uncomment for query logging (useful for debugging):
        // { level: 'query', emit: 'stdout' },  // Log all queries
      ],
      
      // Error formatting
      errorFormat: 'pretty',  // Pretty error messages in development
      
      // Connection pool (optional, Prisma handles this automatically)
      // datasources: {
      //   db: {
      //     url: process.env.DATABASE_URL,
      //   },
      // },
    });
  }

  /**
   * onModuleInit - Lifecycle hook
   * Called when NestJS module is initialized
   * Connects to database
   */
  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connected successfully');
      
      // Optional: Log database info
      const result = await this.$queryRaw`SELECT version()`;
      this.logger.debug('Database version:', result);
    } catch (error) {
      this.logger.error('❌ Database connection failed:', error);
      throw error;  // Fail fast if database is not available
    }
  }

  /**
   * onModuleDestroy - Lifecycle hook
   * Called when NestJS module is destroyed (app shutdown)
   * Disconnects from database gracefully
   */
  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('📤 Database disconnected');
  }

  /**
   * Helper: Clean database (useful for testing)
   * WARNING: This deletes ALL data!
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production!');
    }

    const models = Object.keys(this).filter(
      (key) => !key.startsWith('_') && !key.startsWith('$')
    );

    return Promise.all(
      models.map((model) => this[model].deleteMany())
    );
  }
}
```

**Test Prisma Module**:

```bash
# Create test file: src/prisma/prisma.service.spec.ts
# (Optional - for unit testing)
```

### 4.2. Config Module

**Mục đích**: Centralized configuration management với type-safe access.

**Đặc điểm**:
- Type-safe configuration
- Environment-specific configs
- Validation (optional)
- Easy to test

#### File: `src/config/database.config.ts`

```typescript
import { registerAs } from '@nestjs/config';

/**
 * Database Configuration
 * 
 * Usage:
 * constructor(private configService: ConfigService) {}
 * const dbUrl = this.configService.get<string>('database.url');
 */
export default registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  
  // Optional: Parse connection string
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'social_network',
  
  // Connection pool settings
  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  },
}));
```

#### File: `src/config/jwt.config.ts`

```typescript
import { registerAs } from '@nestjs/config';

/**
 * JWT Configuration
 * 
 * Usage:
 * constructor(private configService: ConfigService) {}
 * const secret = this.configService.get<string>('jwt.secret');
 */
export default registerAs('jwt', () => ({
  // Access token config
  secret: process.env.JWT_SECRET || 'default-secret-change-this-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  
  // Refresh token config
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-this',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  // Token issuer & audience (optional)
  issuer: process.env.JWT_ISSUER || 'social-network-api',
  audience: process.env.JWT_AUDIENCE || 'social-network-app',
}));
```

#### File: `src/config/redis.config.ts`

```typescript
import { registerAs } from '@nestjs/config';

/**
 * Redis Configuration
 */
export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  
  // Connection options
  retryStrategy: (times: number) => {
    if (times > 3) return null;  // Stop retrying after 3 attempts
    return Math.min(times * 100, 3000);  // Exponential backoff
  },
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,
  connectTimeout: 10000,
  commandTimeout: 5000,
}));
```

#### File: `src/config/app.config.ts`

```typescript
import { registerAs } from '@nestjs/config';

/**
 * Application Configuration
 */
export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  env: process.env.NODE_ENV || 'development',
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || '*',
  
  // Cache
  skipCacheWarmup: process.env.SKIP_CACHE_WARMUP === '1',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // API
  apiPrefix: process.env.API_PREFIX || 'api',
  apiVersion: process.env.API_VERSION || 'v1',
}));
```

#### File: `src/config/config.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import databaseConfig from './database.config';
import jwtConfig from './jwt.config';
import redisConfig from './redis.config';
import appConfig from './app.config';

/**
 * Config Module
 * Loads all configuration files
 */
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,  // Make config available globally
      load: [
        databaseConfig,
        jwtConfig,
        redisConfig,
        appConfig,
      ],
      // Optional: Validate environment variables
      // validationSchema: Joi.object({
      //   NODE_ENV: Joi.string().valid('development', 'production', 'test'),
      //   PORT: Joi.number().default(3000),
      //   DATABASE_URL: Joi.string().required(),
      // }),
    }),
  ],
})
export class ConfigModule {}
```

### 4.3. Cache Module (2-Layer Cache System)

**Mục đích**: Implement 2-layer caching strategy để giảm database load và tăng performance.

**Architecture**:
```
Request
   ↓
L1: Memory Cache (LRU)  ← <1ms, 1000 items max
   ↓ (miss)
L2: Redis Cache         ← ~50-100ms, unlimited
   ↓ (miss)
Database (PostgreSQL)   ← ~100-500ms
   ↓
Cache Result (write-through)
   ↓
Response
```

**Performance Impact**:
- **Cache Hit Rate**: 85-95%
- **API Response Time**: Giảm 60-80%
- **Database Load**: Giảm 90%

#### File: `src/common/cache/memory-cache.service.ts`

**Giải thích**: L1 cache - In-memory LRU cache cực nhanh (<1ms) nhưng giới hạn size.

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { LRUCache } from 'lru-cache';

/**
 * MemoryCacheService - L1 Cache (In-Memory)
 * 
 * Đặc điểm:
 * - Cực nhanh: <1ms access time
 * - Giới hạn: Max 1000 items
 * - LRU eviction: Tự động xóa items ít dùng nhất
 * - TTL: 5 phút default
 * 
 * Use cases:
 * - Hot data (frequently accessed)
 * - User sessions
 * - API rate limiting counters
 * 
 * Trade-offs:
 * ✅ Pros: Cực nhanh, không cần network
 * ❌ Cons: Limited size, không persist, không share giữa instances
 */
@Injectable()
export class MemoryCacheService {
  private readonly logger = new Logger(MemoryCacheService.name);
  private cache: LRUCache<string, any>;

  constructor() {
    // Initialize LRU cache
    this.cache = new LRUCache({
      max: 1000,              // Max 1000 items
      ttl: 1000 * 60 * 5,     // TTL: 5 minutes (in milliseconds)
      updateAgeOnGet: true,   // Reset TTL on access
      updateAgeOnHas: true,   // Reset TTL on check
      
      // Optional: Track cache stats
      // maxSize: 10000000,   // Max size in bytes (10MB)
      // sizeCalculation: (value) => JSON.stringify(value).length,
    });
    
    this.logger.log('✅ Memory cache initialized (max: 1000 items, TTL: 5min)');
  }

  /**
   * Get value from cache
   * @returns Value or undefined if not found/expired
   */
  get<T>(key: string): T | undefined {
    return this.cache.get(key);
  }

  /**
   * Set value in cache
   * @param ttl - TTL in seconds (optional, overrides default)
   */
  set(key: string, value: any, ttl?: number): void {
    const options = ttl ? { ttl: ttl * 1000 } : undefined;
    this.cache.set(key, value, options);
  }

  /**
   * Delete single key
   */
  del(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Delete keys matching pattern
   * Example: delPattern('user:*') deletes all keys starting with 'user:'
   */
  delPattern(pattern: string): void {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    let deletedCount = 0;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      this.logger.debug(`Deleted ${deletedCount} keys matching pattern: ${pattern}`);
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.logger.log(`Cleared ${size} items from memory cache`);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,        // Current items count
      max: this.cache.max,           // Max capacity
      calculatedSize: this.cache.calculatedSize || 0,  // Size in bytes (if enabled)
    };
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }
}
```

#### File: `src/common/cache/cache.service.ts`

**Giải thích**: Main cache service với 2-layer logic (Memory + Redis).

**Copy full code từ dự án cũ**: `src/common/cache/cache.service.ts` (300+ lines với đầy đủ features)

**Minimal version để bắt đầu**:

```typescript
import { Injectable, Logger, Optional, Inject } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { MemoryCacheService } from './memory-cache.service';

/**
 * CacheService - 2-Layer Cache System
 * 
 * Architecture:
 * Request → L1 (Memory) → L2 (Redis) → Database
 *           <1ms          ~50-100ms     ~100-500ms
 * 
 * Features:
 * - Write-through caching (write to both layers)
 * - Automatic fallback (if Redis fails, use memory only)
 * - Pattern-based invalidation
 * - Cache-aside pattern support
 * - Graceful degradation
 * 
 * Performance:
 * - Cache hit rate: 85-95%
 * - API response time: Giảm 60-80%
 * - Database load: Giảm 90%
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly defaultTtl = 3600; // 1 hour
  private isRedisConnected = false;
  private hasLoggedConnectionError = false;

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly memoryCache: MemoryCacheService,
    @Optional() @Inject('MetricsService') private readonly metricsService?: any,
  ) {
    // Setup Redis event handlers
    this.redis.on('connect', () => {
      this.isRedisConnected = true;
      this.hasLoggedConnectionError = false;
      this.logger.log('✅ Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      this.isRedisConnected = false;
      if (!this.hasLoggedConnectionError) {
        const errorMsg = error.message || String(error);
        if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('Connection')) {
          this.logger.warn('⚠️ Redis not available. Cache will use memory only.');
        } else {
          this.logger.warn('Redis error:', errorMsg);
        }
        this.hasLoggedConnectionError = true;
      }
    });

    this.redis.on('close', () => {
      this.isRedisConnected = false;
    });
  }

  /**
   * Get value from cache (2-layer lookup)
   * 
   * Flow:
   * 1. Check L1 (Memory) - <1ms
   * 2. If miss, check L2 (Redis) - ~50-100ms
   * 3. If found in Redis, populate L1 (write-through)
   * 4. Return value or null
   */
  async get<T>(key: string): Promise<T | null> {
    // L1: Memory cache (very fast)
    const memoryValue = this.memoryCache.get<T>(key);
    if (memoryValue !== undefined) {
      this.metricsService?.recordCacheHit();
      return memoryValue;
    }

    // L2: Redis cache
    if (!this.isRedisConnected) {
      this.metricsService?.recordCacheMiss();
      return null;
    }

    try {
      const value = await this.redis.get(key);
      if (!value) {
        this.metricsService?.recordCacheMiss();
        return null;
      }

      const parsed = JSON.parse(value) as T;
      
      // Populate L1 for next time (write-through)
      this.memoryCache.set(key, parsed);
      this.metricsService?.recordCacheHit();
      
      return parsed;
    } catch (error) {
      if (!error.message?.includes('ECONNREFUSED') && !error.message?.includes('Connection')) {
        this.logger.debug(`Cache get error for key ${key}:`, error.message);
      }
      return null;
    }
  }

  /**
   * Set value in cache (write to both layers)
   * 
   * @param ttl - Time to live in seconds
   */
  async set(key: string, value: any, ttl: number = this.defaultTtl): Promise<void> {
    // L1: Memory cache (instant)
    this.memoryCache.set(key, value, ttl);
    
    // L2: Redis cache (persistent)
    if (!this.isRedisConnected) return;

    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttl, serialized);
    } catch (error) {
      if (!error.message?.includes('ECONNREFUSED') && !error.message?.includes('Connection')) {
        this.logger.debug(`Cache set error for key ${key}:`, error.message);
      }
    }
  }

  /**
   * Delete single key from both layers
   */
  async del(key: string): Promise<void> {
    this.memoryCache.del(key);
    
    if (!this.isRedisConnected) return;

    try {
      await this.redis.del(key);
    } catch (error) {
      if (!error.message?.includes('ECONNREFUSED') && 
          !error.message?.includes('Connection') &&
          !error.message?.includes("Stream isn't writeable")) {
        this.logger.debug(`Cache delete error for key ${key}:`, error.message);
      }
    }
  }

  /**
   * Delete keys matching pattern
   * Example: delPattern('user:123:*') deletes all keys for user 123
   */
  async delPattern(pattern: string): Promise<void> {
    this.memoryCache.delPattern(pattern);
    
    if (!this.isRedisConnected) return;

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.debug(`Deleted ${keys.length} keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      if (!error.message?.includes('ECONNREFUSED') && 
          !error.message?.includes('Connection') &&
          !error.message?.includes("Stream isn't writeable")) {
        this.logger.debug(`Cache delete pattern error for ${pattern}:`, error.message);
      }
    }
  }

  /**
   * Cache-aside pattern: Get from cache or fetch from source
   * 
   * Usage:
   * const user = await this.cacheService.getOrSet(
   *   'user:123',
   *   () => this.prisma.resUser.findUnique({ where: { id: '123' } }),
   *   1800  // 30 minutes
   * );
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.defaultTtl,
  ): Promise<T> {
    // Try cache first
    if (this.isRedisConnected) {
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }
    }

    // Fetch from source
    const value = await fetchFn();

    // Cache result
    if (this.isRedisConnected) {
      await this.set(key, value, ttl);
    }

    return value;
  }

  /**
   * Invalidate all cache for a user
   * Useful when user updates profile, settings, etc.
   */
  async invalidateUserCache(userId: string): Promise<void> {
    await Promise.all([
      this.delPattern(`user:${userId}:*`),
      this.delPattern(`profile:${userId}:*`),
      this.delPattern(`connections:${userId}:*`),
    ]);
  }

  /**
   * Clear all cache (use with caution!)
   */
  async flushAll(): Promise<void> {
    this.memoryCache.clear();
    
    if (!this.isRedisConnected) return;

    try {
      await this.redis.flushall();
      this.logger.warn('⚠️ All cache cleared!');
    } catch (error) {
      if (!error.message?.includes('ECONNREFUSED') && 
          !error.message?.includes('Connection') &&
          !error.message?.includes("Stream isn't writeable")) {
        this.logger.debug('Cache flush all error:', error.message);
      }
    }
  }
}
```

**Lưu ý**: Đây là minimal version. Copy full version từ dự án cũ để có thêm:
- `exists()` method
- Better error handling
- More helper methods
- Performance tracking

#### File: `src/common/cache/cache.module.ts`

**Giải thích**: Module tổng hợp cache system với Redis configuration.

```typescript
import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '@nestjs-modules/ioredis';
import { CacheService } from './cache.service';
import { MemoryCacheService } from './memory-cache.service';

/**
 * CacheModule - 2-Layer Cache System
 * 
 * Provides:
 * - MemoryCacheService (L1)
 * - CacheService (L1 + L2)
 * - Redis connection
 * 
 * @Global() - Available in all modules without import
 */
@Global()
@Module({
  imports: [
    // Redis Module with async configuration
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        // Get Redis config from environment
        const redisHost = configService.get<string>('REDIS_HOST') || 'localhost';
        const redisPort = parseInt(configService.get<string>('REDIS_PORT') || '6379', 10);
        const redisPassword = configService.get<string>('REDIS_PASSWORD');
        const redisDb = parseInt(configService.get<string>('REDIS_DB') || '0', 10);

        // Build Redis URL
        const finalUrl = redisPassword
          ? `redis://:${redisPassword}@${redisHost}:${redisPort}/${redisDb}`
          : `redis://${redisHost}:${redisPort}/${redisDb}`;

        return {
          type: 'single',
          url: finalUrl,
          options: {
            // Retry strategy: Exponential backoff
            retryStrategy: (times: number) => {
              if (times > 3) return null;  // Stop after 3 retries
              return Math.min(times * 100, 3000);  // 100ms, 200ms, 400ms
            },
            
            // Connection settings
            maxRetriesPerRequest: 3,
            enableOfflineQueue: false,  // Fail fast if Redis is down
            connectTimeout: 10000,      // 10 seconds
            commandTimeout: 5000,       // 5 seconds
            
            // Optional: Connection pool
            // maxRetriesPerRequest: 3,
            // enableReadyCheck: true,
            // lazyConnect: false,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    MemoryCacheService,
    CacheService,
  ],
  exports: [
    CacheService,
    MemoryCacheService,
  ],
})
export class CacheModule {}
```

### 4.4. Cache TTL Constants

**File**: `src/common/cache/cache-ttl.constants.ts`

```typescript
/**
 * Cache TTL (Time To Live) Configuration
 * All values in seconds
 */
export const CacheTTL = {
  // User data
  USER_DETAIL: 1800,      // 30 minutes
  USER_STATS: 300,        // 5 minutes
  USER_PROFILE: 1800,     // 30 minutes
  
  // Social connections
  CONNECTIONS_STATS: 300, // 5 minutes
  FOLLOWERS_LIST: 600,    // 10 minutes
  FOLLOWING_LIST: 600,    // 10 minutes
  FRIENDS_LIST: 600,      // 10 minutes
  
  // Content
  POST_DETAIL: 900,       // 15 minutes
  POST_STATS: 300,        // 5 minutes
  FEED: 180,              // 3 minutes
  COMMENTS: 600,          // 10 minutes
  
  // Search
  SEARCH_PAGE: 600,       // 10 minutes
  SEARCH_USERS: 600,      // 10 minutes
  SEARCH_POSTS: 300,      // 5 minutes
  
  // Notifications
  NOTIFICATIONS: 60,      // 1 minute
  UNREAD_COUNT: 30,       // 30 seconds
  
  // Messaging
  CONVERSATIONS: 300,     // 5 minutes
  MESSAGES: 180,          // 3 minutes
  
  // System
  CONFIG: 3600,           // 1 hour
  SETTINGS: 1800,         // 30 minutes
} as const;

/**
 * Cache Key Patterns
 * Use these patterns for consistent cache keys
 */
export const CacheKeys = {
  // User
  userDetail: (userId: string) => `user:${userId}:detail`,
  userStats: (userId: string) => `user:${userId}:stats`,
  userProfile: (userId: string) => `profile:${userId}:info`,
  
  // Connections
  connectionsStats: (userId: string) => `connections:${userId}:stats`,
  followersList: (userId: string, page: number, limit: number) => 
    `followers:${userId}:page:${page}:limit:${limit}`,
  followingList: (userId: string, page: number, limit: number) => 
    `following:${userId}:page:${page}:limit:${limit}`,
  
  // Posts
  postDetail: (postId: string) => `post:${postId}:detail`,
  postStats: (postId: string) => `post:${postId}:stats`,
  userPosts: (userId: string, page: number) => `posts:user:${userId}:page:${page}`,
  feed: (userId: string, page: number) => `feed:${userId}:page:${page}`,
  
  // Search
  searchUsers: (query: string, page: number, limit: number) => 
    `search:users:${query.toLowerCase()}:page:${page}:limit:${limit}`,
  searchPosts: (query: string, page: number) => 
    `search:posts:${query.toLowerCase()}:page:${page}`,
  
  // Notifications
  notifications: (userId: string, page: number, limit: number) => 
    `notifications:${userId}:page:${page}:limit:${limit}`,
  unreadCount: (userId: string) => `notifications:${userId}:unread:count`,
} as const;
```

### 4.5. Test Cache System

**File**: `src/common/cache/cache.service.spec.ts` (Optional)

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import { MemoryCacheService } from './memory-cache.service';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        MemoryCacheService,
        {
          provide: 'default_IORedisModuleConnectionToken',
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            keys: jest.fn(),
            on: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get and set values', async () => {
    await service.set('test-key', { data: 'test' }, 60);
    const value = await service.get('test-key');
    expect(value).toEqual({ data: 'test' });
  });
});
```

**Run test**:
```bash
yarn test src/common/cache/cache.service.spec.ts
```

### 4.6. Common Module - Shared Utilities

**Mục đích**: Cung cấp các utilities dùng chung cho toàn bộ app.

#### File: `src/common/filters/http-exception.filter.ts`

**Giải thích**: Global exception filter - handle tất cả errors và format response.

```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * HttpExceptionFilter - Global Exception Handler
 * 
 * Catches all exceptions and formats error response
 * 
 * Features:
 * - Consistent error format
 * - Logging with context
 * - Stack trace in development
 * - Hide sensitive info in production
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine status code
    const status = exception instanceof HttpException 
      ? exception.getStatus() 
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // Get error message
    const message = exception instanceof HttpException 
      ? exception.message 
      : 'Internal server error';

    // Get error response (for validation errors)
    const exceptionResponse = exception instanceof HttpException 
      ? exception.getResponse() 
      : null;

    // Log error
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    // Format error response
    const errorResponse = {
      statusCode: status,
      message: typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? (exceptionResponse as any).message || message
        : message,
      error: HttpStatus[status] || 'Error',
      timestamp: new Date().toISOString(),
      path: request.url,
      // Include stack trace in development only
      ...(process.env.NODE_ENV === 'development' && exception instanceof Error && {
        stack: exception.stack,
      }),
    };

    response.status(status).json(errorResponse);
  }
}
```

#### File: `src/common/interceptors/transform.interceptor.ts`

**Giải thích**: Transform response format - wrap data trong consistent structure.

```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * TransformInterceptor - Response Transformation
 * 
 * Wraps all responses in consistent format:
 * {
 *   data: <actual data>,
 *   meta: <pagination/metadata>
 * }
 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // If data already has meta (pagination), keep it
        if (data && typeof data === 'object' && 'meta' in data) {
          return data;
        }

        // Otherwise, wrap in data property
        return { data };
      }),
    );
  }
}
```

#### File: `src/common/decorators/current-user.decorator.ts`

**Giải thích**: Custom decorator để lấy current user từ request.

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * @CurrentUser() Decorator
 * 
 * Usage:
 * @Get('profile')
 * getProfile(@CurrentUser() user: any) {
 *   return user;
 * }
 * 
 * Returns user object from JWT payload
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // If data is provided, return specific property
    return data ? user?.[data] : user;
  },
);
```

#### File: `src/common/decorators/public.decorator.ts`

**Giải thích**: Decorator để skip authentication cho public endpoints.

```typescript
import { SetMetadata } from '@nestjs/common';

/**
 * @Public() Decorator
 * 
 * Mark endpoint as public (skip authentication)
 * 
 * Usage:
 * @Public()
 * @Get('health')
 * getHealth() {
 *   return { status: 'ok' };
 * }
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

#### File: `src/common/common.module.ts`

```typescript
import { Module, Global } from '@nestjs/common';

/**
 * CommonModule - Shared utilities
 * 
 * @Global() - Available in all modules
 * 
 * Provides:
 * - Exception filters
 * - Interceptors
 * - Guards
 * - Decorators
 * - Utilities
 */
@Global()
@Module({
  imports: [],
  providers: [],
  exports: [],
})
export class CommonModule {}
```

#### File: `src/common/filters/http-exception.filter.ts`
```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException ? exception.message : 'Internal server error';

    this.logger.error(`${request.method} ${request.url}`, exception);

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

#### File: `src/common/interceptors/post-status.interceptor.ts`
```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class PostStatusInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // Transform response if needed
        return data;
      }),
    );
  }
}
```

#### File: `src/common/index.ts`
```typescript
export * from './filters/http-exception.filter';
export * from './interceptors/post-status.interceptor';
```

---

---

## 🔐 BƯỚC 5: Setup Authentication

**Mục đích**: Implement JWT-based authentication với OAuth support.

**Features**:
- JWT tokens (Access + Refresh)
- Google OAuth 2.0
- Facebook OAuth
- Password hashing (Argon2)
- 2FA support (optional)

### 5.1. Auth Module Structure

```bash
# Create auth folders
mkdir -p src/auth/{dto,guards,strategy,security,services,controllers}
```

### 5.2. JWT Strategy

**Giải thích**: Passport JWT strategy - validate JWT tokens.

#### File: `src/auth/strategy/jwt.strategy.ts`
```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * JwtStrategy - Passport JWT Strategy
 * 
 * Validates JWT tokens and loads user from database
 * 
 * Flow:
 * 1. Extract JWT from Authorization header
 * 2. Verify JWT signature
 * 3. Decode payload
 * 4. Load user from database
 * 5. Check if user is active
 * 6. Attach user to request
 * 
 * Usage:
 * @UseGuards(AuthGuard('jwt'))
 * @Get('profile')
 * getProfile(@CurrentUser() user) { ... }
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      // Extract JWT from Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      
      // Don't ignore expiration (tokens must be valid)
      ignoreExpiration: false,
      
      // Secret key for verification
      secretOrKey: configService.get<string>('jwt.secret'),
      
      // Optional: Issuer & Audience validation
      // issuer: configService.get<string>('jwt.issuer'),
      // audience: configService.get<string>('jwt.audience'),
    });
  }

  /**
   * Validate JWT payload
   * Called after JWT is verified
   * 
   * @param payload - Decoded JWT payload
   * @returns User object (attached to request.user)
   */
  async validate(payload: any) {
    // Payload structure:
    // {
    //   sub: userId,
    //   iat: issuedAt,
    //   exp: expiresAt
    // }

    // Load user from database
    const user = await this.prisma.resUser.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        union_id: true,
        nickname: true,
        role: true,
        avatar: true,
        is_deleted: true,
        is_blocked: true,
      },
    });

    // Check if user exists and is active
    if (!user || user.is_deleted || user.is_blocked) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Return user object (will be attached to request.user)
    return {
      userId: user.id,
      unionId: user.union_id,
      nickname: user.nickname,
      role: user.role,
      avatar: user.avatar,
    };
  }
}
```

### 5.3. Auth Guard

#### File: `src/auth/guards/account-auth.guard.ts`

```typescript
import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';

/**
 * AccountAuthGuard - JWT Authentication Guard
 * 
 * Protects routes with JWT authentication
 * Skips authentication for @Public() routes
 * 
 * Usage:
 * @UseGuards(AccountAuthGuard)
 * @Get('profile')
 * getProfile(@CurrentUser() user) { ... }
 */
@Injectable()
export class AccountAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;  // Skip authentication
    }

    // Call parent canActivate (JWT validation)
    return super.canActivate(context);
  }
}
```

### 5.4. Auth Service

#### File: `src/auth/services/auth.service.ts`

**Lưu ý**: Đây là minimal version. Copy full version từ dự án cũ để có đầy đủ features (login, register, refresh, OAuth, 2FA).

```typescript
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as argon2 from 'argon2';

/**
 * AuthService - Authentication Business Logic
 * 
 * Features:
 * - Login (email/password)
 * - Register
 * - Token generation (access + refresh)
 * - Token refresh
 * - OAuth (Google, Facebook)
 * - 2FA (optional)
 */
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Generate JWT tokens (access + refresh)
   */
  async generateTokens(userId: string) {
    const payload = { sub: userId };

    const [accessToken, refreshToken] = await Promise.all([
      // Access token (short-lived)
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.expiresIn'),
      }),
      // Refresh token (long-lived)
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Validate user credentials
   */
  async validateUser(email: string, password: string) {
    // Find user by email
    const associate = await this.prisma.resAssociate.findFirst({
      where: { email, provider: 'password' },
      include: { user: true },
    });

    if (!associate) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await argon2.verify(associate.hash || '', password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (associate.user.is_deleted || associate.user.is_blocked) {
      throw new UnauthorizedException('User is inactive');
    }

    return associate.user;
  }

  /**
   * Login with email/password
   */
  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const tokens = await this.generateTokens(user.id);

    return {
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role,
      },
      ...tokens,
    };
  }

  /**
   * Register new user
   */
  async register(email: string, password: string, nickname: string) {
    // Check if email exists
    const existing = await this.prisma.resAssociate.findFirst({
      where: { email, provider: 'password' },
    });

    if (existing) {
      throw new BadRequestException('Email already exists');
    }

    // Hash password
    const hash = await argon2.hash(password);

    // Create user + associate
    const user = await this.prisma.resUser.create({
      data: {
        union_id: `user-${Date.now()}`,
        nickname,
        role: 'user',
        associates: {
          create: {
            email,
            provider: 'password',
            hash,
            email_verified: false,
          },
        },
      },
    });

    const tokens = await this.generateTokens(user.id);

    return {
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role,
      },
      ...tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      // Generate new tokens
      return this.generateTokens(payload.sub);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
```

### 5.5. Auth DTOs

#### File: `src/auth/dto/login.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;
}
```

#### File: `src/auth/dto/register.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  nickname: string;
}
```

### 5.6. Auth Controller

#### File: `src/auth/controllers/auth.controller.ts`

```typescript
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email/password' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.nickname,
    );
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }
}
```

### 5.7. Auth Module

#### File: `src/auth/auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { JwtStrategy } from './strategy/jwt.strategy';
import { AccountAuthGuard } from './guards/account-auth.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AccountAuthGuard],
  exports: [AuthService, AccountAuthGuard],
})
export class AuthModule {}
```

---

## ✅ PART 2 Checklist

Trước khi chuyển sang PART 3, verify:

- [ ] **Prisma Module** created and tested
- [ ] **Config Module** with 4 config files
- [ ] **Cache Module** with 2-layer system
  - [ ] Memory Cache Service
  - [ ] Cache Service
  - [ ] Redis connection
  - [ ] Cache TTL constants
- [ ] **Common Module** with utilities
  - [ ] Exception filter
  - [ ] Transform interceptor
  - [ ] Decorators (@CurrentUser, @Public)
- [ ] **Auth Module** complete
  - [ ] JWT Strategy
  - [ ] Auth Guard
  - [ ] Auth Service (login, register, refresh)
  - [ ] Auth Controller
  - [ ] DTOs

**Test các modules**:
```bash
# Build project
yarn build

# Should compile without errors
# Check for any TypeScript errors
```

---

## 📊 Progress Summary

**Completed**:
- ✅ Prisma Module (Database connection)
- ✅ Config Module (Environment configuration)
- ✅ Cache Module (2-layer: Memory + Redis)
- ✅ Common Module (Filters, Interceptors, Decorators)
- ✅ Auth Module (JWT + Login/Register)

**Next Steps** (PART 3):
- 🔄 Monitoring Module (Prometheus metrics)
- 🔄 Cache Warming Service (Auto + Selective)
- 🔄 App Module (Integrate all modules)
- 🔄 Main.ts (Bootstrap application)
- 🔄 Testing & Verification
- 🔄 Docker Setup
- 🔄 Deployment Guide

**Estimated Time**:
- PART 1: ✅ **30-45 minutes** (completed)
- PART 2: ✅ **45-60 minutes** (completed)
- PART 3: 🔄 **45-60 minutes** (next)

**Total**: ~2-3 hours for complete setup

---

**🎯 Tiếp tục với [PART 3: Monitoring, App Setup & Deployment](REBUILD_GUIDE_PART3_FINAL.md)**
