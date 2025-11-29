# 🚀 Quick Start: Tối ưu NestJS API ngay lập tức

## Bước 1: Enable Redis Cache (QUAN TRỌNG NHẤT)

### 1.1. Uncomment Redis config trong `.env`:
```env
# Redis Config
REDIS_HOST=redis-13414.c295.ap-southeast-1-1.ec2.redns.redis-cloud.com
REDIS_PORT=13414
REDIS_PASSWORD=Gd0PjXsCwC5vtrtbWodMNJkHj7oqo2ix
REDIS_DB=0
```

### 1.2. Test Redis connection:
```bash
# Restart app
yarn start:dev

# Check logs - phải thấy "Redis connected"
```

---

## Bước 2: Optimize Database Connection

### 2.1. Update `DATABASE_URL` trong `.env`:
```env
# Thêm connection pool params
DATABASE_URL=postgresql://neondb_owner:npg_JrWTDx8dR5BM@ep-summer-dream-ahnsrpzt-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connection_limit=10&pool_timeout=20&connect_timeout=10
```

### 2.2. Regenerate Prisma Client:
```bash
yarn prisma generate
```

---

## Bước 3: Apply Cache cho API endpoints

### 3.1. Example: Cache User Profile
```typescript
// users.controller.ts
import { CacheResult } from '@/common/decorators/cache-result.decorator';
import { UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@/common/interceptors/cache.interceptor';

@Controller('users')
@UseInterceptors(CacheInterceptor) // Apply cache interceptor
export class UsersController {
  
  @Get(':id')
  @CacheResult(300) // Cache 5 phút
  async getUser(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
```

### 3.2. Cache Strategy:
- **User profiles**: 300s (5 phút)
- **Posts list**: 60s (1 phút)
- **Static data** (gifts, store): 3600s (1 giờ)
- **Real-time data** (notifications): Không cache

---

## Bước 4: Optimize Prisma Queries

### 4.1. Sử dụng `select` thay vì load toàn bộ:
```typescript
// ❌ BAD - Load toàn bộ user object
const user = await this.prisma.user.findUnique({
  where: { id },
  include: { posts: true, followers: true }
});

// ✅ GOOD - Chỉ select fields cần thiết
const user = await this.prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    nickname: true,
    avatar: true,
    posts: {
      select: { id: true, content: true },
      take: 10 // Limit số lượng
    }
  }
});
```

### 4.2. Chạy queries song song:
```typescript
// ❌ BAD - Sequential queries
const user = await this.prisma.user.findUnique({ where: { id } });
const posts = await this.prisma.post.findMany({ where: { userId: id } });
const followers = await this.prisma.follow.count({ where: { followingId: id } });

// ✅ GOOD - Parallel queries
const [user, posts, followers] = await Promise.all([
  this.prisma.user.findUnique({ where: { id } }),
  this.prisma.post.findMany({ where: { userId: id } }),
  this.prisma.follow.count({ where: { followingId: id } }),
]);
```

---

## Bước 5: Add Database Indexes

### 5.1. Update `schema.prisma`:
```prisma
model ResUser {
  id         String    @id @default(uuid())
  union_id   String    @unique
  nickname   String
  created_at DateTime  @default(now())
  is_deleted Boolean   @default(false)
  is_blocked Boolean   @default(false)
  
  // Add indexes cho fields thường query
  @@index([nickname])
  @@index([created_at])
  @@index([is_deleted, is_blocked])
  @@index([union_id, is_deleted])
}

model ResPost {
  id         String    @id @default(uuid())
  user_id    String
  created_at DateTime  @default(now())
  is_deleted Boolean   @default(false)
  
  @@index([user_id, is_deleted])
  @@index([created_at])
}
```

### 5.2. Create migration:
```bash
yarn prisma migrate dev --name add_performance_indexes
yarn prisma migrate deploy
```

---

## Bước 6: Optimize Global Pipes & Interceptors

### 6.1. Chỉ apply validation khi cần:
```typescript
// main.ts - Remove global SanitizeInputPipe
app.useGlobalPipes(
  // new SanitizeInputPipe(), // ❌ Remove này
  new ValidationPipe({
    whitelist: true,
    transform: true,
    skipMissingProperties: true, // ✅ Add này
  }),
);
```

### 6.2. Apply SanitizeInputPipe chỉ cho routes cần:
```typescript
// users.controller.ts
@Post()
@UsePipes(SanitizeInputPipe) // Chỉ apply cho route này
async createUser(@Body() dto: CreateUserDto) {
  return this.usersService.create(dto);
}
```

---

## Bước 7: Enable Compression

### 7.1. Install compression:
```bash
yarn add compression
yarn add -D @types/compression
```

### 7.2. Enable trong `main.ts`:
```typescript
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.use(compression()); // ✅ Add này
  app.use(helmet());
  // ... rest of code
}
```

---

## Bước 8: Monitor Performance

### 8.1. Check slow queries:
```bash
# Restart app và xem logs
yarn start:dev

# Sẽ thấy warnings cho queries > 100ms:
# ⚠️ Slow query detected (250ms): SELECT * FROM ...
```

### 8.2. Load testing:
```bash
# Install autocannon
npm install -g autocannon

# Test endpoint
autocannon -c 100 -d 30 http://localhost:3001/api/users

# Kết quả mong đợi:
# Latency: p50 < 200ms, p99 < 500ms
```

---

## 📊 Expected Results

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Avg Response Time | ~4000ms | <500ms | 87.5% |
| Database Queries | N+1 | Optimized | 70% |
| Cache Hit Rate | 0% | 60-80% | +60% |
| Throughput | ~25 req/s | ~200 req/s | 8x |

---

## 🔍 Debugging Tips

### Check Redis connection:
```bash
# Connect to Redis
redis-cli -h redis-13414.c295.ap-southeast-1-1.ec2.redns.redis-cloud.com -p 13414 -a Gd0PjXsCwC5vtrtbWodMNJkHj7oqo2ix

# Check keys
KEYS cache:*

# Check TTL
TTL cache:GET:/api/users/123:user-id
```

### Check Prisma queries:
```typescript
// Enable query logging
const user = await this.prisma.user.findUnique({
  where: { id },
}).$queryRaw`SELECT * FROM "ResUser" WHERE id = ${id}`;
```

### Profile specific endpoint:
```bash
# Use Chrome DevTools
NODE_OPTIONS='--inspect' yarn start:dev

# Open chrome://inspect
# Profile the endpoint
```

---

## ⚠️ Common Mistakes

1. **Không uncomment Redis** → Cache không hoạt động
2. **Quên regenerate Prisma** → Connection pool không apply
3. **Cache quá lâu** → Data stale
4. **Không add indexes** → Queries vẫn chậm
5. **Load toàn bộ relations** → N+1 queries

---

## 🎯 Next Steps

1. ✅ Apply tất cả 8 bước trên
2. ✅ Test với load testing tool
3. ✅ Monitor slow queries
4. ✅ Fine-tune cache TTL
5. ✅ Add more indexes nếu cần

**Target: <500ms cho 95% requests trong vòng 1 tuần!**
