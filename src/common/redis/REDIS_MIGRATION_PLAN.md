# Redis Migration Plan - Từ src/redis sang src/common/cache

## Tình trạng hiện tại

### 1. src/redis/ (Implementation cũ)
**Files:**
- `redis-base.module.ts` - Module cấu hình Redis
- `cache.service.ts` - RedisCachingService
- `dto/cache.dto.ts` - DTOs

**Đang được sử dụng bởi:**
- `src/apim/services/giphy.service.ts`
- `src/apim/services/be-admin.service.ts`

**Vấn đề:**
- ❌ Không handle Redis connection errors gracefully
- ❌ Sẽ crash app nếu Redis down
- ❌ Ít features (không có cache-aside pattern, invalidation, etc.)
- ❌ Cấu hình phức tạp (REDIS_HOST, REDIS_PORT, REDIS_PASSWORD riêng lẻ)

### 2. src/common/cache/ (Implementation mới)
**Files:**
- `cache.module.ts` - Global cache module
- `cache.service.ts` - CacheService với nhiều features
- `decorators/cache.decorator.ts` - Decorators
- `interceptors/cache.interceptor.ts` - Interceptors

**Features:**
- ✅ Graceful degradation - App vẫn chạy khi Redis down
- ✅ Better error handling
- ✅ Cache-aside pattern (`getOrSet`)
- ✅ Pattern-based invalidation (`delPattern`)
- ✅ User cache invalidation
- ✅ Global module - Không cần import
- ✅ Cấu hình đơn giản (chỉ cần REDIS_URL)
- ✅ Connection status tracking
- ✅ Decorators và Interceptors

---

## So sánh API

### src/redis/cache.service.ts (CŨ)
```typescript
class RedisCachingService {
  setItem(key, value, seconds?)
  getItem<T>(key): Promise<T | undefined>
  removeItem(key)
  getClient(): Redis
}
```

### src/common/cache/cache.service.ts (MỚI)
```typescript
class CacheService {
  // Basic operations
  get<T>(key): Promise<T | null>
  set(key, value, ttl?)
  del(key)
  exists(key): Promise<boolean>
  
  // Advanced operations
  getOrSet<T>(key, fetchFn, ttl?): Promise<T>  // Cache-aside pattern
  delPattern(pattern)                           // Xóa nhiều keys
  invalidateUserCache(user_id)                  // Invalidate user cache
  flushAll()                                    // Xóa tất cả cache
}
```

---

## Migration Steps

### Step 1: Tạo adapter để tương thích ngược
Tạo file `src/redis/cache.adapter.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { CacheService } from 'src/common/cache/cache.service';
import { KeyCachingSystem, CacheInterface } from './dto/cache.dto';

/**
 * Adapter để migrate từ RedisCachingService sang CacheService
 * Giữ nguyên API cũ nhưng sử dụng implementation mới
 */
@Injectable()
export class RedisCachingService {
  constructor(private readonly cacheService: CacheService) {}

  async setItem(key: KeyCachingSystem, value: any, seconds?: number): Promise<void> {
    const prefixedKey = `${process.env.NODE_ENV}:${key}`;
    await this.cacheService.set(prefixedKey, value, seconds);
  }

  async getItem<T extends CacheInterface | any>(key: KeyCachingSystem): Promise<T | undefined> {
    const prefixedKey = `${process.env.NODE_ENV}:${key}`;
    const result = await this.cacheService.get<T>(prefixedKey);
    return result ?? undefined;
  }

  async removeItem(key: KeyCachingSystem): Promise<any> {
    const prefixedKey = `${process.env.NODE_ENV}:${key}`;
    await this.cacheService.del(prefixedKey);
  }

  getClient() {
    // Deprecated - không nên expose Redis client trực tiếp
    throw new Error('getClient() is deprecated. Use CacheService methods instead.');
  }
}
```

### Step 2: Update redis-base.module.ts
```typescript
import { Module, Global } from '@nestjs/common';
import { CacheModule } from 'src/common/cache/cache.module';
import { RedisCachingService } from './cache.adapter';

/**
 * @deprecated Use CacheModule from src/common/cache instead
 * This module is kept for backward compatibility
 */
@Global()
@Module({
  imports: [CacheModule],
  providers: [RedisCachingService],
  exports: [RedisCachingService],
})
export class RedisBaseModule {}
```

### Step 3: Update app.module.ts
```typescript
// TRƯỚC
import { RedisBaseModule } from './redis/redis-base.module';

@Module({
  imports: [
    RedisBaseModule,  // ❌ Cũ
    // ...
  ],
})

// SAU
import { CacheModule } from './common/cache/cache.module';

@Module({
  imports: [
    CacheModule,  // ✅ Mới
    // ...
  ],
})
```

### Step 4: Migrate services dần dần

#### Option A: Giữ nguyên code (dùng adapter)
Không cần thay đổi gì, adapter sẽ handle:
```typescript
// giphy.service.ts - KHÔNG CẦN THAY ĐỔI
import { RedisCachingService } from 'src/redis/cache.service';

constructor(private readonly redisCachingService: RedisCachingService) {}

// Code vẫn hoạt động bình thường
await this.redisCachingService.setItem('key', 'value', 3600);
```

