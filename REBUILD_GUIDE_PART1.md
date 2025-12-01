# 🚀 Hướng Dẫn Rebuild Dự Án Social Network Backend - PART 1

## 📋 Tổng Quan Dự Án

Đây là hướng dẫn chi tiết để rebuild lại toàn bộ dự án **Social Network Backend** từ đầu trên một repo mới. Hướng dẫn này được viết dựa trên kinh nghiệm thực tế phát triển qua **6 Sprints** với đầy đủ tính năng production-ready.

### 🎯 Thông Tin Dự Án

**Tên dự án**: Social Network Backend API  
**Mô tả**: Backend API cho mạng xã hội với đầy đủ tính năng như Facebook/Instagram

**Tech Stack**:
- **Framework**: NestJS v11.x (Node.js framework hiện đại)
- **Database**: PostgreSQL 14+ (Relational database)
- **ORM**: Prisma v6.19.x (Type-safe database client)
- **Cache**: Redis v5.8.x + LRU Memory Cache (2-layer caching)
- **Language**: TypeScript v5.7.x (Type-safe JavaScript)
- **Runtime**: Node.js >= 20.0.0

### ✨ Tính Năng Chính

#### 1. Authentication & Authorization
- ✅ JWT-based authentication (Access + Refresh tokens)
- ✅ OAuth 2.0 (Google, Facebook login)
- ✅ 2FA (Two-factor authentication với OTP)
- ✅ Password hashing với Argon2
- ✅ Token blacklist & refresh token rotation
- ✅ Role-based access control (Admin, User, Guest)

#### 2. User Management
- ✅ User profiles (Avatar, Bio, Birthday, Gender)
- ✅ User search với pagination
- ✅ Profile views tracking
- ✅ User statistics (Followers, Following, Friends)
- ✅ Soft delete (không xóa thật khỏi database)

#### 3. Social Features
- ✅ **Follow System**: One-way relationship (A follows B)
- ✅ **Friend System**: Two-way relationship (A ↔ B)
- ✅ **Block System**: Prevent all interactions
- ✅ **Favourite Users**: Bookmark favorite users
- ✅ **Profile Views**: Track who viewed your profile

#### 4. Content Management
- ✅ **Posts**: Text, images, videos với privacy settings
- ✅ **Stories**: 24-hour expiring content
- ✅ **Comments**: Nested comments (max 3 levels)
- ✅ **Reactions**: Like, Love, Haha, Wow, Sad, Angry
- ✅ **Hashtags**: Tag posts với trending hashtags
- ✅ **Media Attachments**: Multiple images/videos per post

#### 5. Messaging System
- ✅ **Direct Messages**: 1-on-1 chat
- ✅ **Group Chat**: Multiple users in conversation
- ✅ **Message Types**: Text, Image, Video, Audio, Gift, Business Card
- ✅ **Read Receipts**: Seen status tracking
- ✅ **Conversation Settings**: Mute, notifications, gift sounds

#### 6. Real-time Features
- ✅ **WebSocket**: Socket.IO integration
- ✅ **Live Notifications**: Real-time push notifications
- ✅ **Online Status**: User presence tracking
- ✅ **Typing Indicators**: Show when user is typing

#### 7. Virtual Economy
- ✅ **Wallet System**: Virtual currency (Gems, VEX)
- ✅ **Gifts**: Send virtual gifts to users
- ✅ **Store**: Buy items with virtual currency
- ✅ **Transactions**: Complete audit trail
- ✅ **Recharge Packages**: Buy currency with real money
- ✅ **VIP Subscriptions**: Premium features

#### 8. Groups & Events
- ✅ **Groups**: Create and join groups
- ✅ **Group Chat**: Messaging within groups
- ✅ **Events**: Create and manage events
- ✅ **Event Participants**: RSVP system

#### 9. Audio/Video Rooms
- ✅ **Live Rooms**: Audio/video chat rooms
- ✅ **Seat Management**: Host controls seats
- ✅ **Room Gifts**: Send gifts in rooms
- ✅ **Room Challenges**: Gamification features

#### 10. Performance & Monitoring
- ✅ **2-Layer Cache**: Memory (L1) + Redis (L2)
- ✅ **Cache Warming**: Auto-populate cache on startup
- ✅ **Selective Warmup**: Warmup specific users/posts
- ✅ **Prometheus Metrics**: Performance monitoring
- ✅ **Database Indexes**: 10+ composite indexes
- ✅ **Slow Query Detection**: Track queries > 100ms
- ✅ **Rate Limiting**: Prevent API abuse

---

## � KiếCn Trúc Hệ Thống

### Clean Architecture Pattern
```
┌─────────────────────────────────────────┐
│     Presentation Layer (Controllers)    │  ← HTTP/WebSocket endpoints
├─────────────────────────────────────────┤
│    Business Logic Layer (Services)      │  ← Business rules & logic
├─────────────────────────────────────────┤
│    Data Access Layer (Prisma/Cache)     │  ← Database queries & cache
├─────────────────────────────────────────┤
│         Database (PostgreSQL)           │  ← Data storage
└─────────────────────────────────────────┘
```

