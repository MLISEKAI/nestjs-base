# Kế hoạch Tối ưu Hiệu suất NestJS API (4s → <500ms)

## 🔍 Phân tích Hiện trạng

### Các vấn đề tiềm ẩn đã phát hiện:

1. **Database Connection Pool** - Prisma chưa được config connection pool
2. **Redis Cache** - Đã có module nhưng chưa được sử dụng (Redis bị comment trong .env)
3. **N+1 Query Problem** - Schema có nhiều relations, dễ gây N+1 queries
4. **Global Interceptors** - ResponseInterceptor và PostStatusInterceptor chạy trên mọi request
5. **Validation Pipes** - SanitizeInputPipe + ValidationPipe chạy trên mọi request
6. **Swagger** - Đang chạy trong dev mode, có thể ảnh hưởng startup time
7. **Logger** - Winston logger có thể chậm nếu log quá nhiều
8. **Throttler** - Rate limiting check trên mọi request

---

## 🎯 Giải pháp Tối ưu (Ưu tiên cao → thấp)

### **PHASE 1: Quick Wins (Giảm 50-70% thời gian)**

#### 1.1. Tối ưu Prisma Connection Pool
**Vấn đề**: Prisma mặc định tạo connection mới cho mỗi query
**Giải pháp**: Config connection pool trong DATABASE_URL

```env
# Thay đổi DATABASE_URL
DATABASE_URL="postgresql://user:pass@host/db?connection_limit=10&pool_timeout=20&connect_timeout=10"
```

**Hoặc config trong schema.prisma:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  relationMode = "prisma"
}

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "fullTextIndex"]
}
```

#### 1.2. Enable Redis Cache
**Vấn đề**: Redis đã setup nhưng bị comment
**Giải pháp**: Uncomment Redis config và implement caching

```env
# Uncomment trong .env
REDIS_HOST=redis-13414.c295.ap-southeast-1-1.ec2.redns.redis-cloud.com
REDIS_PORT=13414
REDIS_PASSWORD=Gd0PjXsCwC5vtrtbWodMNJkHj7oqo2ix
REDIS_DB=0
```

#### 1.3. Lazy Load Modules
**Vấn đề**: Tất cả modules được load ngay khi startup
**Giải pháp**: Lazy load các modules ít dùng

#### 1.4. Optimize Validation Pipes
**Vấn đề**: SanitizeInputPipe chạy trên mọi request
**Giải pháp**: Chỉ apply cho routes cần thiết

---

### **PHASE 2: Database Optimization (Giảm 20-30%)**

#### 2.1. Add Database Indexes
**Vấn đề**: Queries chậm do thiếu indexes
**Giải pháp**: Add indexes cho các fields thường query

```prisma
model ResUser {
  id         String    @id @default(uuid())
  union_id   String    @unique
  nickname   String    @db.VarChar(255)
  
  @@index([nickname])
  @@index([created_at])
  @@index([is_deleted, is_blocked])
}
```

#### 2.2. Optimize Prisma Queries
**Vấn đề**: N+1 queries do không dùng `include` đúng cách
**Giải pháp**: 
- Sử dụng `select` thay vì load toàn bộ object
- Sử dụng `include` với nested relations
- Implement DataLoader pattern

#### 2.3. Enable Query Logging
**Vấn đề**: Không biết query nào chậm
**Giải pháp**: Enable Prisma query logging

```typescript
// prisma.service.ts
constructor() {
  super({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'stdout', level: 'error' },
      { emit: 'stdout', level: 'warn' },
    ],
    errorFormat: 'pretty',
  });
}

