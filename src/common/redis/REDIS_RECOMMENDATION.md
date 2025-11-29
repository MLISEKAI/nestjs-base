# Redis Implementation - Khuyến nghị sử dụng

## ✅ Kết luận: Nên dùng `src/common/cache/`

Bạn có 2 implementations Redis:
1. **`src/redis/`** - Implementation cũ, đơn giản
2. **`src/common/cache/`** - Implementation mới, tốt hơn nhiều

---

## So sánh chi tiết

### 1. src/redis/ (CŨ - KHÔNG KHUYẾN NGHỊ)

#### Ưu điểm:
- ✅ Đơn giản, dễ hiểu
- ✅ Đang được sử dụng bởi một số services

#### Nhược điểm:
- ❌ **Crash app khi Redis down** - Không có error handling
- ❌ Ít features (chỉ có get/set/delete cơ bản)
- ❌ Không có cache-aside pattern
- ❌ Không có pattern-based invalidation
- ❌ Cấu hình phức tạp (3 biến env: HOST, PORT, PASSWORD)
- ❌ Không phải global module
- ❌ Expose Redis client trực tiếp (không an toàn)

#### API:
```typescript
class RedisCachingService {
  setItem(key, value, seconds?)
  getItem<T>(key): Promise<T | undefined>
  removeItem(key)
  getClient(): Redis  // ❌ Expose Redis client
}
```

#### Cấu hình:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password
```

---

### 2. src/common/cache/ (MỚI - KHUYẾN NGHỊ ✅)

#### Ưu điểm:
- ✅ **Graceful degradation** - App vẫn chạy khi Redis down
- ✅ **Better error handling** - Không crash, chỉ log warning
- ✅ **Cache-aside pattern** - `getOrSet()` method
- ✅ **Pattern-based invalidation** - Xóa nhiều keys cùng lúc
- ✅ **User cache invalidation** - Xóa tất cả cache của user
- ✅ **Global module** - Không cần import ở mọi nơi
- ✅ **Connection tracking** - Biết Redis có đang connected không
- ✅ **Decorators & Interceptors** - Có sẵn để dùng
- ✅ **Cấu hình đơn giản** - Chỉ 1 biến env (REDIS_URL)
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Well documented** - Comments đầy đủ

#### API:
```typescript
class CacheService {
  // Basic operations
  get<T>(key): Promise<T | null>
  set(key, value, ttl?)
  del(key)
  exists(key): Promise<boolean>
  
  // Advanced operations
  getOrSet<T>(key, fetchFn, ttl?): Promise<T>  // ⭐ Cache-aside pattern
  delPattern(pattern)                           // ⭐ Xóa nhiều keys
  invalidateUserCache(user_id)                  // ⭐ Invalidate user cache
  flushAll()                                    // Xóa tất cả cache
}
```

#### Cấu hình:
```env
# Đơn giản - chỉ 1 biến
REDIS_URL=redis://:redis_password@localhost:6379
```

---

## Migration đã hoàn thành

### ✅ Đã tạo Adapter
File `src/redis/cache.adapter.ts` đã được tạo để:
- Giữ nguyên API cũ (backward compatible)
- Sử dụng CacheService mới bên trong
- Cho phép migrate dần dần

### ✅ Đã update RedisBaseModule
File `src/redis/redis-base.module.ts` đã được update để:
- Import CacheModule thay vì RedisModule
- Sử dụng adapter
- Thêm deprecation warnings

### ✅ Code hiện tại vẫn hoạt động
- Các services đang dùng `RedisCachingService` vẫn chạy bình thường
- Không có breaking changes
- Có thể migrate dần dần

---

## Cách sử dụng

### Option 1: Giữ nguyên code (Tạm thời)
Không cần thay đổi gì, adapter sẽ handle:

```typescript
// giphy.service.ts - KHÔNG CẦN THAY ĐỔI
import { RedisCachingService } from 'src/redis/cache.service';

constructor(private readonly redisCachingService: RedisCachingService) {}

// Code vẫn hoạt động
await this.redisCachingService.setItem('key', 'value', 3600);
const data = await this.redisCachingService.getItem('key');
```

### Option 2: Migrate sang API mới (KHUYẾN NGHỊ ✅)

#### Bước 1: Update import
```typescript
// TRƯỚC
import { RedisCachingService } from 'src/redis/cache.service';

// SAU
import { CacheService } from 'src/common/cache/cache.service';
```

#### Bước 2: Update constructor
```typescript
// TRƯỚC
constructor(private readonly redisCachingService: RedisCachingService) {}

// SAU
constructor(private readonly cacheService: CacheService) {}
```

#### Bước 3: Update method calls
```typescript
// TRƯỚC
await this.redisCachingService.setItem('giphy:trending', data, 3600);
const cached = await this.redisCachingService.getItem('giphy:trending');
await this.redisCachingService.removeItem('giphy:trending');

// SAU - Basic API
await this.cacheService.set('giphy:trending', data, 3600);
const cached = await this.cacheService.get('giphy:trending');
await this.cacheService.del('giphy:trending');