### 2-Layer Caching Strategy
```
Request → Memory Cache (L1) → Redis Cache (L2) → Database
           <1ms                ~50-100ms          ~100-500ms
```

**Lợi ích**:
- **L1 (Memory)**: Cực nhanh (<1ms), giới hạn 1000 items
- **L2 (Redis)**: Nhanh (~50-100ms), không giới hạn
- **Cache Hit Rate**: 85-95% (giảm 90% database queries)

---

## 📦 BƯỚC 1: Setup Môi Trường

### 1.1. Cài Đặt Prerequisites

**Yêu cầu hệ thống**:

```bash
# 1. Node.js >= 20.0.0 (LTS recommended)
node --version  # Phải >= v20.0.0

# Cài đặt Node.js:
# - Windows: https://nodejs.org/
# - Mac: brew install node@20
# - Linux: nvm install 20

# 2. Yarn >= 1.22.0 (Package manager)
yarn --version  # Phải >= 1.22.0

# Cài đặt Yarn:
npm install -g yarn

# 3. PostgreSQL >= 14 (Database)
psql --version  # Phải >= 14.0

# Cài đặt PostgreSQL:
# - Windows: https://www.postgresql.org/download/windows/
# - Mac: brew install postgresql@14
# - Linux: sudo apt install postgresql-14

# 4. Redis >= 6.0 (Cache server)
redis-cli --version  # Phải >= 6.0

# Cài đặt Redis:
# - Windows: https://github.com/microsoftarchive/redis/releases
# - Mac: brew install redis
# - Linux: sudo apt install redis-server

# 5. Git (Version control)
git --version

# Cài đặt Git:
# - Windows: https://git-scm.com/download/win
# - Mac: brew install git
# - Linux: sudo apt install git
```

**Kiểm tra services đang chạy**:

```bash
# PostgreSQL
pg_isready
# Expected: /var/run/postgresql:5432 - accepting connections

# Redis
redis-cli ping
# Expected: PONG

# Nếu chưa chạy:
# PostgreSQL: sudo service postgresql start
# Redis: sudo service redis-server start
```

### 1.2. Tạo Repo Mới

**Option 1: Clone NestJS Starter (Recommended)**
```bash
# Clone NestJS TypeScript starter template
git clone https://github.com/nestjs/typescript-starter.git social-network-backend
cd social-network-backend

# Remove existing git history
rm -rf .git

# Initialize new git repo
git init
git add .
git commit -m "Initial commit from NestJS starter"
```

**Option 2: Tạo Mới với NestJS CLI**
```bash
# Install NestJS CLI globally
npm install -g @nestjs/cli

# Create new project
nest new social-network-backend

# Choose package manager: yarn (recommended)
cd social-network-backend
```

### 1.3. Cài Đặt Dependencies

**Giải thích**: Dự án này sử dụng 40+ packages, được chia thành các nhóm chức năng. Mỗi package đều có mục đích cụ thể.

#### 📦 Core NestJS Packages
```bash
# NestJS core framework
yarn add @nestjs/common@^11.1.8        # Core decorators & utilities
yarn add @nestjs/core@^11.1.8          # NestJS core engine
yarn add @nestjs/platform-express@^11.1.9  # Express adapter

# Configuration & Environment
yarn add @nestjs/config@^4.0.2         # Environment variables management

# Scheduling (for cache warmup, cron jobs)
yarn add @nestjs/schedule@^6.0.1       # Cron jobs & intervals

# API Documentation
yarn add @nestjs/swagger@^11.2.1       # OpenAPI/Swagger docs

# Rate Limiting (prevent abuse)
yarn add @nestjs/throttler@^6.4.0      # Rate limiting middleware

# WebSocket (real-time features)
yarn add @nestjs/websockets@^11.1.9    # WebSocket support
yarn add @nestjs/platform-socket.io@^11.1.9  # Socket.IO adapter
```

#### 🗄️ Database & ORM
```bash
# Prisma ORM (type-safe database client)
yarn add @prisma/client@^6.19.0        # Prisma client runtime
yarn add -D prisma@^6.19.0             # Prisma CLI (dev only)

# Giải thích: Prisma là ORM hiện đại với:
# - Type-safe queries (TypeScript support)
# - Auto-generated types từ schema
# - Migration system
# - Prisma Studio (GUI for database)
```

#### 💾 Redis & Cache
```bash
# Redis client
yarn add @nestjs-modules/ioredis@^2.0.2  # NestJS Redis module
yarn add ioredis@^5.8.2                  # Redis client library

# Memory cache (LRU)
yarn add lru-cache@10.0.0                # In-memory LRU cache

# Giải thích 2-layer cache:
# - L1 (lru-cache): Memory cache, <1ms, limited size
# - L2 (ioredis): Redis cache, ~50-100ms, unlimited size
```

