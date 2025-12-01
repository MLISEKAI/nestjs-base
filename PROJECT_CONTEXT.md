# 🎯 Project Context - Social Network Backend

## 📖 Tổng quan Dự án

Đây là backend của một **mạng xã hội** (social network) với đầy đủ tính năng:
- Đăng bài, stories, feed
- Follow, friend, block
- Messaging, chat rooms
- Notifications realtime
- Virtual wallet, gifts
- Groups, events, clans
- In-app store

## 🛠️ Tech Stack

### Backend Framework
- **NestJS** v11.x - Node.js framework
- **TypeScript** v5.7.x - Type-safe JavaScript
- **Node.js** >= 20.0.0

### Database & ORM
- **PostgreSQL** - Primary database
- **Prisma** v6.19.x - ORM
- **Redis** v5.8.x - Cache & session

### Authentication
- **JWT** - Token-based auth
- **Passport** - Auth middleware
- **OAuth 2.0** - Google, Facebook login
- **2FA** - Two-factor authentication (OTP)

### Real-time
- **Socket.IO** v4.8.x - WebSocket
- **EventEmitter2** - Event system

### File Storage
- **AWS S3** - File upload
- **Cloudinary** - Image processing
- **Sharp** - Image optimization

### Monitoring & Performance
- **Prometheus** - Metrics
- **Winston** - Logging
- **LRU Cache** - Memory cache
- **Redis** - Distributed cache

### API Documentation
- **Swagger** - API docs
- **OpenAPI 3.0** - API specification

### Security
- **Helmet** - Security headers
- **Throttler** - Rate limiting
- **Argon2** - Password hashing
- **Sanitize-HTML** - XSS prevention

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Testing
- **SWC** - Fast compilation

## 🏗️ Architecture Pattern

### Clean Architecture / Module-based
```
Presentation Layer (Controllers)
    ↓
Business Logic Layer (Services)
    ↓
Data Access Layer (Prisma)
    ↓
Database (PostgreSQL)
```

### Caching Strategy
```
Request → Memory Cache (L1) → Redis Cache (L2) → Database
```

## 📋 Coding Conventions

### 1. Folder Structure
- **Module-based**: Mỗi feature là một module độc lập
- **Separation of Concerns**: Controller → Service → Repository
- **Common folder**: Shared code (guards, interceptors, utils)

### 2. File Naming
```typescript
// Controllers
user.controller.ts
user-admin.controller.ts

// Services
user.service.ts
user-profile.service.ts

// DTOs
create-user.dto.ts
update-user.dto.ts

// Interfaces
user.interface.ts
user-profile.interface.ts
```

### 3. Class Naming
```typescript
// Controllers
export class UserController {}
export class UserAdminController {}

// Services
export class UserService {}
export class UserProfileService {}

// DTOs
export class CreateUserDto {}
export class UpdateUserDto {}

// Interfaces
export interface IUser {}
export interface IUserProfile {}
```

### 4. Variable Naming
```typescript
// camelCase cho variables và functions
const userService = new UserService();
const getUserById = (id: string) => {};

// PascalCase cho classes
class UserService {}

// UPPER_SNAKE_CASE cho constants
const MAX_RETRY_COUNT = 3;
const DEFAULT_PAGE_SIZE = 20;
```

### 5. Import Order
```typescript
// 1. External libraries
import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';

// 2. Internal modules
import { PrismaService } from '@/prisma/prisma.service';
import { CacheService } from '@/common/cache/cache.service';

// 3. Relative imports
import { CreateUserDto } from './dto';
import { IUser } from './interfaces';
```

## 🎯 Business Logic Rules

### 1. Authentication & Authorization
- **JWT tokens**: Access token (15min) + Refresh token (7 days)
- **OAuth**: Google, Facebook login
- **2FA**: Optional OTP verification
- **Guards**: `@UseGuards(AuthGuard('account-auth'))`

### 2. User Management
- **User ID**: UUID format
- **Nickname**: Unique, 3-30 characters
- **Email**: Optional, unique if provided
- **Avatar**: Stored in S3/Cloudinary
- **Soft delete**: `is_deleted = true` (không xóa thật)

### 3. Relationships
- **Follow**: One-way relationship (A follows B)
- **Friend**: Two-way relationship (A ↔ B)
- **Block**: Prevents all interactions
- **Privacy**: Public, Friends, Private