// HOẶC - Cache-aside pattern (TỐT NHẤT ⭐)
const data = await this.cacheService.getOrSet(
  'giphy:trending',
  () => this.fetchFromGiphy(), // Chỉ gọi khi cache miss
  3600
);
```

---

## Ví dụ thực tế

### Ví dụ 1: Cache API response

#### Cách cũ (nhiều code hơn):
```typescript
async getTrendingGifs() {
  // Check cache
  const cached = await this.redisCachingService.getItem('giphy:trending');
  if (cached) {
    return cached;
  }
  
  // Fetch from API
  const data = await this.fetchFromGiphy();
  
  // Save to cache
  await this.redisCachingService.setItem('giphy:trending', data, 3600);
  
  return data;
}
```

#### Cách mới (ngắn gọn hơn):
```typescript
async getTrendingGifs() {
  return this.cacheService.getOrSet(
    'giphy:trending',
    () => this.fetchFromGiphy(),
    3600
  );
}
```

### Ví dụ 2: Invalidate cache khi update

#### Cách cũ:
```typescript
async updateUserProfile(userId: string, data: any) {
  await this.prisma.user.update({ where: { id: userId }, data });
  
  // Phải xóa từng key một
  await this.redisCachingService.removeItem(`user:${userId}:profile`);
  await this.redisCachingService.removeItem(`user:${userId}:settings`);
  await this.redisCachingService.removeItem(`user:${userId}:posts`);
  // ... nhiều keys khác
}
```

#### Cách mới:
```typescript
async updateUserProfile(userId: string, data: any) {
  await this.prisma.user.update({ where: { id: userId }, data });
  
  // Xóa tất cả cache của user trong 1 dòng
  await this.cacheService.invalidateUserCache(userId);
}
```

### Ví dụ 3: Xóa cache theo pattern

#### Cách cũ:
```typescript
// Không có cách nào dễ dàng để xóa nhiều keys
// Phải list tất cả keys rồi xóa từng cái
```

#### Cách mới:
```typescript
// Xóa tất cả cache của posts
await this.cacheService.delPattern('posts:*');

// Xóa tất cả cache của user 123
await this.cacheService.delPattern('user:123:*');

// Xóa tất cả cache notifications
await this.cacheService.delPattern('notifications:*');
```

---

## Environment Variables

### Update .env file:

```env
# OLD - Xóa các dòng này
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_PASSWORD=redis_password

# NEW - Thêm dòng này
REDIS_URL=redis://:redis_password@localhost:6379

# Hoặc không có password
REDIS_URL=redis://localhost:6379

# Hoặc Redis Cloud
REDIS_URL=redis://username:password@redis-cloud.com:12345
```

---

## Testing

### Test 1: Redis running (Normal operation)
```bash
# Start Redis
docker-compose up -d redis

# Start app
yarn start:dev

# Test cache
curl http://localhost:3001/api/test
# Lần 1: Slow (fetch from DB)
# Lần 2: Fast (from cache)
```

### Test 2: Redis down (Graceful degradation)
```bash
# Stop Redis
docker-compose stop redis

# App vẫn chạy bình thường
yarn start:dev

# Test API vẫn hoạt động
curl http://localhost:3001/api/test
# Vẫn trả về data, chỉ không cache
# Không crash app ✅
```

### Test 3: Redis reconnect
```bash
# Start Redis lại
docker-compose start redis

# App tự động reconnect
# Cache hoạt động trở lại
```

---

## Migration Checklist

### Immediate (Đã hoàn thành ✅)
- [x] Tạo adapter `src/redis/cache.adapter.ts`
- [x] Update `src/redis/redis-base.module.ts`
- [x] Backup file cũ `cache.service.ts.backup`
- [x] Test app vẫn chạy bình thường

### Short-term (Làm trong 1-2 tuần)
- [ ] Update `.env` file (thêm REDIS_URL)
- [ ] Migrate `giphy.service.ts` sang CacheService
- [ ] Migrate `be-admin.service.ts` sang CacheService
- [ ] Test thoroughly

### Long-term (Sau khi migrate xong)
- [ ] Xóa `src/redis/cache.service.ts.backup`
- [ ] Xóa `src/redis/cache.adapter.ts`
- [ ] Xóa `src/redis/redis-base.module.ts`
- [ ] Xóa folder `src/redis/` (nếu trống)
- [ ] Update documentation

---

## Khuyến nghị cuối cùng

### ✅ NÊN:
1. **Sử dụng `src/common/cache/CacheService`** cho tất cả code mới
2. **Migrate dần dần** các services cũ sang CacheService
3. **Sử dụng cache-aside pattern** (`getOrSet`) thay vì get/set riêng lẻ
4. **Sử dụng pattern-based invalidation** để xóa nhiều keys
5. **Test với Redis down** để đảm bảo graceful degradation

### ❌ KHÔNG NÊN:
1. Tiếp tục sử dụng `RedisCachingService` cho code mới
2. Expose Redis client trực tiếp
3. Hardcode Redis connection trong services
4. Bỏ qua error handling

---

## Support

Nếu cần hỗ trợ:
1. Đọc comments trong `src/common/cache/cache.service.ts`
2. Xem examples trong file này
3. Check logs khi có lỗi
4. Test với Redis up/down

---

## Tài liệu tham khảo

- `REDIS_MIGRATION_PLAN.md` - Chi tiết migration plan
- `src/common/cache/cache.service.ts` - Implementation mới
- `src/redis/cache.adapter.ts` - Adapter để backward compatible
- `docker-compose.yml` - Redis configuration