#### 🔐 Authentication & Security
```bash
# Passport.js (authentication middleware)
yarn add @nestjs/passport@^11.0.5      # NestJS Passport integration
yarn add passport@^0.7.0               # Passport core
yarn add passport-jwt@^4.0.1           # JWT strategy
yarn add passport-google-oauth20@^2.0.0  # Google OAuth
yarn add passport-facebook@^3.0.0      # Facebook OAuth

# JWT tokens
yarn add @nestjs/jwt@^11.0.1           # JWT module

# Password hashing
yarn add argon2@^0.44.0                # Argon2 (secure password hashing)

# 2FA (Two-factor authentication)
yarn add otplib@^12.0.1                # OTP generation & verification

# Type definitions
yarn add -D @types/passport@^1.0.17
yarn add -D @types/passport-jwt@^4.0.1
yarn add -D @types/passport-google-oauth20@^2.0.17
yarn add -D @types/passport-facebook@^3.0.4
```

#### ✅ Validation & Transformation
```bash
# Class validator (DTO validation)
yarn add class-validator@^0.14.2       # Validation decorators
yarn add class-transformer@^0.5.1      # Transform plain objects to class instances

# Giải thích: Dùng để validate request body, query params
# Example: @IsEmail(), @IsString(), @MinLength(3)
```

#### 📁 File Upload & Processing
```bash
# File upload
yarn add multer@^2.0.2                 # File upload middleware
yarn add -D @types/multer@^2.0.0       # Type definitions

# Image processing
yarn add sharp@^0.34.5                 # Fast image resizing/optimization

# Cloud storage
yarn add aws-sdk@^2.1692.0             # AWS S3 for file storage
yarn add cloudinary@^2.8.0             # Cloudinary for image CDN
```

#### 📊 Logging & Monitoring
```bash
# Winston logger (structured logging)
yarn add nest-winston@^1.10.2          # NestJS Winston integration
yarn add winston@^3.18.3               # Winston logger core

# Giải thích: Winston provides:
# - Structured JSON logging
# - Multiple transports (file, console, etc.)
# - Log levels (error, warn, info, debug)
```

#### 🛡️ Security & Utilities
```bash
# Security headers
yarn add helmet@^8.1.0                 # Security headers middleware

# Response compression
yarn add compression@1.8.1             # Gzip compression
yarn add -D @types/compression@1.8.1

# XSS prevention
yarn add sanitize-html@^2.17.0         # Sanitize HTML input

# ID generation
yarn add nanoid@^5.1.6                 # Short unique IDs
yarn add uuid@^13.0.0                  # UUID v4 generation
```

#### 🛠️ Development Tools
```bash
# NestJS CLI & Schematics
yarn add -D @nestjs/cli@^11.0.10       # NestJS CLI
yarn add -D @nestjs/schematics@^11.0.9 # Code generators
yarn add -D @nestjs/testing@^11.0.1    # Testing utilities

# SWC (Fast TypeScript compiler)
yarn add -D @swc/cli@^0.6.0            # SWC CLI
yarn add -D @swc/core@^1.15.0          # SWC core (10x faster than tsc)
yarn add -D @swc/jest@^0.2.39          # SWC Jest transformer

# TypeScript
yarn add -D typescript@^5.7.3          # TypeScript compiler
yarn add -D @types/node@^22.19.0       # Node.js type definitions

# Code Quality
yarn add -D eslint@^9.39.1             # Linter
yarn add -D prettier@^3.6.2            # Code formatter
yarn add -D eslint-config-prettier@^10.1.8  # Disable ESLint formatting rules
yarn add -D eslint-plugin-prettier@^5.5.4   # Run Prettier as ESLint rule

# Testing
yarn add -D jest@^29.7.0               # Testing framework
yarn add -D ts-jest@^29.2.5            # TypeScript Jest transformer
yarn add -D @types/jest@^29.5.14       # Jest type definitions
yarn add -D supertest@^7.0.0           # HTTP testing
yarn add -D @types/supertest@^6.0.2    # Supertest types
```

**Tổng cộng**: ~40 packages, ~500MB node_modules

**Thời gian cài đặt**: 2-5 phút (tùy tốc độ mạng)

---

## 📁 BƯỚC 2: Cấu Trúc Thư Mục

### 2.1. Tạo Cấu Trúc Cơ Bản

**Giải thích**: Dự án sử dụng **Module-based Architecture** - mỗi feature là một module độc lập với controller, service, dto riêng.