### 4. Content Management
- **Posts**: Text, images, videos
- **Stories**: 24h expiry
- **Comments**: Nested (max 3 levels)
- **Reactions**: Like, Love, Haha, Wow, Sad, Angry

### 5. Notifications
- **Types**: Follow, Friend request, Comment, Reaction, Message
- **Delivery**: Push notification + In-app
- **Read status**: Unread → Read
- **Retention**: 30 days

### 6. Messaging
- **Direct messages**: 1-on-1 chat
- **Group chat**: Multiple users in room
- **Message types**: Text, Image, Video, Audio, File
- **Read receipts**: Seen status

### 7. Virtual Economy
- **Wallet**: Virtual currency (coins)
- **Gifts**: Send to other users
- **Store**: Buy items with coins
- **Transactions**: All logged for audit

## 🔧 Technical Conventions

### 1. Controllers
```typescript
@Controller('users')
@UseGuards(AuthGuard('account-auth'))
@ApiBearerAuth('JWT-auth')
export class UserController {
  // ✅ Chỉ xử lý HTTP request/response
  // ✅ Validation với DTOs
  // ✅ Forward logic to services
  // ❌ KHÔNG có business logic
  // ❌ KHÔNG truy cập database trực tiếp
}
```

### 2. Services
```typescript
@Injectable()
export class UserService {
  // ✅ Business logic
  // ✅ Database queries
  // ✅ Cache operations
  // ✅ Error handling
  // ❌ KHÔNG xử lý HTTP
}
```

### 3. DTOs (Data Transfer Objects)
```typescript
export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(30)
  nickname: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;
}
```

### 4. Response Format
```typescript
// Success response
{
  "data": { ... },
  "meta": {
    "item_count": 20,
    "total_items": 100,
    "items_per_page": 20,
    "total_pages": 5,
    "current_page": 1
  }
}

// Error response
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### 5. Pagination
```typescript
// Query params
?page=1&limit=20&sort=created_at&order=desc

// Response meta
{
  "meta": {
    "item_count": 20,      // Items in current page
    "total_items": 100,    // Total items
    "items_per_page": 20,  // Page size
    "total_pages": 5,      // Total pages
    "current_page": 1      // Current page
  }
}
```

### 6. Cache Keys Format
```typescript
// Pattern: {module}:{entity}:{id}:{field}
'user:123:profile'
'user:123:stats'
'post:456:detail'
'notifications:user-123:page:1:limit:20'
'users:search:all:page:1:limit:20:sort:created_at:asc'
```

### 7. Cache TTL (Time To Live)
```typescript
const CacheTTL = {
  USER_DETAIL: 1800,    // 30 minutes
  USER_STATS: 300,      // 5 minutes
  SEARCH_PAGE: 600,     // 10 minutes
  POST_DETAIL: 900,     // 15 minutes
  FEED: 180,            // 3 minutes
};
```

### 8. Error Handling
```typescript
// ✅ Sử dụng NestJS exceptions
throw new NotFoundException('User not found');
throw new BadRequestException('Invalid input');
throw new UnauthorizedException('Invalid token');
throw new ForbiddenException('Access denied');

// ❌ KHÔNG throw generic errors
throw new Error('Something went wrong');
```

### 9. Logging
```typescript
// ✅ Sử dụng Logger với context
private readonly logger = new Logger(UserService.name);

this.logger.log('User created', { userId, traceId });
this.logger.warn('Slow query detected', { duration, query });
this.logger.error('Failed to create user', error.stack);

// ❌ KHÔNG dùng console.log
console.log('User created');
```

### 10. Database Queries
```typescript
// ✅ Sử dụng Prisma với select
const user = await this.prisma.resUser.findUnique({
  where: { id },
  select: {
    id: true,
    nickname: true,
    avatar: true,
    // Chỉ select fields cần thiết
  },
});

// ✅ Sử dụng transactions cho multiple operations
await this.prisma.$transaction([
  this.prisma.resUser.update({ ... }),
  this.prisma.resNotification.create({ ... }),
]);

// ❌ KHÔNG select tất cả fields nếu không cần
const user = await this.prisma.resUser.findUnique({ where: { id } });
```

## 🔄 Request Flow

### Standard Request Flow
```
1. Client Request
   ↓
2. Global Guards (Auth, Rate Limit)
   ↓
3. Controller (Validation)
   ↓
4. Service (Business Logic)
   ↓
5. Cache Check (L1 → L2)
   ↓
6. Database Query (if cache miss)
   ↓
7. Cache Store
   ↓
