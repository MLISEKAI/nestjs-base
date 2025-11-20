# 📚 Hướng dẫn sử dụng Redis trong dự án

## ✅ Redis đã được tích hợp sẵn

Dự án đã có sẵn:

- ✅ `CacheService` - Service để làm việc với Redis
- ✅ `CacheModule` - Global module (có thể dùng ở mọi nơi)
- ✅ Đã được sử dụng trong Search module (trending, recommendations)

## 🔧 Cấu hình

### 1. Thêm vào file `.env`

```env
# Redis URL
REDIS_URL=redis://localhost:6379

# Nếu Redis có password
REDIS_URL=redis://:password@localhost:6379
```

### 2. Redis đã tự động kết nối

Khi app start, Redis sẽ tự động kết nối. Nếu Redis không có, app vẫn chạy bình thường (cache sẽ bị disable).

## 📖 Cách sử dụng

### Cách 1: Sử dụng CacheService (Khuyến nghị)

#### Inject CacheService vào Service

```typescript
import { Injectable } from '@nestjs/common';
import { CacheService } from 'src/common/cache/cache.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class YourService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService, // Inject CacheService
  ) {}
}
```

#### Pattern 1: Cache-Aside (Get or Set) - Khuyến nghị

```typescript
async getUserProfile(userId: string) {
  // Tự động check cache, nếu có thì return, nếu không thì fetch và cache
  return this.cacheService.getOrSet(
    `user:${userId}:profile`, // Cache key
    async () => {
      // Function để fetch data nếu cache miss
      return this.prisma.resUser.findUnique({
        where: { id: userId },
        select: {
          id: true,
          nickname: true,
          avatar: true,
          bio: true,
        },
      });
    },
    3600, // TTL: 1 giờ (seconds)
  );
}
```

#### Pattern 2: Manual Cache

```typescript
async getUserProfile(userId: string) {
  // 1. Check cache trước
  const cacheKey = `user:${userId}:profile`;
  const cached = await this.cacheService.get(cacheKey);
  if (cached) {
    return cached;
  }

  // 2. Fetch từ database
  const user = await this.prisma.resUser.findUnique({
    where: { id: userId },
  });

  // 3. Lưu vào cache
  await this.cacheService.set(cacheKey, user, 3600); // TTL: 1 giờ

  return user;
}
```

#### Pattern 3: Cache với Invalidation

```typescript
async updateUserProfile(userId: string, data: UpdateUserDto) {
  // 1. Update database
  const updated = await this.prisma.resUser.update({
    where: { id: userId },
    data,
  });

  // 2. Invalidate cache
  await this.cacheService.del(`user:${userId}:profile`);
  // Hoặc invalidate tất cả cache của user
  await this.cacheService.invalidateUserCache(userId);

  return updated;
}
```

### Cách 2: Sử dụng Cache Decorator (Controller level)

```typescript
import { Controller, Get, Param } from '@nestjs/common';
import { Cacheable } from 'src/common/cache/decorators/cache.decorator';
import { UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from 'src/common/cache/interceptors/cache.interceptor';

@Controller('users')
@UseInterceptors(CacheInterceptor) // Enable cache interceptor
export class UserController {
  @Get(':userId')
  @Cacheable('user::userId:profile', 3600) // Cache key với :userId sẽ được replace
  async getUserProfile(@Param('userId') userId: string) {
    // Response sẽ tự động được cache
    return this.userService.getUserProfile(userId);
  }
}
```

## 🎯 Ví dụ thực tế

### Ví dụ 1: Cache User Profile

```typescript
// src/modules/users/service/user.service.ts
import { Injectable } from '@nestjs/common';
import { CacheService } from 'src/common/cache/cache.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async getUserById(userId: string) {
    return this.cacheService.getOrSet(
      `user:${userId}:profile`,
      async () => {
        return this.prisma.resUser.findUnique({
          where: { id: userId },
          select: {
            id: true,
            nickname: true,
            avatar: true,
            bio: true,
            created_at: true,
          },
        });
      },
      1800, // Cache 30 phút
    );
  }

  async updateUser(userId: string, data: any) {
    const updated = await this.prisma.resUser.update({
      where: { id: userId },
      data,
    });

    // Invalidate cache
    await this.cacheService.del(`user:${userId}:profile`);
    await this.cacheService.invalidateUserCache(userId);

    return updated;
  }
}
```

### Ví dụ 2: Cache Posts List

```typescript
// src/modules/posts/service/posts.service.ts
async getPosts(page: number = 1, limit: number = 20) {
  const cacheKey = `posts:page:${page}:limit:${limit}`;

  return this.cacheService.getOrSet(
    cacheKey,
    async () => {
      return this.prisma.resPost.findMany({
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });
    },
    300, // Cache 5 phút (posts thay đổi thường xuyên)
  );
}

async createPost(userId: string, data: any) {
  const post = await this.prisma.resPost.create({
    data: { ...data, user_id: userId },
  });

  // Invalidate posts cache
  await this.cacheService.delPattern('posts:*');

  return post;
}
```