```bash
# Tạo thư mục gốc
mkdir -p src/{config,common,auth,modules,prisma}

# === COMMON FOLDER ===
# Chứa code dùng chung cho toàn bộ app
mkdir -p src/common/{constants,dto,enums,interfaces,guards,interceptors,filters,decorators,utils}
mkdir -p src/common/{cache,monitoring,rate-limit,tracing,services}

# Giải thích các thư mục common:
# - constants: Hằng số (cache TTL, error codes, etc.)
# - dto: DTOs dùng chung (pagination, response format)
# - enums: Enums dùng chung (user roles, status, etc.)
# - interfaces: Interfaces dùng chung
# - guards: Auth guards, role guards
# - interceptors: Response transformation, logging
# - filters: Exception filters (error handling)
# - decorators: Custom decorators (@CurrentUser, @Public, etc.)
# - utils: Utility functions (date, string, etc.)
# - cache: 2-layer cache system (Memory + Redis)
# - monitoring: Prometheus metrics, health checks
# - rate-limit: Rate limiting configuration
# - tracing: Request tracing (traceId)

# === AUTH FOLDER ===
# Chứa authentication & authorization logic
mkdir -p src/auth/{dto,guards,strategy,security,controllers,services}

# Giải thích:
# - dto: Login, register, refresh token DTOs
# - guards: JWT guard, OAuth guards
# - strategy: Passport strategies (JWT, Google, Facebook)
# - security: Password hashing, token generation
# - controllers: Auth endpoints (/login, /register, /oauth)
# - services: Auth business logic

# === MODULES FOLDER ===
# Mỗi module là một feature độc lập

# User & Profile modules
mkdir -p src/modules/users/{controller,service,dto,interfaces}
mkdir -p src/modules/profile/{profile-user,profile-views,inventory,love-space,referral,vip}
mkdir -p src/modules/associate/{controller,service,dto}

# Social features
mkdir -p src/modules/posts/{controller,service,dto,interfaces}
mkdir -p src/modules/stories/{controller,service,dto}
mkdir -p src/modules/notifications/{controller,service,dto}

# Messaging & Communication
mkdir -p src/modules/messaging/{controller,service,dto}
mkdir -p src/modules/room/{controllers,services,dto}
mkdir -p src/modules/realtime/{gateway}
mkdir -p src/modules/groups/{controller,service,dto}
mkdir -p src/modules/events/{controller,service,dto}

# Virtual Economy
mkdir -p src/modules/wallet/{controller,service,dto,interfaces}
mkdir -p src/modules/gifts/{controller,service,dto,interfaces}
mkdir -p src/modules/store/{controller,service,dto}
mkdir -p src/modules/payment/{controller,service,interfaces}

# Other features
mkdir -p src/modules/clans/{controller,service,dto}
mkdir -p src/modules/tasks/{controller,service,dto}
mkdir -p src/modules/feedback/{controller,service,dto}
mkdir -p src/modules/support/{controller,service}
mkdir -p src/modules/search/{controller,service,dto}

# === PRISMA FOLDER ===
# Database schema & migrations
mkdir -p src/prisma/migrations

# Giải thích:
# - schema.prisma: Database schema definition
# - migrations/: Database migration files
# - prisma.service.ts: Prisma client service
# - seed-*.ts: Database seeding scripts
```

### 2.2. Cấu Trúc Thư Mục Chi Tiết

```
social-network-backend/
├── src/
│   ├── config/                    # Configuration files
│   │   ├── database.config.ts     # Database config
│   │   ├── jwt.config.ts          # JWT config
│   │   └── config.module.ts       # Config module
│   │
│   ├── common/                    # Shared code
│   │   ├── cache/                 # 2-layer cache system
│   │   │   ├── cache.service.ts           # Main cache service
│   │   │   ├── memory-cache.service.ts    # L1 memory cache
│   │   │   ├── cache-warming.service.ts   # Auto warmup
│   │   │   ├── cache-admin.controller.ts  # Admin endpoints
│   │   │   └── cache.module.ts            # Cache module
│   │   │
│   │   ├── monitoring/            # Metrics & monitoring
│   │   │   ├── metrics.service.ts         # Prometheus metrics
│   │   │   ├── metrics.controller.ts      # Metrics endpoints
│   │   │   └── monitoring.module.ts       # Monitoring module
│   │   │
│   │   ├── guards/                # Auth guards
│   │   │   ├── auth.guard.ts              # JWT auth guard
│   │   │   └── roles.guard.ts             # Role-based guard
│   │   │
│   │   ├── interceptors/          # Response interceptors
│   │   │   └── transform.interceptor.ts   # Response transformation
│   │   │
│   │   ├── filters/               # Exception filters
│   │   │   └── http-exception.filter.ts   # Global error handler
│   │   │
│   │   ├── decorators/            # Custom decorators
│   │   │   ├── current-user.decorator.ts  # @CurrentUser()
│   │   │   └── public.decorator.ts        # @Public()
│   │   │
│   │   └── common.module.ts       # Common module
│   │
│   ├── auth/                      # Authentication
│   │   ├── strategy/
│   │   │   ├── jwt.strategy.ts            # JWT strategy
│   │   │   ├── google.strategy.ts         # Google OAuth
│   │   │   └── facebook.strategy.ts       # Facebook OAuth
│   │   │
│   │   ├── guards/
│   │   │   └── account-auth.guard.ts      # Account auth guard
│   │   │
│   │   ├── services/
│   │   │   └── auth.service.ts            # Auth business logic
│   │   │
│   │   ├── controllers/
│   │   │   └── auth.controller.ts         # Auth endpoints
│   │   │
│   │   └── auth.module.ts         # Auth module
│   │
│   ├── modules/                   # Feature modules
│   │   ├── users/                 # User management
│   │   │   ├── controller/
│   │   │   │   └── user.controller.ts
│   │   │   ├── service/
│   │   │   │   └── user.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   └── update-user.dto.ts
│   │   │   └── users.module.ts
│   │   │
│   │   ├── posts/                 # Posts & feed
│   │   ├── messaging/             # Direct messages
│   │   ├── notifications/         # Notifications
│   │   ├── wallet/                # Virtual wallet
│   │   └── ... (20+ modules)
│   │
│   ├── prisma/                    # Database
│   │   ├── schema.prisma          # Database schema (1300+ lines)
│   │   ├── prisma.service.ts      # Prisma client service
│   │   ├── prisma.module.ts       # Prisma module
│   │   ├── migrations/            # Migration files
│   │   └── seed-*.ts              # Seeding scripts
│   │
│   ├── app.module.ts              # Root module
│   ├── app.controller.ts          # Health check
│   ├── app.service.ts             # App service
│   └── main.ts                    # Bootstrap file
│
├── test/                          # E2E tests
├── dist/                          # Compiled output
├── node_modules/                  # Dependencies
│
├── .env                           # Environment variables
├── .env.example                   # Example env file
├── .gitignore                     # Git ignore
├── .prettierrc                    # Prettier config
├── .swcrc                         # SWC config
├── nest-cli.json                  # NestJS CLI config
├── tsconfig.json                  # TypeScript config
├── package.json                   # Dependencies
├── yarn.lock                      # Yarn lock file
└── README.md                      # Documentation
```

