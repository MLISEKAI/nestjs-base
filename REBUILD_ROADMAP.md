# 🗺️ LỘ TRÌNH REBUILD DỰ ÁN - CHI TIẾT TỪNG BƯỚC

**Mục tiêu**: Rebuild lại toàn bộ Social Network Backend từ đầu  
**Thời gian ước tính**: 2-3 giờ  
**Phương pháp**: Làm tuần tự theo từng bước, commit sau mỗi bước hoàn thành

---

## 📋 CHUẨN BỊ (5 phút)

### Bước 0: Tạo Repo Mới

```bash
# Tạo thư mục mới
mkdir social-network-backend-new
cd social-network-backend-new

# Initialize git
git init
git branch -M main

# Tạo .gitignore
cat > .gitignore << 'EOF'
node_modules/
dist/
.env
.env.local
.env.*.local
*.log
.DS_Store
coverage/
.vscode/
.idea/
EOF

# First commit
git add .gitignore
git commit -m "chore: initialize project with .gitignore"
```

**✅ Checklist**:
- [ ] Thư mục mới đã tạo
- [ ] Git đã initialize
- [ ] .gitignore đã tạo
- [ ] First commit đã push

---

## 🏗️ PHASE 1: CƠ SỞ HẠ TẦNG (30-45 phút)

### Bước 1.1: Clone NestJS Starter (5 phút)

```bash
# Clone NestJS starter
git clone https://github.com/nestjs/typescript-starter.git temp
cp -r temp/* .
cp -r temp/.* . 2>/dev/null || true
rm -rf temp

# Install dependencies
yarn install
```

**Commit**:
```bash
git add .
git commit -m "feat: add NestJS starter template"
```

**✅ Checklist**:
- [ ] NestJS starter đã clone
- [ ] Dependencies đã install
- [ ] Commit đã tạo

---

### Bước 1.2: Cài Đặt Core Dependencies (10 phút)

```bash
# Core NestJS
yarn add @nestjs/common@^11.1.8 @nestjs/core@^11.1.8 @nestjs/platform-express@^11.1.9
yarn add @nestjs/config@^4.0.2 @nestjs/schedule@^6.0.1 @nestjs/swagger@^11.2.1
yarn add @nestjs/throttler@^6.4.0 @nestjs/websockets@^11.1.9 @nestjs/platform-socket.io@^11.1.9

# Database & ORM
yarn add @prisma/client@^6.19.0
yarn add -D prisma@^6.19.0

# Redis & Cache
yarn add @nestjs-modules/ioredis@^2.0.2 ioredis@^5.8.2 lru-cache@10.0.0

# Authentication
yarn add @nestjs/passport@^11.0.5 @nestjs/jwt@^11.0.1
yarn add passport@^0.7.0 passport-jwt@^4.0.1
yarn add argon2@^0.44.0

# Validation
yarn add class-validator@^0.14.2 class-transformer@^0.5.1

# Utilities
yarn add helmet@^8.1.0 compression@1.8.1
```

**Commit**:
```bash
git add package.json yarn.lock
git commit -m "feat: install core dependencies (NestJS, Prisma, Redis, Auth)"
```

**✅ Checklist**:
- [ ] Core dependencies đã install
- [ ] package.json đã update
- [ ] yarn.lock đã tạo
- [ ] Commit đã tạo

---

### Bước 1.3: Tạo Cấu Trúc Thư Mục (5 phút)

```bash
# Tạo folders
mkdir -p src/{config,common,auth,modules,prisma}
mkdir -p src/common/{cache,monitoring,filters,interceptors,decorators}
mkdir -p src/auth/{dto,guards,strategy,services,controllers}
mkdir -p src/modules/{users,posts,notifications}
mkdir -p src/prisma/migrations
```

**Commit**:
```bash
git add src/
git commit -m "chore: create project folder structure"
```

**✅ Checklist**:
- [ ] Folders đã tạo
- [ ] Cấu trúc đúng theo design
- [ ] Commit đã tạo

---

### Bước 1.4: Tạo Config Files (5 phút)

**File 1**: `tsconfig.json`
```json
{
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "target": "ES2023",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./"
  }
}
```

