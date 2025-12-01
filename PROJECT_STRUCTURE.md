# 🗂️ Cấu trúc Dự án - Social Network Backend

## 📋 Tổng quan

Đây là backend của một mạng xã hội được xây dựng bằng **NestJS + Prisma + Redis + PostgreSQL**.

## 🏗️ Cấu trúc Thư mục

```
project-root/
├── src/
│   ├── main.ts                           # Entry point
│   ├── app.module.ts                     # Root module
│   │
│   ├── config/                           # Configuration
│   │   ├── database.config.ts
│   │   └── jwt.config.ts
│   │
│   ├── common/                           # Shared code
│   │   ├── common.module.ts
│   │   ├── constants/                    # Constants
│   │   ├── dto/                          # Base DTOs
│   │   ├── enums/                        # Enums
│   │   ├── interfaces/                   # Interfaces
│   │   ├── guards/                       # Auth guards
│   │   ├── interceptors/                 # Interceptors
│   │   ├── filters/                      # Exception filters
│   │   ├── decorators/                   # Custom decorators
│   │   ├── utils/                        # Utilities
│   │   │
│   │   ├── cache/                        # Cache system (2-layer)
│   │   │   ├── cache.module.ts
│   │   │   ├── cache.service.ts          # Redis + Memory cache
│   │   │   ├── memory-cache.service.ts   # LRU cache
│   │   │   ├── cache-warming.service.ts  # Auto warmup
│   │   │   └── cache-admin.controller.ts # Admin endpoints
│   │   │
│   │   ├── monitoring/                   # Performance monitoring
│   │   │   ├── monitoring.module.ts
│   │   │   ├── metrics.service.ts        # Prometheus metrics
│   │   │   ├── performance.service.ts    # Query tracking
│   │   │   └── controller/
│   │   │       ├── metrics.controller.ts
│   │   │       └── performance.controller.ts
│   │   │
│   │   ├── rate-limit/                   # Rate limiting
│   │   │   └── rate-limit.module.ts
│   │   │
│   │   └── tracing/                      # Request tracing
│   │       └── tracing.module.ts
│   │
│   ├── auth/                             # Authentication
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── dto/
│   │   ├── guards/
│   │   │   ├── account-auth.guard.ts     # JWT guard
│   │   │   └── optional-auth.guard.ts
│   │   ├── strategy/
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── google.strategy.ts
│   │   │   └── facebook.strategy.ts
│   │   └── security/
│   │       └── token.service.ts
│   │
│   ├── modules/                          # Feature modules
│   │   │
│   │   ├── users/                        # Users module
│   │   │   ├── users.module.ts
│   │   │   ├── controller/
│   │   │   │   ├── users.controller.ts
│   │   │   │   └── users-admin.controller.ts
│   │   │   ├── service/
│   │   │   │   ├── res-user.service.ts
│   │   │   │   ├── user-profile.service.ts
│   │   │   │   └── user-connections.service.ts
│   │   │   ├── dto/
│   │   │   └── interfaces/
│   │   │
│   │   ├── profile/                      # User profiles
│   │   │   ├── profile.module.ts
│   │   │   ├── controller/
│   │   │   └── service/
│   │   │
│   │   ├── associate/                    # Connections (follow/friend)
│   │   │   ├── associate.module.ts
│   │   │   ├── controller/
│   │   │   │   ├── follow.controller.ts
│   │   │   │   ├── friend.controller.ts
│   │   │   │   └── block.controller.ts
│   │   │   └── service/
│   │   │       ├── follow.service.ts
│   │   │       ├── friend.service.ts
│   │   │       └── block.service.ts
│   │   │
│   │   ├── posts/                        # Posts & feeds
│   │   │   ├── posts.module.ts
│   │   │   ├── controller/
│   │   │   │   ├── posts.controller.ts
│   │   │   │   └── feed.controller.ts
│   │   │   └── service/
│   │   │       ├── posts.service.ts
│   │   │       └── feed.service.ts
│   │   │
│   │   ├── stories/                      # Stories (24h content)
│   │   │   ├── stories.module.ts
│   │   │   ├── controller/
│   │   │   └── service/
│   │   │
│   │   ├── notifications/                # Notifications
│   │   │   ├── notifications.module.ts
│   │   │   ├── controller/
│   │   │   │   └── notification.controller.ts
│   │   │   └── service/
│   │   │       └── notification.service.ts
│   │   │
│   │   ├── messaging/                    # Direct messages
│   │   │   ├── messaging.module.ts
│   │   │   ├── controller/
│   │   │   └── service/
│   │   │
│   │   ├── room/                         # Chat rooms
│   │   │   ├── room.module.ts
│   │   │   ├── controller/
│   │   │   └── service/
│   │   │
│   │   ├── realtime/                     # WebSocket gateway
│   │   │   ├── realtime.module.ts
│   │   │   └── realtime.gateway.ts
│   │   │
│   │   ├── groups/                       # Groups
│   │   │   ├── groups.module.ts
│   │   │   ├── controller/
│   │   │   └── service/
│   │   │
│   │   ├── events/                       # Events
│   │   │   ├── events.module.ts
│   │   │   ├── controller/
│   │   │   └── service/
│   │   │
│   │   ├── wallet/                       # Virtual wallet
│   │   │   ├── wallet.module.ts
│   │   │   ├── controller/
│   │   │   └── service/
│   │   │
│   │   ├── gifts/                        # Virtual gifts
│   │   │   ├── gifts.module.ts
│   │   │   ├── controller/
│   │   │   └── service/
│   │   │
│   │   ├── clans/                        # Clans/Guilds
│   │   │   ├── clans.module.ts
│   │   │   ├── controller/
│   │   │   └── service/
│   │   │
│   │   ├── store/                        # In-app store
│   │   │   ├── store.module.ts
│   │   │   ├── controller/
│   │   │   └── service/
│   │   │
│   │   ├── tasks/                        # Daily tasks
│   │   │   ├── tasks.module.ts
│   │   │   ├── controller/
│   │   │   └── service/
│   │   │
│   │   ├── feedback/                     # User feedback
│   │   │   ├── feedback.module.ts
│   │   │   ├── controller/
│   │   │   └── service/
│   │   │
│   │   ├── support/                      # Customer support
│   │   │   ├── support.module.ts
│   │   │   ├── controller/
│   │   │   └── service/
│   │   │
│   │   └── search/                       # Global search
│   │       ├── search.module.ts
│   │       ├── controller/
│   │       └── service/
│   │
│   ├── prisma/                           # Database ORM
│   │   ├── prisma.module.ts
│   │   ├── prisma.service.ts
│   │   ├── schema.prisma                 # Database schema
│   │   ├── migrations/                   # DB migrations
│   │   ├── seed-gifts.ts                 # Seed data
│   │   ├── seed-wallet.ts
│   │   └── seed-posts.ts
│   │
│   └── apim/                             # API Management (nếu có)
│
├── test/                                 # Tests
├── scripts/                              # Utility scripts
│   ├── check-slow-queries.sh
│   └── performance-test.js
│
├── docs/                                 # Documentation
│   ├── BACKEND_PROJECT_STRUCTURE.md
│   ├── CACHE_MONITORING_GUIDE.md
│   ├── ARCHITECTURE.md
│   └── *.md
│
├── .env                                  # Environment variables
├── .env.example
├── docker-compose.yml                    # Docker setup
├── Dockerfile
├── package.json
├── tsconfig.json
├── nest-cli.json
└── README.md
```