**Tổng số files**: ~400+ TypeScript files  
**Tổng số lines**: ~50,000+ lines of code

### 2.2. Tạo Files Cấu Hình

#### `tsconfig.json`
```json
{
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "resolvePackageJsonExports": true,
    "target": "ES2023",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,
    "incremental": true,
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

#### `nest-cli.json`
```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "builder": "swc",
    "typeCheck": true
  }
}
```

#### `.prettierrc`
```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 120,
  "tabWidth": 2,
  "semi": true
}
```

---

## 🗄️ BƯỚC 3: Setup Database (Prisma)

### 3.1. Initialize Prisma

```bash
# Initialize Prisma
npx prisma init --datasource-provider postgresql

# Move schema to src/prisma
mv prisma/schema.prisma src/prisma/
rmdir prisma
```

### 3.2. Update package.json Scripts

```json
{
  "scripts": {
    "postinstall": "prisma generate --schema=./src/prisma/schema.prisma",
    "prisma:dev": "prisma migrate dev --schema=./src/prisma/schema.prisma",
    "prisma:deploy": "prisma migrate deploy --schema=./src/prisma/schema.prisma",
    "prisma:generate": "prisma generate --schema=./src/prisma/schema.prisma",
    "prisma:reset": "prisma migrate reset --schema=./src/prisma/schema.prisma"
  }
}
```

### 3.3. Create Prisma Schema

**File**: `src/prisma/schema.prisma`

**Giải thích**: Schema này định nghĩa toàn bộ database structure với 50+ models, 100+ relations, và 30+ indexes được optimize cho performance.

**Lưu ý quan trọng**:
- Schema đầy đủ có **1363 lines** - đây chỉ là phiên bản minimal để bắt đầu
- Copy full schema từ dự án cũ sau khi setup xong core infrastructure
- Các indexes được thiết kế để optimize queries phổ biến (feed, search, etc.)

#### Phiên Bản Minimal (Để Bắt Đầu)

```prisma
// ==================== GENERATOR & DATASOURCE ====================
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "linux-musl"]  // Support Docker deployment
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== ENUMS ====================
enum UserBasicRole {
  admin    // Full access
  user     // Normal user
  guest    // Limited access
}

enum ProviderEnum {
  anonymous  // Guest account
  phone      // Phone number login
  facebook   // Facebook OAuth
  microsoft  // Microsoft OAuth
  google     // Google OAuth
  apple      // Apple OAuth
  password   // Email/password
}

enum PostPrivacy {
  public   // Everyone can see
  private  // Only me
  friends  // Only friends
}

enum PostReaction {
  like
  love
  haha
  wow
  sad
  angry
}

enum NotificationType {
  MESSAGE
  FOLLOW
  LIKE
  COMMENT
  GIFT
  POST
  SYSTEM
}

enum NotificationStatus {
  UNREAD
  READ
}

// ==================== USER MODEL ====================
model ResUser {
  id         String    @id @default(uuid())
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt
  deleted_at DateTime?
  is_deleted Boolean   @default(false)

  // Authentication
  union_id   String        @unique  // Unique identifier across providers
  role       UserBasicRole @default(guest)
  is_blocked Boolean       @default(false)

  // Profile
  nickname   String
  bio        String?
  avatar     String?
  gender     String?
  birthday   DateTime?

  // Relations - Social
  followers    ResFollow[]     @relation("Followers")
  following    ResFollow[]     @relation("Following")
  friendsA     ResFriend[]     @relation("FriendsA")
  friendsB     ResFriend[]     @relation("FriendsB")
  
  // Relations - Content
  post         ResPost[]
  postComments ResComment[]    @relation("CommentAuthor")
  postLikes    ResPostLike[]
  
  // Relations - Messaging
  messagesSent ResMessage[]    @relation("MessagesSent")
  messagesRecv ResMessage[]    @relation("MessagesRecv")
  
  // Relations - Notifications
  notificationsSent ResNotification[] @relation("NotificationSender")
  notificationsRecv ResNotification[] @relation("NotificationReceiver")

  // Indexes for performance
  @@index([union_id])
  @@index([nickname])
  @@index([created_at])
  @@index([is_deleted, is_blocked])
  @@index([nickname, created_at])  // Composite: Search + Sort
  @@index([is_deleted, is_blocked, created_at])  // Composite: Filter + Sort
  @@map("res_user")
}

