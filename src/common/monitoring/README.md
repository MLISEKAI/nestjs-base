# 🧪 Performance Testing Guide

## 📋 Tổng quan

Guide này hướng dẫn cách test và đo lường hiệu năng hệ thống để xác nhận các optimizations đã cải thiện performance.

## 🛠️ Setup

### 1. **Enable Performance Monitoring**

Performance monitoring đã được tích hợp vào `MonitoringModule`. Module này sẽ tự động log tất cả Prisma queries.

### 2. **Cấu hình Redis**

Đảm bảo Redis đang chạy và cấu hình trong `.env`:

```env
REDIS_URL=redis://localhost:6379
```

### 3. **Start Server**

```bash
npm run start:dev
```

## 📊 Monitoring Endpoints

### 1. **Get Performance Metrics**

```bash
GET http://localhost:3001/performance/metrics
```

**Response:**

```json
{
  "totalQueries": 150,
  "slowQueries": 5,
  "averageQueryTime": 45.5,
  "slowestQuery": {
    "query": "...",
    "duration": 120,
    "model": "ResUser",
    "operation": "findMany"
  },
  "queriesByModel": {
    "ResUser": 50,
    "ResGift": 30,
    "ResMessage": 20
  }
}
```

### 2. **Get Slow Queries**

```bash
GET http://localhost:3001/performance/slow-queries
```

**Response:**

```json
[
  {
    "query": "...",
    "duration": 150,
    "model": "ResGift",
    "operation": "findMany",
    "timestamp": "2025-01-20T10:00:00.000Z"
  }
]
```

### 3. **Get Model Statistics**

```bash
GET http://localhost:3001/performance/model-stats
```

**Response:**

```json
{
  "ResUser": {
    "count": 50,
    "avgDuration": 45.5,
    "maxDuration": 120,
    "minDuration": 10
  },
  "ResGift": {
    "count": 30,
    "avgDuration": 35.2,
    "maxDuration": 80,
    "minDuration": 15
  }
}
```

### 4. **Reset Metrics**

```bash
POST http://localhost:3001/performance/reset
```

## 🧪 Test Scenarios

### Test 1: User Profile với Cache

#### Before (No Cache)

```bash
# Reset metrics
POST http://localhost:3001/performance/reset

# Call API 10 lần
for i in {1..10}; do
  curl http://localhost:3001/profile/{user_id}
done

# Check metrics
GET http://localhost:3001/performance/metrics
```

**Expected:**

- Average query time: ~50-150ms
- Total queries: 10
- No cache hits

#### After (With Cache)

```bash
# Reset metrics
POST http://localhost:3001/performance/reset

# Call API 10 lần (first call sẽ cache)
for i in {1..10}; do
  curl http://localhost:3001/profile/{user_id}
done

# Check metrics
GET http://localhost:3001/performance/metrics
```

**Expected:**

- Average query time: ~5-20ms (với cache)
- Total queries: 1-2 (chỉ query đầu tiên)
- Cache hits: 9

### Test 2: Gift List với Indexes

#### Before (No Indexes)

```bash
# Reset metrics
POST http://localhost:3001/performance/reset

# Query gifts
GET http://localhost:3001/profile/{user_id}/gifts?page=1&limit=20

# Check slow queries
GET http://localhost:3001/performance/slow-queries
```

**Expected:**

- Query time: ~100-300ms
- Possible slow queries trên `receiver_id` filter

#### After (With Indexes)

```bash
# Reset metrics
POST http://localhost:3001/performance/reset

# Query gifts (sau khi có indexes)
GET http://localhost:3001/profile/{user_id}/gifts?page=1&limit=20

# Check slow queries
GET http://localhost:3001/performance/slow-queries
```

**Expected:**

- Query time: ~20-50ms
- No slow queries
- Index được sử dụng (check trong PostgreSQL logs)

### Test 3: N+1 Query Problem

#### Before (N+1 Queries)

```typescript
// ❌ Bad: N+1 queries
const gifts = await prisma.resGift.findMany({ where: { receiver_id: userId } });
for (const gift of gifts) {
  const sender = await prisma.resUser.findUnique({ where: { id: gift.sender_id } });
}
```

**Test:**

```bash
# Reset metrics
POST http://localhost:3001/performance/reset

# Call API với N+1 pattern
GET http://localhost:3001/profile/{user_id}/gifts

# Check metrics
GET http://localhost:3001/performance/metrics
```

**Expected:**

- Total queries: 1 + N (N = số gifts)
- Average query time: High

#### After (Optimized với Include)

```typescript
// ✅ Good: Single query
const gifts = await prisma.resGift.findMany({
  where: { receiver_id: userId },
  include: {
    sender: { select: { id: true, nickname: true, avatar: true } },
  },
});
```

**Test:**

```bash
# Reset metrics
POST http://localhost:3001/performance/reset

# Call optimized API
GET http://localhost:3001/profile/{user_id}/gifts

# Check metrics
GET http://localhost:3001/performance/metrics
```

**Expected:**

- Total queries: 1-2 (join queries)
- Average query time: Lower
- Significant improvement

### Test 4: Pagination Performance

#### Offset-based (Small Dataset)