#### Option B: Migrate sang API mới (khuyến nghị)
```typescript
// giphy.service.ts - MIGRATE
import { CacheService } from 'src/common/cache/cache.service';

constructor(private readonly cacheService: CacheService) {}

// TRƯỚC
await this.redisCachingService.setItem('giphy:trending', data, 3600);
const cached = await this.redisCachingService.getItem('giphy:trending');

// SAU - Đơn giản hơn
await this.cacheService.set('giphy:trending', data, 3600);
const cached = await this.cacheService.get('giphy:trending');

// HOẶC dùng cache-aside pattern (TỐT NHẤT)
const data = await this.cacheService.getOrSet(
  'giphy:trending',
  () => this.fetchFromGiphy(),
  3600
);
```

---

## Migration Checklist

### Phase 1: Setup (Ngay lập tức)
- [ ] Tạo `src/redis/cache.adapter.ts`
- [ ] Update `src/redis/redis-base.module.ts` để import CacheModule
- [ ] Test app vẫn chạy bình thường
- [ ] Verify Redis connection works

### Phase 2: Migrate Services (Dần dần)
- [ ] Migrate `giphy.service.ts`
  - [ ] Replace import
  - [ ] Update constructor
  - [ ] Update method calls
  - [ ] Test functionality
- [ ] Migrate `be-admin.service.ts`
  - [ ] Replace import
  - [ ] Update constructor
  - [ ] Update method calls
  - [ ] Test functionality
- [ ] Search và migrate các services khác (nếu có)

### Phase 3: Cleanup (Sau khi migrate xong)
- [ ] Xóa `src/redis/cache.service.ts` (file cũ)
- [ ] Xóa `src/redis/redis-base.module.ts`
- [ ] Xóa `src/redis/cache.adapter.ts`
- [ ] Xóa `src/redis/dto/cache.dto.ts` (nếu không dùng)
- [ ] Xóa folder `src/redis/` (nếu trống)
- [ ] Update imports trong các files còn lại

---

## Testing Plan

### 1. Test với Redis running
```bash
# Start Redis
docker-compose up -d redis

# Test app
yarn start:dev

# Test cache operations
curl http://localhost:3001/api/giphy/trending
# Lần 1: Fetch từ API (slow)
# Lần 2: Từ cache (fast)
```

### 2. Test với Redis down (Graceful degradation)
```bash
# Stop Redis
docker-compose stop redis

# Test app vẫn chạy
yarn start:dev

# App vẫn hoạt động, chỉ không có cache
curl http://localhost:3001/api/giphy/trending
# Vẫn trả về data, chỉ không cache
```

### 3. Test reconnection
```bash
# Start Redis lại
docker-compose start redis

# App tự động reconnect và cache hoạt động trở lại
```

---

## Environment Variables

### TRƯỚC (src/redis/)
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password
```

### SAU (src/common/cache/)
```env
# Đơn giản hơn - chỉ cần 1 biến
REDIS_URL=redis://:redis_password@localhost:6379

# Hoặc không có password
REDIS_URL=redis://localhost:6379

# Hoặc Redis Cloud
REDIS_URL=redis://username:password@redis-cloud.com:12345
```

---

## Benefits của Migration

### 1. Reliability
- ✅ App không crash khi Redis down
- ✅ Graceful degradation
- ✅ Better error handling

### 2. Developer Experience
- ✅ Đơn giản hơn (1 biến env thay vì 3)
- ✅ Global module - không cần import
- ✅ Type-safe với TypeScript
- ✅ Better API với cache-aside pattern

### 3. Features
- ✅ Cache-aside pattern (`getOrSet`)
- ✅ Pattern-based invalidation
- ✅ User cache invalidation
- ✅ Decorators và Interceptors
- ✅ Connection status tracking

### 4. Maintainability
- ✅ Một implementation duy nhất
- ✅ Dễ test hơn
- ✅ Dễ extend thêm features

---

## Rollback Plan

Nếu có vấn đề, rollback dễ dàng:

1. Revert `app.module.ts`:
```typescript
// Rollback to RedisBaseModule
import { RedisBaseModule } from './redis/redis-base.module';
```

2. Revert service imports:
```typescript
// Rollback to RedisCachingService
import { RedisCachingService } from 'src/redis/cache.service';
```

3. Restart app

---

## Timeline

### Week 1: Setup & Testing
- Tạo adapter
- Update modules
- Test thoroughly

### Week 2: Migrate Services
- Migrate giphy.service.ts
- Migrate be-admin.service.ts
- Test each service

### Week 3: Cleanup
- Remove old code
- Update documentation
- Final testing

---

## Recommendation

**Nên dùng: `src/common/cache/`**

**Lý do:**
1. ✅ Implementation tốt hơn nhiều
2. ✅ Graceful degradation
3. ✅ Nhiều features hơn
4. ✅ Dễ maintain hơn
5. ✅ Global module
6. ✅ Better error handling

**Action Items:**
1. Tạo adapter để backward compatible
2. Migrate services dần dần
3. Test kỹ
4. Cleanup code cũ

---

## Support

Nếu cần hỗ trợ migration:
1. Check logs để debug
2. Test với Redis up/down
3. Verify cache hit/miss
4. Monitor performance