// ==================== FOLLOW MODEL ====================
// One-way relationship: A follows B
model ResFollow {
  id         String   @id @default(uuid())
  created_at DateTime @default(now())

  follower_id  String  // User who follows
  following_id String  // User being followed

  follower  ResUser @relation("Followers", fields: [follower_id], references: [id])
  following ResUser @relation("Following", fields: [following_id], references: [id])

  @@unique([follower_id, following_id])  // Prevent duplicate follows
  @@index([follower_id])
  @@index([following_id])
  @@index([follower_id, created_at])   // Performance: Get following list sorted
  @@index([following_id, created_at])  // Performance: Get followers list sorted
  @@map("res_follow")
}

// ==================== FRIEND MODEL ====================
// Two-way relationship: A ↔ B
model ResFriend {
  id         String   @id @default(uuid())
  created_at DateTime @default(now())

  user_a_id String
  user_b_id String

  userA ResUser @relation("FriendsA", fields: [user_a_id], references: [id])
  userB ResUser @relation("FriendsB", fields: [user_b_id], references: [id])

  @@unique([user_a_id, user_b_id])  // Prevent duplicate friendships
  @@index([user_a_id])
  @@index([user_b_id])
  @@index([user_a_id, created_at])  // Performance: Get user A's friends sorted
  @@index([user_b_id, created_at])  // Performance: Get user B's friends sorted
  @@map("res_friend")
}

// ==================== POST MODEL ====================
model ResPost {
  id          String      @id @default(uuid())
  user_id     String
  content     String
  privacy     PostPrivacy @default(public)
  share_count Int         @default(0)
  created_at  DateTime    @default(now())
  updated_at  DateTime    @updatedAt

  user     ResUser       @relation(fields: [user_id], references: [id])
  comments ResComment[]
  likes    ResPostLike[]

  @@index([user_id])
  @@index([created_at])
  @@index([privacy])
  @@index([user_id, created_at])    // Performance: Get user's posts sorted
  @@index([privacy, created_at])    // Performance: Get public posts sorted
  @@map("res_post")
}

// ==================== COMMENT MODEL ====================
model ResComment {
  id         String   @id @default(uuid())
  post_id    String
  user_id    String
  content    String?
  parent_id  String?  // For nested comments
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  post    ResPost     @relation(fields: [post_id], references: [id], onDelete: Cascade)
  user    ResUser     @relation("CommentAuthor", fields: [user_id], references: [id], onDelete: Cascade)
  parent  ResComment? @relation("CommentReplies", fields: [parent_id], references: [id], onDelete: Cascade)
  replies ResComment[] @relation("CommentReplies")

  @@index([post_id])
  @@index([user_id])
  @@index([parent_id])
  @@index([created_at])
  @@index([post_id, created_at])  // Performance: Get post comments sorted
  @@index([user_id, created_at])  // Performance: Get user's comments sorted
  @@map("res_comment")
}

// ==================== POST LIKE MODEL ====================
model ResPostLike {
  id         String       @id @default(uuid())
  post_id    String
  user_id    String
  reaction   PostReaction @default(like)
  created_at DateTime     @default(now())

  post ResPost @relation(fields: [post_id], references: [id], onDelete: Cascade)
  user ResUser @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@unique([post_id, user_id])  // One reaction per user per post
  @@index([post_id])
  @@index([user_id])
  @@map("res_post_like")
}

// ==================== MESSAGE MODEL ====================
model ResMessage {
  id          String   @id @default(uuid())
  sender_id   String
  receiver_id String
  type        String   @default("text")  // text, image, video, audio, gift
  content     String?
  media_url   String?
  is_read     Boolean  @default(false)
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  sender   ResUser @relation("MessagesSent", fields: [sender_id], references: [id])
  receiver ResUser @relation("MessagesRecv", fields: [receiver_id], references: [id])

  @@index([sender_id])
  @@index([receiver_id])
  @@index([receiver_id, created_at])
  @@index([created_at])
  @@index([deleted_at])
  @@map("res_message")
}

// ==================== NOTIFICATION MODEL ====================
model ResNotification {
  id         String             @id @default(uuid())
  created_at DateTime           @default(now())
  updated_at DateTime           @updatedAt

  user_id   String  // Receiver
  sender_id String? // Sender (null for system notifications)
  type      NotificationType
  status    NotificationStatus @default(UNREAD)
  title     String
  content   String
  data      String?  // JSON data
  link      String?  // Link to related content

  user   ResUser  @relation("NotificationReceiver", fields: [user_id], references: [id], onDelete: Cascade)
  sender ResUser? @relation("NotificationSender", fields: [sender_id], references: [id], onDelete: SetNull)

  @@index([user_id, status])
  @@index([user_id, created_at])
  @@index([status])
  @@map("res_notification")
}
```

**Lưu ý**: 
- Đây là **minimal schema** với 9 models cơ bản
- Full schema có **50+ models** bao gồm: Wallet, Gifts, Groups, Events, Rooms, Stories, etc.
- Copy full schema từ `src/prisma/schema.prisma` của dự án cũ sau khi test xong minimal version
- Tất cả indexes đã được optimize dựa trên slow query analysis

### 3.4. Create .env File

**File**: `.env`

**Giải thích**: File này chứa tất cả environment variables. **KHÔNG commit file này lên Git** (đã có trong .gitignore).

```bash
# ==================== DATABASE ====================
# PostgreSQL connection string
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/social_network?schema=public"