**File 2**: `nest-cli.json`
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

**File 3**: `.prettierrc`
```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 120,
  "tabWidth": 2,
  "semi": true
}
```

**Commit**:
```bash
git add tsconfig.json nest-cli.json .prettierrc
git commit -m "chore: add TypeScript and NestJS config files"
```

**✅ Checklist**:
- [ ] tsconfig.json đã tạo
- [ ] nest-cli.json đã tạo
- [ ] .prettierrc đã tạo
- [ ] Commit đã tạo

---

### Bước 1.5: Setup Prisma (10 phút)

```bash
# Initialize Prisma
npx prisma init --datasource-provider postgresql

# Move schema to src/prisma
mv prisma/schema.prisma src/prisma/
rmdir prisma
```

**File**: `src/prisma/schema.prisma` (Copy từ REBUILD_GUIDE_PART1.md - minimal version)

**File**: `.env`
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/social_network?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
```

**Update package.json scripts**:
```json
{
  "scripts": {
    "postinstall": "prisma generate --schema=./src/prisma/schema.prisma",
    "prisma:generate": "prisma generate --schema=./src/prisma/schema.prisma",
    "prisma:migrate": "prisma migrate dev --schema=./src/prisma/schema.prisma"
  }
}
```

**Commit**:
```bash
git add src/prisma/schema.prisma .env.example package.json
git commit -m "feat: setup Prisma with PostgreSQL schema"
```

**✅ Checklist**:
- [ ] Prisma đã initialize
- [ ] Schema đã tạo
- [ ] .env đã tạo
- [ ] Scripts đã update
- [ ] Commit đã tạo

---

### Bước 1.6: Run First Migration (5 phút)

```bash
# Create database
createdb social_network

# Generate Prisma Client
yarn prisma:generate

# Create migration
yarn prisma:migrate --name init