```bash
# Reset metrics
POST http://localhost:3001/performance/reset

# Test với page 1, 10, 100
GET http://localhost:3001/profile/{user_id}/gifts?page=1&limit=20
GET http://localhost:3001/profile/{user_id}/gifts?page=10&limit=20
GET http://localhost:3001/profile/{user_id}/gifts?page=100&limit=20

# Check metrics
GET http://localhost:3001/performance/metrics
```

**Expected:**

- Page 1: Fast (~20-50ms)
- Page 10: Slightly slower (~30-60ms)
- Page 100: Slower (~50-100ms) - offset lớn hơn

#### Cursor-based (Large Dataset)

```bash
# Reset metrics
POST http://localhost:3001/performance/reset

# Test với cursor pagination
GET http://localhost:3001/profile/{user_id}/gifts?cursor={cursor}&limit=20

# Check metrics
GET http://localhost:3001/performance/metrics
```

**Expected:**

- Consistent performance (~20-50ms) regardless of position
- No degradation with large datasets

## 📈 Benchmark Script

Tạo file `test-performance.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BenchmarkService } from './common/monitoring/benchmark.service';
import { PrismaService } from './prisma/prisma.service';

async function runBenchmarks() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const benchmarkService = app.get(BenchmarkService);
  const prisma = app.get(PrismaService);

  // Get a test user ID
  const user = await prisma.resUser.findFirst();
  if (!user) {
    console.log('No users found. Please create a user first.');
    return;
  }

  const userId = user.id;

  console.log('\n=== Running Performance Benchmarks ===\n');

  // Benchmark 1: User Profile
  const profileResult = await benchmarkService.benchmark(
    'Get User Profile',
    () => prisma.resUser.findUnique({ where: { id: userId } }),
    10,
  );
  console.log('Profile:', profileResult);

  // Benchmark 2: Gifts List
  const giftsResult = await benchmarkService.benchmark(
    'Get Gifts List',
    () =>
      prisma.resGift.findMany({
        where: { receiver_id: userId },
        take: 20,
        include: {
          sender: { select: { id: true, nickname: true, avatar: true } },
        },
      }),
    10,
  );
  console.log('Gifts:', giftsResult);

  // Benchmark 3: With Cache
  const cachedResult = await benchmarkService.benchmarkWithCache(
    'Get User Profile',
    `user:${userId}:profile`,
    () => prisma.resUser.findUnique({ where: { id: userId } }),
  );
  console.log('Cached:', cachedResult);

  await app.close();
}

runBenchmarks();
```

**Run:**

```bash
npx ts-node test-performance.ts
```

## 📊 So sánh Before/After

### Metrics cần theo dõi:

1. **Query Performance**
   - Average query time
   - Slow queries count
   - Queries per request

2. **Cache Performance**
   - Cache hit rate
   - Cache miss penalty
   - Cache invalidation impact

3. **Database Performance**
   - Index usage
   - Query execution time
   - Connection pool usage

4. **API Response Time**
   - End-to-end latency
   - Time to first byte (TTFB)
   - Total request time

### Expected Improvements:

| Metric                | Before    | After    | Improvement      |
| --------------------- | --------- | -------- | ---------------- |
| Average Query Time    | 200-500ms | 50-150ms | 60-70%           |
| With Cache            | N/A       | 5-20ms   | 90-95%           |
| Slow Queries          | 10-20%    | <5%      | 75% reduction    |
| N+1 Queries           | Common    | None     | 100% elimination |
| Pagination (page 100) | 100-200ms | 20-50ms  | 75-80%           |

## 🔍 Debugging Slow Queries

### 1. **Check PostgreSQL Logs**

Enable slow query logging trong PostgreSQL:

```sql
-- Set log_min_duration_statement
ALTER DATABASE your_database SET log_min_duration_statement = 100;

-- Check current setting
SHOW log_min_duration_statement;
```

### 2. **Use EXPLAIN ANALYZE**

```sql
EXPLAIN ANALYZE
SELECT * FROM res_gift
WHERE receiver_id = 'user-id'
ORDER BY created_at DESC
LIMIT 20;
```

**Check:**

- Index usage (Index Scan vs Seq Scan)
- Execution time
- Rows examined vs returned

### 3. **Monitor Index Usage**

```sql
-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

## ✅ Checklist Testing

- [ ] Redis connection working
- [ ] Performance monitoring enabled
- [ ] Test user profile với/không cache
- [ ] Test gift list với indexes
- [ ] Test N+1 query elimination
- [ ] Test pagination performance
- [ ] Compare before/after metrics
- [ ] Check slow queries
- [ ] Verify index usage
- [ ] Monitor cache hit rate

## 🎯 Kết luận

Sau khi chạy các tests:

1. **Xác nhận improvements**: So sánh metrics before/after
2. **Identify bottlenecks**: Check slow queries
3. **Optimize further**: Add more indexes nếu cần
4. **Monitor continuously**: Sử dụng monitoring endpoints trong production

**Target Metrics:**

- ✅ Average query time < 100ms
- ✅ Slow queries < 5%
- ✅ Cache hit rate > 80% (cho cached endpoints)
- ✅ No N+1 queries
- ✅ All queries sử dụng indexes