# Giải thích:
# - postgres:postgres = username:password (change in production!)
# - localhost:5432 = host:port
# - social_network = database name
# - schema=public = PostgreSQL schema

# ==================== REDIS ====================
# Redis cache server configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=          # Empty for local, set in production
REDIS_DB=0               # Database number (0-15)

# Giải thích:
# - REDIS_HOST: Redis server hostname
# - REDIS_PORT: Redis server port (default 6379)
# - REDIS_PASSWORD: Leave empty for local dev, set strong password in production
# - REDIS_DB: Redis database number (0-15), use different numbers for different envs

# ==================== JWT AUTHENTICATION ====================
# JWT secret keys - MUST be changed in production!
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=15m       # Access token expiry (15 minutes)
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production-min-32-chars
JWT_REFRESH_EXPIRES_IN=7d  # Refresh token expiry (7 days)

# Giải thích:
# - JWT_SECRET: Secret key for signing access tokens (min 32 characters)
# - JWT_EXPIRES_IN: Access token lifetime (short for security)
# - JWT_REFRESH_SECRET: Secret key for refresh tokens (different from JWT_SECRET!)
# - JWT_REFRESH_EXPIRES_IN: Refresh token lifetime (longer, for "remember me")

# Security best practices:
# - Use different secrets for access and refresh tokens
# - Generate random strings: openssl rand -base64 32
# - Rotate secrets periodically in production

# ==================== OAUTH 2.0 ====================
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/oauth/google/callback

# Facebook OAuth
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_CALLBACK_URL=http://localhost:3000/api/auth/oauth/facebook/callback

# Giải thích:
# - Get Google credentials: https://console.cloud.google.com/apis/credentials
# - Get Facebook credentials: https://developers.facebook.com/apps/
# - Callback URLs must match exactly what's configured in OAuth provider

# ==================== FILE STORAGE ====================
# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Cloudinary (for image CDN)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Giải thích:
# - AWS S3: Primary file storage (videos, documents, etc.)
# - Cloudinary: Image CDN with automatic optimization
# - Get AWS credentials: https://console.aws.amazon.com/iam/
# - Get Cloudinary credentials: https://cloudinary.com/console

# ==================== APPLICATION ====================
# Server configuration
PORT=3000                # Server port
NODE_ENV=development     # Environment: development | production | test
CORS_ORIGIN=*            # CORS allowed origins (* for dev, specific domains in prod)

# Cache configuration
SKIP_CACHE_WARMUP=0      # Set to 1 to disable auto cache warmup on startup

# Logging
LOG_LEVEL=info           # Log level: error | warn | info | debug

# Giải thích:
# - PORT: HTTP server port (default 3000)
# - NODE_ENV: Affects logging, error messages, cache behavior
# - SKIP_CACHE_WARMUP: Useful for testing or when Redis is not available

# ==================== OPTIONAL FEATURES ====================
# Firebase (for push notifications)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Sentry (for error tracking)
SENTRY_DSN=your-sentry-dsn

# Giải thích:
# - Firebase: For mobile push notifications
# - Sentry: For production error tracking and monitoring
```

### 3.4.1. Create .env.example

**File**: `.env.example`

**Giải thích**: Template file để commit lên Git, không chứa sensitive data.

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/social_network?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_SECRET=change-this-to-random-string-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=change-this-to-different-random-string-min-32-chars
JWT_REFRESH_EXPIRES_IN=7d

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/oauth/google/callback

FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_CALLBACK_URL=http://localhost:3000/api/auth/oauth/facebook/callback

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# App
PORT=3000
NODE_ENV=development
SKIP_CACHE_WARMUP=0
```

### 3.4.2. Setup Database

```bash
# 1. Create PostgreSQL database
createdb social_network

# Or using psql:
psql -U postgres
CREATE DATABASE social_network;
\q

# 2. Verify connection
psql -U postgres -d social_network -c "SELECT version();"

# 3. Update .env with correct credentials
# Edit DATABASE_URL with your actual username/password
```

### 3.5. Run First Migration

**Giải thích**: Migration tạo database tables từ Prisma schema.

```bash
# 1. Generate Prisma Client (creates TypeScript types)
yarn prisma generate --schema=./src/prisma/schema.prisma

# Output:
# ✔ Generated Prisma Client (v6.19.0)
# ✔ Types generated in node_modules/@prisma/client

# 2. Create and apply migration
yarn prisma migrate dev --name init --schema=./src/prisma/schema.prisma

# Output:
# Prisma schema loaded from src/prisma/schema.prisma
# Datasource "db": PostgreSQL database "social_network"
# 
# Applying migration `20241201000000_init`
# 
# The following migration(s) have been created and applied from new schema changes:
# 
# migrations/
#   └─ 20241201000000_init/
#       └─ migration.sql
# 
# ✔ Generated Prisma Client (v6.19.0)
```