# Verify
yarn prisma studio
```

**Commit**:
```bash
git add src/prisma/migrations/
git commit -m "feat: create initial database migration"
```

**✅ Checklist**:
- [ ] Database đã tạo
- [ ] Prisma Client đã generate
- [ ] Migration đã chạy
- [ ] Tables đã tạo trong DB
- [ ] Commit đã tạo

---

## 🔧 PHASE 2: CORE MODULES (45-60 phút)

### Bước 2.1: Prisma Module (10 phút)

**File 1**: `src/prisma/prisma.module.ts`
**File 2**: `src/prisma/prisma.service.ts`

(Copy code từ REBUILD_GUIDE_PART2.md)

**Commit**:
```bash
git add src/prisma/
git commit -m "feat: add Prisma module with lifecycle hooks"
```

**✅ Checklist**:
- [ ] prisma.module.ts đã tạo
- [ ] prisma.service.ts đã tạo
- [ ] Code đã copy và customize
- [ ] Commit đã tạo

---

### Bước 2.2: Config Module (10 phút)

**File 1**: `src/config/database.config.ts`
**File 2**: `src/config/jwt.config.ts`
**File 3**: `src/config/redis.config.ts`
**File 4**: `src/config/app.config.ts`
**File 5**: `src/config/config.module.ts`

(Copy code từ REBUILD_GUIDE_PART2.md)

**Commit**:
```bash
git add src/config/
git commit -m "feat: add Config module with environment management"
```

**✅ Checklist**:
- [ ] 4 config files đã tạo
- [ ] config.module.ts đã tạo
- [ ] Commit đã tạo

---

### Bước 2.3: Cache Module - Memory Cache (10 phút)

**File**: `src/common/cache/memory-cache.service.ts`

(Copy code từ REBUILD_GUIDE_PART2.md)

**Commit**:
```bash
git add src/common/cache/memory-cache.service.ts
git commit -m "feat: add Memory Cache Service (L1 cache)"
```

**✅ Checklist**:
- [ ] memory-cache.service.ts đã tạo
- [ ] LRU cache đã implement
- [ ] Commit đã tạo

---

### Bước 2.4: Cache Module - Cache Service (15 phút)

**File 1**: `src/common/cache/cache.service.ts`
**File 2**: `src/common/cache/cache.module.ts`
**File 3**: `src/common/cache/cache-ttl.constants.ts`

(Copy code từ REBUILD_GUIDE_PART2.md)

**Commit**:
```bash
git add src/common/cache/
git commit -m "feat: add 2-layer Cache System (Memory + Redis)"
```

**✅ Checklist**:
- [ ] cache.service.ts đã tạo
- [ ] cache.module.ts đã tạo
- [ ] cache-ttl.constants.ts đã tạo
- [ ] Redis connection đã config
- [ ] Commit đã tạo

---

### Bước 2.5: Common Module (10 phút)

**File 1**: `src/common/filters/http-exception.filter.ts`
**File 2**: `src/common/interceptors/transform.interceptor.ts`
**File 3**: `src/common/decorators/current-user.decorator.ts`
**File 4**: `src/common/decorators/public.decorator.ts`
**File 5**: `src/common/common.module.ts`

(Copy code từ REBUILD_GUIDE_PART2.md)

**Commit**:
```bash
git add src/common/
git commit -m "feat: add Common module (Filters, Interceptors, Decorators)"
```

**✅ Checklist**:
- [ ] Exception filter đã tạo
- [ ] Transform interceptor đã tạo
- [ ] Decorators đã tạo
- [ ] common.module.ts đã tạo
- [ ] Commit đã tạo

---

### Bước 2.6: Auth Module (15 phút)

**File 1**: `src/auth/strategy/jwt.strategy.ts`
**File 2**: `src/auth/guards/account-auth.guard.ts`
**File 3**: `src/auth/services/auth.service.ts`
**File 4**: `src/auth/controllers/auth.controller.ts`
**File 5**: `src/auth/dto/login.dto.ts`
**File 6**: `src/auth/dto/register.dto.ts`
**File 7**: `src/auth/auth.module.ts`

(Copy code từ REBUILD_GUIDE_PART2.md)

**Commit**:
```bash
git add src/auth/
git commit -m "feat: add Auth module (JWT + Login/Register)"
```

**✅ Checklist**:
- [ ] JWT Strategy đã tạo
- [ ] Auth Guard đã tạo
- [ ] Auth Service đã tạo
- [ ] Auth Controller đã tạo
- [ ] DTOs đã tạo
- [ ] auth.module.ts đã tạo
- [ ] Commit đã tạo

---

## 🚀 PHASE 3: APP INTEGRATION (30 phút)

### Bước 3.1: App Module (10 phút)

**File**: `src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

// Config
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';
import appConfig from './config/app.config';

// Core Modules
import { PrismaModule } from './prisma/prisma.module';
import { CacheModule } from './common/cache/cache.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';

// Filters & Interceptors
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, redisConfig, appConfig],
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    CacheModule,
    CommonModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
```

**Commit**:
```bash
git add src/app.module.ts
git commit -m "feat: integrate all modules in AppModule"
```

**✅ Checklist**:
- [ ] app.module.ts đã tạo
- [ ] Tất cả modules đã import
- [ ] Global guards/filters/interceptors đã setup
- [ ] Commit đã tạo

---

### Bước 3.2: Main.ts Bootstrap (10 phút)

**File**: `src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Social Network API')
    .setDescription('Social Network Backend API')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT-auth')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`\n🚀 Application running on: http://localhost:${port}`);
  console.log(`📚 Swagger: http://localhost:${port}/swagger\n`);
}

bootstrap();
```

**Commit**:
```bash
git add src/main.ts
git commit -m "feat: setup main.ts with Swagger, CORS, Security"
```

**✅ Checklist**:
- [ ] main.ts đã tạo
- [ ] Swagger đã setup
- [ ] Security (Helmet, CORS) đã setup
- [ ] Validation đã setup
- [ ] Commit đã tạo

---

### Bước 3.3: Test Build & Run (10 phút)

```bash
# Build
yarn build

# Run
yarn start:dev