8. Response Interceptor (Transform)
   ↓
9. Client Response
```

### Cache-Aside Pattern
```
1. Check Memory Cache (L1)
   ↓ Miss
2. Check Redis Cache (L2)
   ↓ Miss
3. Query Database
   ↓
4. Store in Redis (L2)
   ↓
5. Store in Memory (L1)
   ↓
6. Return Data
```

## 🚀 Performance Optimization

### 1. Cache Warming
- **Auto warmup**: On server start + every 30 minutes
- **Warm data**: Top users, recent posts, search results
- **Multi-instance safe**: Redis lock with atomic operations

### 2. Database Optimization
- **Indexes**: All foreign keys + frequently queried fields
- **Select specific fields**: Không select `*`
- **Pagination**: Cursor-based cho large datasets
- **Connection pooling**: Prisma connection pool

### 3. Query Optimization
- **Avoid N+1**: Sử dụng `include` hoặc `select` với relations
- **Batch operations**: `createMany`, `updateMany`
- **Slow query tracking**: Log queries > 100ms

### 4. API Optimization
- **Rate limiting**: 100 requests/minute (global)
- **Compression**: Gzip response
- **Pagination**: Max 100 items per page
- **Field selection**: Client có thể chọn fields cần thiết

## 🛡️ Security Best Practices

### 1. Authentication
- JWT tokens với short expiry
- Refresh token rotation
- 2FA cho sensitive operations
- Password hashing với Argon2

### 2. Authorization
- Role-based access control (RBAC)
- Resource ownership check
- Admin endpoints protected

### 3. Input Validation
- DTOs với class-validator
- Sanitize HTML input
- File upload validation (type, size)

### 4. Rate Limiting
- Global: 100 req/min
- Auth endpoints: 5 req/min
- Admin endpoints: 2-5 req/min

### 5. Data Protection
- Soft delete (không xóa thật)
- Audit logs cho sensitive operations
- PII encryption (nếu cần)

## 📊 Monitoring & Observability

### 1. Metrics (Prometheus)
- Request count, duration
- Cache hit/miss rate
- Database query time
- Error rate

### 2. Logging (Winston)
- Structured logging với JSON
- TraceId cho request tracking
- Log levels: error, warn, info, debug

### 3. Performance Tracking
- Slow query detection (>100ms)
- Cache warmup duration
- API response time

### 4. Alerts
- Cache warmup failed
- Slow queries spike
- High error rate
- High cache miss rate

## 🎯 Development Workflow

### 1. Tạo Feature Mới
```bash
# 1. Tạo module
nest g module modules/feature-name

# 2. Tạo controller
nest g controller modules/feature-name/controller/feature-name

# 3. Tạo service
nest g service modules/feature-name/service/feature-name

# 4. Tạo DTOs trong dto/
# 5. Tạo interfaces trong interfaces/
# 6. Update Prisma schema nếu cần
# 7. Run migration
yarn prisma:dev
```

### 2. Testing
```bash
# Unit tests
yarn test

# E2E tests
yarn test:e2e

# Coverage
yarn test:cov
```

### 3. Code Quality
```bash
# Linting
yarn lint

# Formatting
yarn format

# Type checking
yarn build
```

## 🔍 Debugging Tips

### 1. Tìm Slow Queries
```bash
GET /admin/performance/slow-queries
```

### 2. Check Cache Status
```bash
GET /admin/cache/status
```

### 3. View Metrics
```bash
GET /metrics          # Prometheus format
GET /metrics/json     # JSON format
GET /metrics/alerts   # Active alerts
```

### 4. Search Logs by TraceId
```bash
grep "traceId-xxx" logs/app.log
```

## 📚 Important Notes

### ✅ LUÔN LÀM
1. Validate input với DTOs
2. Use cache cho frequently accessed data
3. Log errors với context
4. Handle errors gracefully
5. Use transactions cho multiple DB operations
6. Add Swagger documentation
7. Write tests cho critical logic

### ❌ KHÔNG BAO GIỜ
1. Expose sensitive data trong response
2. Store passwords plain text
3. Skip validation
4. Use `console.log` trong production
5. Query database trong loops (N+1)
6. Ignore error handling
7. Hard-code credentials

## 🎓 Learning Resources

- **NestJS Docs**: https://docs.nestjs.com/
- **Prisma Docs**: https://www.prisma.io/docs/
- **Redis Best Practices**: https://redis.io/docs/manual/patterns/
- **Clean Architecture**: https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