### Ví dụ 3: Cache với Conditional Logic

```typescript
async getTrendingPosts(period: 'day' | 'week' | 'month') {
  const cacheKey = `trending:posts:${period}`;
  const ttl = period === 'day' ? 300 : period === 'week' ? 1800 : 3600; // 5min, 30min, 1h

  return this.cacheService.getOrSet(
    cacheKey,
    async () => {
      // Logic tính trending posts
      const dateThreshold = this.getDateThreshold(period);
      return this.prisma.resPost.findMany({
        where: {
          created_at: { gte: dateThreshold },
        },
        orderBy: { created_at: 'desc' },
        take: 20,
      });
    },
    ttl,
  );
}
```

## 🗑️ Cache Invalidation

### Xóa cache đơn lẻ

```typescript
await this.cacheService.del('user:123:profile');
```

### Xóa cache theo pattern

```typescript
// Xóa tất cả cache của user
await this.cacheService.delPattern('user:123:*');

// Xóa tất cả posts cache
await this.cacheService.delPattern('posts:*');

// Xóa tất cả trending cache
await this.cacheService.delPattern('trending:*');
```

### Invalidate user cache (helper method)

```typescript
// Xóa tất cả cache liên quan đến user
await this.cacheService.invalidateUserCache(userId);
// Tương đương với:
// - user:${userId}:*
// - profile:${userId}:*
```

### Xóa toàn bộ cache (cẩn thận!)

```typescript
await this.cacheService.flushAll();
```

## 📊 Cache Key Naming Convention

Sử dụng pattern: `resource:identifier:sub-resource`

```typescript
// User
`user:${userId}:profile``user:${userId}:settings``user:${userId}:stats`
// Posts
`posts:page:${page}:limit:${limit}``post:${postId}:detail``post:${postId}:comments`
// Trending
`trending:posts:${period}``trending:users:${period}`
// Recommendations
`recommendations:users:${userId}:${limit}``recommendations:posts:${userId}:${limit}`;
```

## ⏱️ TTL (Time To Live) Recommendations

```typescript
// Static data (ít thay đổi)
const STATIC_TTL = 86400; // 24 giờ

// User profile
const PROFILE_TTL = 1800; // 30 phút

// Posts list
const POSTS_TTL = 300; // 5 phút

// Trending
const TRENDING_TTL = 300; // 5 phút

// Recommendations
const RECOMMENDATIONS_TTL = 600; // 10 phút

// Real-time data (thay đổi liên tục)
const REALTIME_TTL = 60; // 1 phút
```

## 🔍 Kiểm tra Cache

### Test Redis connection

```typescript
// Trong service
async testRedis() {
  const testKey = 'test:connection';
  await this.cacheService.set(testKey, { test: true }, 60);
  const result = await this.cacheService.get(testKey);
  console.log('Redis test:', result);
  await this.cacheService.del(testKey);
}
```

### Xem cache trong Redis CLI

```bash
# Vào Redis container
docker exec -it redis-local redis-cli

# Xem tất cả keys
KEYS *

# Xem value của key
GET user:123:profile

# Xem TTL của key
TTL user:123:profile

# Xóa key
DEL user:123:profile

# Xóa tất cả keys
FLUSHALL
```

## ⚠️ Best Practices

1. **Luôn set TTL**: Không bao giờ cache vĩnh viễn
2. **Invalidate khi update**: Xóa cache khi data thay đổi
3. **Cache key naming**: Sử dụng pattern nhất quán
4. **Error handling**: CacheService tự động handle lỗi, app vẫn chạy nếu Redis down
5. **Cache expensive operations**: Chỉ cache những query tốn kém
6. **Monitor cache hit rate**: Theo dõi hiệu quả cache

## 📝 Ví dụ đầy đủ: User Service với Cache

```typescript
import { Injectable } from '@nestjs/common';
import { CacheService } from 'src/common/cache/cache.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  // Get user với cache
  async getUserById(userId: string) {
    return this.cacheService.getOrSet(
      `user:${userId}:profile`,
      () => this.prisma.resUser.findUnique({ where: { id: userId } }),
      1800, // 30 phút
    );
  }

  // Update user và invalidate cache
  async updateUser(userId: string, data: any) {
    const updated = await this.prisma.resUser.update({
      where: { id: userId },
      data,
    });

    // Invalidate cache
    await this.cacheService.invalidateUserCache(userId);

    return updated;
  }

  // Delete user và invalidate cache
  async deleteUser(userId: string) {
    await this.prisma.resUser.delete({ where: { id: userId } });
    await this.cacheService.invalidateUserCache(userId);
  }
}
```

## 🚀 Đã được sử dụng trong dự án

Redis đã được sử dụng trong:

- ✅ `TrendingService` - Cache trending posts/users
- ✅ `RecommendationService` - Cache user/post recommendations

Xem code tại:

- `src/modules/search/service/trending.service.ts`
- `src/modules/search/service/recommendation.service.ts`