## 🔗 Quan hệ giữa các Module

### Core Modules (Global)
```
CacheModule ──────┐
MonitoringModule ─┼──> Được import bởi tất cả modules
PrismaModule ─────┤
TracingModule ────┘
```

### Feature Modules Dependencies
```
AuthModule
    ↓
UsersModule ──┬──> ProfileModule
              ├──> AssociateModule (Follow/Friend/Block)
              └──> NotificationsModule

PostsModule ──┬──> UsersModule
              └──> NotificationsModule

MessagingModule ──┬──> UsersModule
                  ├──> RoomModule
                  └──> RealtimeModule (WebSocket)

WalletModule ──┬──> UsersModule
               └──> GiftsModule

GroupsModule ──┬──> UsersModule
               └──> PostsModule
```

## 📦 Module Chính và Chức năng

| Module | Chức năng | Controllers | Services |
|--------|-----------|-------------|----------|
| **AuthModule** | Đăng nhập, đăng ký, OAuth | auth.controller | auth.service, token.service |
| **UsersModule** | Quản lý user | users.controller, users-admin.controller | res-user.service, user-profile.service, user-connections.service |
| **AssociateModule** | Follow, Friend, Block | follow.controller, friend.controller, block.controller | follow.service, friend.service, block.service |
| **PostsModule** | Bài viết, feed | posts.controller, feed.controller | posts.service, feed.service |
| **NotificationsModule** | Thông báo | notification.controller | notification.service |
| **MessagingModule** | Tin nhắn | messaging.controller | messaging.service |
| **RoomModule** | Phòng chat | room.controller | room.service |
| **RealtimeModule** | WebSocket | - | realtime.gateway |
| **WalletModule** | Ví ảo | wallet.controller | wallet.service |
| **GiftsModule** | Quà tặng | gifts.controller | gifts.service |
| **CacheModule** | Cache 2 lớp | cache-admin.controller | cache.service, cache-warming.service, memory-cache.service |
| **MonitoringModule** | Metrics, Performance | metrics.controller, performance.controller | metrics.service, performance.service |

