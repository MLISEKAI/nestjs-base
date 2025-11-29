# Redis Cache Migration Guide

## Tình trạng hiện tại

Dự án đang có **2 hệ thống cache** song song:

### 1. **CacheModule** (Mới - Recommended) ✅
- **Location**: `src/common/cache/`
- **Service**: `CacheService`
- **Config**: Sử dụng `REDIS_URL` từ environment
- **Features**: 
  - Graceful degradation (không crash khi Redis down)
  - Cache-aside pattern (`getOrSet`)
  - Pattern deletion (`delPattern`)
  - User cache invalidation
  - Better error handling

### 2. **RedisBaseModule** (Cũ - Deprecated) ⚠️
- **Location**: `src/redis/`
- **Service**: `RedisCachingService`
- **Config**: Đã được update để dùng `REDIS_URL`
- **Status**: Deprecated, nên migrate sang CacheModule

---

## Đã sửa gì?

### 1. ✅ `src/common/cache/cache.module.ts`
- Đã dùng `REDIS_URL` từ environment
- Graceful degradation khi Redis không available
- Connection timeout và retry strategy

### 2. ✅ `src/redis/cache.service.ts`
- Thêm connection state tracking
- Graceful degradation (không crash khi Redis down)
- Better error handling
- Thêm `isConnected()` method

### 3. ✅ `src/redis/redis.module.ts` (NEW)
- Module mới cho RedisCachingService
- Sử dụng `REDIS_URL` giống CacheModule
- Cấu hình connection giống nhau

---

## Cấu hình Redis URL

### Environment Variables

```bash
# .env
REDIS_URL=redis://localhost:6379

# Hoặc với password
REDIS_URL=redis://:password@localhost:6379

# Hoặc Redis Cloud
REDIS_URL=redis://username:password@redis-cloud.com:6379
```

### Docker Compose

```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD:-redis_password}
    ports:
      - '6379:6379'

  app:
    environment:
      REDIS_URL: redis://:${REDIS_PASSWORD:-redis_password}@redis:6379
```

---

## API Comparison

### Old API (RedisCachingService) ⚠️

```typescript
import { RedisCachingService } from 'src/redis/cache.service';

constructor(private readonly redisCachingService: RedisCachingService) {}

// Set item
await this.redisCachingService.setItem('key', value, 3600);

// Get item
const data = await this.redisCachingService.getItem<Type>('key');

// Remove item
await this.redisCachingService.removeItem('key');

// Check connection
const isConnected = this.redisCachingService.isConnected();
```

### New API (CacheService) ✅

```typescript
import { CacheService } from 'src/common/cache/cache.service';

constructor(private readonly cacheService: CacheService) {}

// Set item
await this.cacheService.set('key', value, 3600);

// Get item
const data = await this.cacheService.get<Type>('key');

// Remove item
await this.cacheService.del('key');

// Cache-aside pattern (RECOMMENDED)
const data = await this.cacheService.getOrSet(
  'key',
  async () => {
    // Fetch from database
    return await this.fetchFromDB();
  },
  3600
);

// Delete pattern
await this.cacheService.delPattern('user:123:*');

// Invalidate user cache
await this.cacheService.invalidateUserCache('user_id');

// Check if exists
const exists = await this.cacheService.exists('key');
```

---

## Migration Steps

### Step 1: Update imports

```typescript
// BEFORE
import { RedisCachingService } from 'src/redis/cache.service';

// AFTER
import { CacheService } from 'src/common/cache/cache.service';
```

### Step 2: Update constructor

```typescript
// BEFORE
constructor(
  private readonly redisCachingService: RedisCachingService,
) {}

// AFTER
constructor(
  private readonly cacheService: CacheService,
) {}
```

### Step 3: Update method calls

```typescript
// BEFORE
await this.redisCachingService.setItem('key', value, 3600);
const data = await this.redisCachingService.getItem('key');
await this.redisCachingService.removeItem('key');

// AFTER
await this.cacheService.set('key', value, 3600);
const data = await this.cacheService.get('key');
await this.cacheService.del('key');
```

### Step 4: Use cache-aside pattern (RECOMMENDED)

```typescript
// BEFORE - Manual cache check
async getTrendingGifs() {
  const cached = await this.redisCachingService.getItem('giphy:trending');
  if (cached) {
    return cached;
  }
  
  const data = await this.fetchFromAPI();
  await this.redisCachingService.setItem('giphy:trending', data, 3600);
  return data;
}

// AFTER - Cache-aside pattern
async getTrendingGifs() {
  return this.cacheService.getOrSet(
    'giphy:trending',
    () => this.fetchFromAPI(),
    3600
  );
}
```

---

## Migration Examples

### Example 1: User Service

```typescript
// src/modules/users/user.service.ts

// BEFORE
import { RedisCachingService } from 'src/redis/cache.service';

@Injectable()
export class ResUserService {
  constructor(
    private cachingManager: RedisCachingService,
    private prismaService: PrismaService,
  ) {}

  async getUserProfile(userId: string) {
    const cacheKey = `user:${userId}:profile`;
    const cached = await this.cachingManager.getItem(cacheKey);
    if (cached) return cached;

    const profile = await this.prismaService.user.findUnique({
      where: { id: userId }
    });

    await this.cachingManager.setItem(cacheKey, profile, 3600);
    return profile;
  }
}

// AFTER
import { CacheService } from 'src/common/cache/cache.service';

@Injectable()
export class ResUserService {
  constructor(
    private cacheService: CacheService,
    private prismaService: PrismaService,
  ) {}

  async getUserProfile(userId: string) {
    return this.cacheService.getOrSet(
      `user:${userId}:profile`,
      () => this.prismaService.user.findUnique({
        where: { id: userId }
      }),
      3600
    );
  }

  // Invalidate cache when user updates profile
  async updateProfile(userId: string, data: any) {
    await this.prismaService.user.update({
      where: { id: userId },
      data
    });
    
    // Invalidate all user cache
    await this.cacheService.invalidateUserCache(userId);
  }
}
```