### 3.6. Verify Database Setup

```bash
# 1. Check tables created
psql -U postgres -d social_network -c "\dt"

# Expected output:
#              List of relations
#  Schema |       Name        | Type  |  Owner
# --------+-------------------+-------+----------
#  public | res_user          | table | postgres
#  public | res_follow        | table | postgres
#  public | res_friend        | table | postgres
#  public | res_post          | table | postgres
#  public | res_comment       | table | postgres
#  public | res_post_like     | table | postgres
#  public | res_message       | table | postgres
#  public | res_notification  | table | postgres
#  public | _prisma_migrations| table | postgres

# 2. Check indexes created
psql -U postgres -d social_network -c "SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;"

# Expected: 20+ indexes

# 3. Open Prisma Studio (GUI for database)
yarn prisma studio --schema=./src/prisma/schema.prisma

# Opens browser at http://localhost:5555
# You can view/edit data visually
```

### 3.7. Create Seed Data (Optional)

**File**: `src/prisma/seed-users.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const admin = await prisma.resUser.create({
    data: {
      union_id: 'admin-001',
      nickname: 'Admin',
      role: 'admin',
      bio: 'System Administrator',
      avatar: 'https://i.pravatar.cc/150?img=1',
    },
  });

  console.log('✅ Created admin user:', admin.id);

  // Create test users
  const users = await Promise.all(
    Array.from({ length: 10 }, (_, i) => 
      prisma.resUser.create({
        data: {
          union_id: `user-${String(i + 1).padStart(3, '0')}`,
          nickname: `User ${i + 1}`,
          role: 'user',
          bio: `Test user ${i + 1}`,
          avatar: `https://i.pravatar.cc/150?img=${i + 2}`,
        },
      })
    )
  );

  console.log(`✅ Created ${users.length} test users`);

  // Create some follows
  await prisma.resFollow.create({
    data: {
      follower_id: users[0].id,
      following_id: admin.id,
    },
  });

  console.log('✅ Created test follows');

  // Create test posts
  const posts = await Promise.all(
    users.slice(0, 5).map((user, i) =>
      prisma.resPost.create({
        data: {
          user_id: user.id,
          content: `This is test post ${i + 1} from ${user.nickname}`,
          privacy: 'public',
        },
      })
    )
  );

  console.log(`✅ Created ${posts.length} test posts`);

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Run seed**:
```bash
# Add to package.json scripts:
"seed:users": "ts-node -r tsconfig-paths/register src/prisma/seed-users.ts"

# Run seed
yarn seed:users
```

---

## ✅ PART 1 Checklist

Trước khi chuyển sang PART 2, hãy verify:

- [ ] **Node.js >= 20.0.0** installed
- [ ] **Yarn >= 1.22.0** installed
- [ ] **PostgreSQL >= 14** installed and running
- [ ] **Redis >= 6.0** installed and running
- [ ] **All dependencies** installed (~40 packages)
- [ ] **Folder structure** created
- [ ] **Config files** created (tsconfig.json, nest-cli.json, .prettierrc)
- [ ] **Prisma schema** created
- [ ] **.env file** created with correct values
- [ ] **Database** created (social_network)
- [ ] **Migration** applied successfully
- [ ] **Prisma Client** generated
- [ ] **Tables** created in database (verify with psql or Prisma Studio)
- [ ] **Seed data** created (optional)

**Verify everything works**:
```bash
# 1. Check Prisma Client generated
ls node_modules/@prisma/client
# Should see: index.d.ts, index.js, etc.

# 2. Check database connection
yarn prisma studio --schema=./src/prisma/schema.prisma
# Should open browser at http://localhost:5555

# 3. Check Redis connection
redis-cli ping
# Should return: PONG
```

---

## 📊 Progress Summary

**Completed**:
- ✅ Environment setup (Node, Yarn, PostgreSQL, Redis)
- ✅ Project initialization
- ✅ Dependencies installation (40+ packages)
- ✅ Folder structure (Module-based architecture)
- ✅ Configuration files (TypeScript, NestJS, Prettier)
- ✅ Database setup (Prisma + PostgreSQL)
- ✅ Schema definition (9 core models)
- ✅ Environment variables (.env)
- ✅ First migration
- ✅ Seed data (optional)

**Next Steps** (PART 2):
- 🔄 Prisma Module & Service
- 🔄 Config Module (Database, JWT)
- 🔄 2-Layer Cache System (Memory + Redis)
- 🔄 Common Module (Filters, Interceptors, Guards)
- 🔄 Authentication Module (JWT, OAuth)

**Estimated Time**:
- PART 1: ✅ **30-45 minutes** (completed)
- PART 2: 🔄 **45-60 minutes** (next)
- PART 3: ⏳ **45-60 minutes**

**Total**: ~2-3 hours for complete setup

---

**🎯 Tiếp tục với [PART 2: Core Modules & Authentication](REBUILD_GUIDE_PART2.md)**