## 🗄️ Database Tables (Prisma)

### Core Tables
- `res_user` - Users
- `res_profile` - User profiles
- `res_follow` - Follow relationships
- `res_friend` - Friend relationships
- `res_block` - Block relationships

### Content Tables
- `res_post` - Posts
- `res_story` - Stories
- `res_comment` - Comments
- `res_reaction` - Reactions (like, love, etc.)

### Communication Tables
- `res_notification` - Notifications
- `res_message` - Direct messages
- `res_room` - Chat rooms
- `res_room_member` - Room members

### Social Tables
- `res_group` - Groups
- `res_group_member` - Group members
- `res_event` - Events
- `res_clan` - Clans

### Economy Tables
- `res_wallet` - User wallets
- `res_transaction` - Transactions
- `res_gift` - Virtual gifts
- `res_store_item` - Store items

## 🔧 Shared Services

### CacheService (2-layer cache)
- **L1**: Memory cache (LRU, <1ms)
- **L2**: Redis cache (~50-100ms)
- Auto warmup on startup
- Pattern-based invalidation

### MonitoringService
- Prometheus metrics
- Slow query tracking
- Performance monitoring
- Alert system

### PrismaService
- Database connection
- Query middleware
- Transaction support

## 🚀 API Endpoints Structure

```
/api/v1/
├── auth/                    # Authentication
│   ├── POST /login
│   ├── POST /register
│   ├── POST /refresh
│   └── GET /oauth/google
│
├── users/                   # Users
│   ├── GET /users
│   ├── GET /users/:id
│   ├── PUT /users/:id
│   └── DELETE /users/:id
│
├── posts/                   # Posts
│   ├── GET /posts
│   ├── POST /posts
│   ├── GET /posts/:id
│   └── DELETE /posts/:id
│
├── notifications/           # Notifications
│   ├── GET /notifications
│   └── PUT /notifications/:id/read
│
├── admin/                   # Admin endpoints
│   ├── /admin/cache/status
│   ├── /admin/cache/warm-up
│   └── /admin/performance/slow-queries
│
└── metrics                  # Monitoring
    ├── GET /metrics         # Prometheus
    └── GET /metrics/json    # JSON
```

## 📝 Naming Conventions

### Files
- `*.controller.ts` - Controllers
- `*.service.ts` - Services
- `*.dto.ts` - DTOs
- `*.interface.ts` - Interfaces
- `*.module.ts` - Modules
- `*.guard.ts` - Guards
- `*.interceptor.ts` - Interceptors

### Classes
- `UserController` - PascalCase
- `UserService` - PascalCase
- `CreateUserDto` - PascalCase + Dto suffix

### Variables
- `userService` - camelCase
- `getUserById` - camelCase

## 🔍 Tìm File Nhanh

### Muốn sửa API endpoint?
→ Tìm trong `src/modules/{module}/controller/`

### Muốn sửa business logic?
→ Tìm trong `src/modules/{module}/service/`

### Muốn sửa validation?
→ Tìm trong `src/modules/{module}/dto/`

### Muốn sửa database schema?
→ Tìm trong `src/prisma/schema.prisma`

### Muốn sửa cache logic?
→ Tìm trong `src/common/cache/`

### Muốn sửa authentication?
→ Tìm trong `src/auth/`

### Muốn thêm monitoring?
→ Tìm trong `src/common/monitoring/`

## 🎯 Module Pattern

Mỗi module theo cấu trúc:
```
module-name/
├── module-name.module.ts      # Module definition
├── controller/                # API endpoints
│   └── *.controller.ts
├── service/                   # Business logic
│   └── *.service.ts
├── dto/                       # Validation
│   └── *.dto.ts
└── interfaces/                # Types
    └── *.interface.ts
```

## 📚 Import Paths

```typescript
// ✅ Đúng: Import từ module
import { CacheService } from '@/common/cache/cache.service';
import { PrismaService } from '@/prisma/prisma.service';

// ✅ Đúng: Import từ index
import { CreateUserDto } from './dto';

// ❌ Sai: Import từ nhiều cấp
import { CacheService } from '../../../common/cache/cache.service';
```

## 🔄 Data Flow

```
Request
  ↓
Controller (validation)
  ↓
Service (business logic)
  ↓
Prisma (database)
  ↓
Cache (if applicable)
  ↓
Response
```

## 🎨 Code Organization Rules

1. **Controllers**: Chỉ xử lý HTTP, validation, response
2. **Services**: Business logic, database queries
3. **DTOs**: Validation rules với class-validator
4. **Interfaces**: Type definitions
5. **Common**: Shared code, không có business logic cụ thể