### Example 2: Giphy Service

```typescript
// src/apim/services/giphy.service.ts

// BEFORE
import { RedisCachingService } from 'src/redis/cache.service';

@Injectable()
export class GiphyService {
  constructor(
    private readonly redisCachingService: RedisCachingService,
  ) {}

  async getTrending() {
    const cached = await this.redisCachingService.getItem('giphy:trending');
    if (cached) return cached;

    const data = await this.fetchFromGiphyAPI();
    await this.redisCachingService.setItem('giphy:trending', data, 3600);
    return data;
  }
}

// AFTER
import { CacheService } from 'src/common/cache/cache.service';

@Injectable()
export class GiphyService {
  constructor(
    private readonly cacheService: CacheService,
  ) {}

  async getTrending() {
    return this.cacheService.getOrSet(
      'giphy:trending',
      () => this.fetchFromGiphyAPI(),
      3600
    );
  }
}
```

---

## Files cần migrate

### Priority 1 (High usage)
1. ✅ `src/modules/users/user.service.ts` - User caching
2. ⏳ `src/apim/services/giphy.service.ts` - Giphy API caching
3. ⏳ `src/apim/services/be-admin.service.ts` - Admin API caching

### Priority 2 (Low usage)
- Các services khác đang dùng `RedisCachingService`

---

## Testing

### Test Redis connection

```typescript
// Test với CacheService
import { CacheService } from 'src/common/cache/cache.service';

@Injectable()
export class TestService {
  constructor(private cacheService: CacheService) {}

  async testCache() {
    // Set
    await this.cacheService.set('test:key', { hello: 'world' }, 60);
    
    // Get
    const data = await this.cacheService.get('test:key');
    console.log('Cached data:', data);
    
    // Delete
    await this.cacheService.del('test:key');
    
    // Check exists
    const exists = await this.cacheService.exists('test:key');
    console.log('Exists:', exists); // false
  }
}
```

### Test graceful degradation

```bash
# Stop Redis
docker-compose stop redis

# App should still work (cache disabled)
yarn start:dev

# Start Redis
docker-compose start redis

# Cache should work again
```

---

## Rollback Plan

Nếu cần rollback:

### Option 1: Keep both modules (Current state)
- Giữ nguyên cả `RedisBaseModule` và `CacheModule`
- Services cũ vẫn dùng `RedisCachingService`
- Services mới dùng `CacheService`

### Option 2: Use adapter
- Dùng `src/redis/cache.adapter.ts`
- Adapter sẽ wrap `CacheService` với API cũ
- Không cần thay đổi code

```typescript
// src/redis/cache.adapter.ts
import { Injectable } from '@nestjs/common';
import { CacheService } from 'src/common/cache/cache.service';

@Injectable()
export class RedisCachingService {
  constructor(private readonly cacheService: CacheService) {}

  async setItem(key: string, value: any, seconds?: number) {
    return this.cacheService.set(key, value, seconds);
  }

  async getItem<T>(key: string): Promise<T | undefined> {
    return this.cacheService.get<T>(key);
  }

  async removeItem(key: string) {
    return this.cacheService.del(key);
  }
}
```

---

## Cleanup (After migration)

Sau khi migrate xong tất cả services:

### 1. Remove old module
```typescript
// src/app.module.ts
// Remove this line:
// RedisBaseModule,
```

### 2. Delete old files
```bash
rm src/redis/redis-base.module.ts
rm src/redis/cache.service.ts
rm src/redis/cache.adapter.ts
```

### 3. Keep only CacheModule
```typescript
// src/app.module.ts
@Module({
  imports: [
    CacheModule, // Only this one
    // ... other modules
  ],
})
export class AppModule {}
```

---

## Benefits of Migration

### 1. Better API
- ✅ Simpler method names (`set`, `get`, `del`)
- ✅ Cache-aside pattern built-in (`getOrSet`)
- ✅ Pattern deletion (`delPattern`)
- ✅ User cache invalidation

### 2. Better Error Handling
- ✅ Graceful degradation (app works without Redis)
- ✅ No crash when Redis is down
- ✅ Better logging

### 3. Better Performance
- ✅ Connection pooling
- ✅ Lazy connect
- ✅ Optimized retry strategy

### 4. Maintainability
- ✅ Single source of truth
- ✅ Consistent API across codebase
- ✅ Easier to test

---

## Support

Nếu gặp vấn đề:
1. Check Redis connection: `docker-compose ps redis`
2. Check Redis logs: `docker-compose logs redis`
3. Check app logs: `yarn start:dev`
4. Test Redis manually: `redis-cli ping`

---

## Checklist

- [x] Update `src/common/cache/cache.module.ts` to use REDIS_URL
- [x] Update `src/redis/cache.service.ts` with graceful degradation
- [x] Create `src/redis/redis.module.ts` for legacy support
- [ ] Migrate `src/modules/users/user.service.ts`
- [ ] Migrate `src/apim/services/giphy.service.ts`
- [ ] Migrate `src/apim/services/be-admin.service.ts`
- [ ] Test all services
- [ ] Remove `RedisBaseModule` from `app.module.ts`
- [ ] Delete old files
- [ ] Update documentation

---

## Timeline

- **Week 1**: Migrate high-priority services (users, giphy)
- **Week 2**: Migrate remaining services
- **Week 3**: Testing and cleanup
- **Week 4**: Remove old module and files