# Test endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/swagger
```

**Commit** (nếu có fixes):
```bash
git add .
git commit -m "fix: resolve build errors and test endpoints"
```

**✅ Checklist**:
- [ ] Build thành công
- [ ] App chạy được
- [ ] Swagger accessible
- [ ] No errors trong console
- [ ] Commit đã tạo (nếu có fixes)

---

## 📊 PHASE 4: MONITORING (Optional - 30 phút)

### Bước 4.1: Metrics Service (15 phút)

**File 1**: `src/common/monitoring/metrics.service.ts`
**File 2**: `src/common/monitoring/metrics.controller.ts`
**File 3**: `src/common/monitoring/monitoring.module.ts`

(Copy từ dự án cũ hoặc viết mới)

**Commit**:
```bash
git add src/common/monitoring/
git commit -m "feat: add Monitoring module with Prometheus metrics"
```

---

### Bước 4.2: Cache Warming (15 phút)

**File 1**: `src/common/cache/cache-warming.service.ts`
**File 2**: `src/common/cache/cache-admin.controller.ts`

(Copy từ dự án cũ)

**Commit**:
```bash
git add src/common/cache/cache-warming.service.ts
git add src/common/cache/cache-admin.controller.ts
git commit -m "feat: add Cache Warming Service (Auto + Selective)"
```

---

## 🎯 FINAL CHECKLIST

### Infrastructure ✅
- [ ] Node.js, Yarn, PostgreSQL, Redis installed
- [ ] Project initialized
- [ ] Dependencies installed
- [ ] Folder structure created
- [ ] Config files created

### Database ✅
- [ ] Prisma setup
- [ ] Schema created
- [ ] Migration run
- [ ] Tables created

### Core Modules ✅
- [ ] Prisma Module
- [ ] Config Module
- [ ] Cache Module (2-layer)
- [ ] Common Module
- [ ] Auth Module

### App Integration ✅
- [ ] App Module
- [ ] Main.ts
- [ ] Build successful
- [ ] App runs

### Optional ⏳
- [ ] Monitoring Module
- [ ] Cache Warming
- [ ] Docker setup
- [ ] Deployment docs

---

## 📝 GIT COMMIT HISTORY MẪU

```
1. chore: initialize project with .gitignore
2. feat: add NestJS starter template
3. feat: install core dependencies (NestJS, Prisma, Redis, Auth)
4. chore: create project folder structure
5. chore: add TypeScript and NestJS config files
6. feat: setup Prisma with PostgreSQL schema
7. feat: create initial database migration
8. feat: add Prisma module with lifecycle hooks
9. feat: add Config module with environment management
10. feat: add Memory Cache Service (L1 cache)
11. feat: add 2-layer Cache System (Memory + Redis)
12. feat: add Common module (Filters, Interceptors, Decorators)
13. feat: add Auth module (JWT + Login/Register)
14. feat: integrate all modules in AppModule
15. feat: setup main.ts with Swagger, CORS, Security
16. fix: resolve build errors and test endpoints
17. feat: add Monitoring module with Prometheus metrics (optional)
18. feat: add Cache Warming Service (Auto + Selective) (optional)
19. docs: update README with setup instructions
20. chore: prepare for deployment
```

---

## ⏱️ THỜI GIAN ƯỚC TÍNH

| Phase | Thời Gian | Commits |
|-------|-----------|---------|
| Chuẩn bị | 5 phút | 1 |
| Phase 1: Infrastructure | 30-45 phút | 6 |
| Phase 2: Core Modules | 45-60 phút | 6 |
| Phase 3: App Integration | 30 phút | 3 |
| Phase 4: Monitoring (Optional) | 30 phút | 2 |
| **TỔNG** | **2-3 giờ** | **16-20** |

---

## 🎯 TIPS

1. **Commit thường xuyên**: Sau mỗi bước nhỏ
2. **Test sau mỗi phase**: Đảm bảo không có lỗi
3. **Copy code thông minh**: Copy từ REBUILD_GUIDE, không gõ lại
4. **Đọc comments**: Hiểu code trước khi copy
5. **Verify checklist**: Đánh dấu ✅ sau mỗi bước

---

**Bắt đầu từ**: Bước 0 - Tạo Repo Mới  
**Kết thúc tại**: Bước 3.3 - Test Build & Run  
**Thời gian**: 2-3 giờ  
**Kết quả**: Social Network Backend hoàn chỉnh với Core Features