async onModuleInit() {
  this.$on('query', (e) => {
    if (e.duration > 100) { // Log queries > 100ms
      this.logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
    }
  });
  await this.$connect();
}
```

---

### **PHASE 3: Caching Strategy (Giảm 30-50% cho repeated requests)**

#### 3.1. Implement Cache Decorator
```typescript
// cache.decorator.ts
export function CacheResult(ttl: number = 60) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;
      const cached = await this.cacheService.get(cacheKey);
      if (cached) return cached;
      
      const result = await originalMethod.apply(this, args);
      await this.cacheService.set(cacheKey, result, ttl);
      return result;
    };
  };
}
```

#### 3.2. Cache Strategy cho từng loại data
- **User Profile**: Cache 5 phút
- **Posts/Stories**: Cache 1 phút
- **Static Data** (gifts, store items): Cache 1 giờ
- **Notifications**: Không cache (real-time)

---

### **PHASE 4: Code Optimization**

#### 4.1. Optimize Interceptors
```typescript
// Chỉ apply ResponseInterceptor cho routes cần format response
// Không apply global
@UseInterceptors(ResponseInterceptor)
@Controller('api/users')
export class UsersController {}
```

#### 4.2. Optimize Validation
```typescript
// Chỉ validate khi cần
@UsePipes(new ValidationPipe({ 
  transform: true,
  whitelist: true,
  skipMissingProperties: true, // Skip validation cho optional fields
}))
```

#### 4.3. Async Operations
```typescript
// Chạy các operations độc lập song song
const [user, posts, followers] = await Promise.all([
  this.userService.findOne(id),
  this.postService.findByUser(id),
  this.followService.getFollowers(id),
]);
```

---

### **PHASE 5: Infrastructure**

#### 5.1. Enable Compression
```typescript
// main.ts
import compression from 'compression';
app.use(compression());
```

#### 5.2. Optimize Winston Logger
```typescript
// Giảm log level trong production
const logger = WinstonModule.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});
```

#### 5.3. Database Connection Pooling
```typescript
// prisma.service.ts
constructor() {
  super({
    datasources: {
      db: {
        url: process.env.DATABASE_URL + '?connection_limit=20&pool_timeout=20',
      },
    },
  });
}
```

---

## 📊 Monitoring & Profiling

### Tools cần dùng:
1. **Prisma Studio** - Xem database queries
2. **NestJS Profiler** - Profile request time
3. **Redis Commander** - Monitor cache hit/miss
4. **New Relic / DataDog** - APM monitoring (optional)

### Metrics cần track:
- Response time per endpoint
- Database query time
- Cache hit rate
- Memory usage
- CPU usage

---

## 🚀 Implementation Checklist

### Week 1: Quick Wins
- [ ] Config Prisma connection pool
- [ ] Enable Redis cache
- [ ] Add database indexes
- [ ] Enable query logging
- [ ] Optimize validation pipes

### Week 2: Caching
- [ ] Implement cache decorator
- [ ] Cache user profiles
- [ ] Cache posts/stories
- [ ] Cache static data

### Week 3: Code Optimization
- [ ] Optimize interceptors
- [ ] Fix N+1 queries
- [ ] Implement async operations
- [ ] Add compression

### Week 4: Monitoring
- [ ] Setup monitoring tools
- [ ] Track metrics
- [ ] Load testing
- [ ] Fine-tune based on results

---

## 🎯 Expected Results

| Phase | Current | Target | Improvement |
|-------|---------|--------|-------------|
| Before | ~4000ms | - | - |
| Phase 1 | ~4000ms | ~1500ms | 62% |
| Phase 2 | ~1500ms | ~800ms | 47% |
| Phase 3 | ~800ms | ~400ms | 50% |
| Phase 4 | ~400ms | <300ms | 25% |

**Final Target: <500ms for 95% of requests**

---

## 🔧 Debugging Commands

```bash
# Profile startup time
NODE_OPTIONS='--inspect' yarn start:dev

# Check slow queries
yarn prisma studio

# Monitor Redis
redis-cli monitor

# Load testing
npm install -g autocannon
autocannon -c 100 -d 30 http://localhost:3001/api/users
```
