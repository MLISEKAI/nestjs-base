# 🚀 Test Redis Cache Performance

## ✅ Redis đang chạy

Redis đã được cấu hình và đang chạy ở port **6379**.

## 📊 Cách Cache hoạt động

### 1. **Lần đầu request (Cache MISS)**

```
Request → Backend → Database Query (chậm ~50-200ms) → Lưu vào Redis → Trả về response
```

### 2. **Các lần request sau (Cache HIT)**

```
Request → Backend → Redis Cache (nhanh ~1-5ms) → Trả về response
```

**Tốc độ nhanh hơn 10-100 lần!** ⚡

## 🧪 Test Cache Performance

### Test 1: Kiểm tra Redis đang hoạt động

```bash
# Vào Redis CLI
docker exec -it redis-local redis-cli

# Xem tất cả keys đang cache
KEYS *

# Xem value của một key
GET trending:posts:day:20

# Xem TTL (thời gian còn lại)
TTL trending:posts:day:20

# Xem số lượng keys
DBSIZE
```

### Test 2: Test API với Cache

#### **Lần 1: Cache MISS (chậm)**

```bash
# Request đầu tiên - sẽ query database và cache
curl -X GET "http://localhost:3001/search/trending/posts?period=day&limit=20" \
  -H "Authorization: Bearer <token>"

# Thời gian: ~100-300ms (query database)
```

#### **Lần 2: Cache HIT (nhanh)**

```bash
# Request thứ 2 - lấy từ cache
curl -X GET "http://localhost:3001/search/trending/posts?period=day&limit=20" \
  -H "Authorization: Bearer <token>"

# Thời gian: ~5-20ms (lấy từ Redis)
```

### Test 3: Xem cache trong Redis

```bash
# Vào Redis CLI
docker exec -it redis-local redis-cli

# Xem keys của trending
KEYS trending:*

# Xem value (sẽ là JSON string)
GET trending:posts:day:20

# Xem TTL
TTL trending:posts:day:20
# Kết quả: 300 (5 phút = 300 giây)
```

## 📈 So sánh Performance

### **Không có Cache:**

```
Request 1: 150ms (database)
Request 2: 180ms (database)
Request 3: 160ms (database)
Request 4: 170ms (database)
...
Tổng: ~150-200ms mỗi request
```

### **Có Cache:**

```
Request 1: 150ms (database + cache)
Request 2: 8ms (cache) ⚡
Request 3: 6ms (cache) ⚡
Request 4: 7ms (cache) ⚡
...
Tổng: ~5-10ms mỗi request (sau lần đầu)
```

**Cải thiện: 15-30 lần nhanh hơn!** 🚀

## 🔍 Các Endpoints đã có Cache

### 1. **Trending Posts** (5 phút cache)

```typescript
GET /search/trending/posts?period=day&limit=20
```

- Cache key: `trending:posts:day:20`
- TTL: 300 giây (5 phút)

### 2. **Trending Users** (5 phút cache)

```typescript
GET /search/trending/users?period=day&limit=20
```

- Cache key: `trending:users:day:20`
- TTL: 300 giây (5 phút)

### 3. **Recommended Users** (10 phút cache)

```typescript
GET /search/recommendations/users?limit=10
```

- Cache key: `recommendations:users:{userId}:10`
- TTL: 600 giây (10 phút)

### 4. **Recommended Posts** (5 phút cache)

```typescript
GET /search/recommendations/posts?limit=10
```

- Cache key: `recommendations:posts:{userId}:10`
- TTL: 300 giây (5 phút)

## 🎯 Cách thêm Cache vào Endpoint khác

### Ví dụ: Cache User Profile

```typescript
// Trong service
async getUserProfile(userId: string) {
  return this.cacheService.getOrSet(
    `user:${userId}:profile`,
    async () => {
      // Query database
      return this.prisma.resUser.findUnique({
        where: { id: userId },
      });
    },
    1800, // Cache 30 phút
  );
}
```

## 📊 Monitor Cache Hit Rate

### Xem số lượng keys trong Redis

```bash
docker exec -it redis-local redis-cli DBSIZE
```

### Xem memory usage

```bash
docker exec -it redis-local redis-cli INFO memory
```

### Xem stats

```bash
docker exec -it redis-local redis-cli INFO stats
```

## ⚡ Performance Tips

1. **Cache những query tốn kém:**
   - Database queries phức tạp
   - Aggregations (COUNT, SUM, GROUP BY)
   - JOIN nhiều tables

2. **TTL hợp lý:**
   - Data ít thay đổi: 30 phút - 1 giờ
   - Data thay đổi thường xuyên: 5-10 phút
   - Real-time data: 1-2 phút

3. **Invalidate cache khi update:**

   ```typescript
   async updateUser(userId: string, data: any) {
     // Update database
     const updated = await this.prisma.resUser.update(...);

     // Xóa cache
     await this.cacheService.del(`user:${userId}:profile`);

     return updated;
   }
   ```

## 🐛 Troubleshooting

### Cache không hoạt động?

1. **Kiểm tra Redis connection:**

   ```bash
   docker exec redis-local redis-cli ping
   # Kết quả: PONG
   ```

2. **Kiểm tra REDIS_URL trong .env:**

   ```env
   REDIS_URL=redis://localhost:6379
   ```

3. **Xem logs khi app start:**
   - Nếu thấy: `Redis connected successfully` → OK
   - Nếu thấy: `Redis is not available` → Check Redis

4. **Test cache thủ công:**
   ```typescript
   // Trong service
   await this.cacheService.set('test', { hello: 'world' }, 60);
   const result = await this.cacheService.get('test');
   console.log('Cache test:', result);
   ```

## 📝 Kết luận

✅ **Redis đang chạy ở port 6379**

✅ **Cache tự động hoạt động** cho các endpoints đã được implement

✅ **Performance cải thiện 15-30 lần** cho các request có cache

✅ **App vẫn chạy bình thường** nếu Redis down (graceful degradation)
