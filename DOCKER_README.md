# 🐳 Docker Setup - Hướng Dẫn

## ⚡ Quick Start

### 1. Tạo file .env

```cmd
copy env.example .env
notepad .env
```

**Bắt buộc thay đổi:**

```env
POSTGRES_PASSWORD=your_password
JWT_TOKEN_SECRET=your-secret-min-32-chars
```

### 2. Chạy

**Production (tất cả trong Docker):**

```cmd
docker-compose up -d
```

**Development (chỉ databases):**

```cmd
docker-compose up -d postgres redis
npm run start:dev
```

### 3. Truy cập

- API: http://localhost:3001
- Swagger: http://localhost:3001/api

---

## 🎯 Database Options

### Option 1: Docker PostgreSQL (Mặc định)

**File .env:**

```env
# Không cần DATABASE_URL, docker-compose.yml tự set
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=nestjs_db
```

**Chạy:**

```cmd
docker-compose up -d
```

### Option 2: Neon Cloud Database (Khuyến nghị)

**File .env:**

```env
# Dùng Neon database
DATABASE_URL=postgresql://user:pass@host.neon.tech/db?sslmode=require

# Không cần PostgreSQL container
# Chỉ chạy app và redis
```

**Chạy:**

```cmd
docker-compose up -d app redis
```

**Lợi ích:**

- ✅ Managed service
- ✅ Auto backup
- ✅ Không cần quản lý database

---

## 🛠️ Commands

### Windows (docker.bat)

```cmd
docker.bat up          # Start production
docker.bat dev         # Start development
docker.bat down        # Stop
docker.bat logs        # View logs
docker.bat migrate     # Run migrations
docker.bat generate    # Generate Prisma Client
docker.bat studio      # Open Prisma Studio
docker.bat help        # Show all commands
```

### Linux/Mac (Makefile)

```bash
make up-build          # Build and start
make dev               # Development mode
make migrate           # Run migrations
make generate          # Generate Prisma Client
make studio            # Prisma Studio
make help              # Show all commands
```

---

## 🔄 Migrations

### Tự động

Migrations tự động chạy khi container start (trong `docker-entrypoint.sh`)

### Thủ công

**Từ máy local (khuyến nghị cho Neon):**

```cmd
npx prisma migrate deploy --schema=./src/prisma/schema.prisma
```

**Từ container:**

```cmd
docker.bat migrate
# Hoặc
make migrate
```

---

## 📊 Services

| Service  | Port | Description                    |
| -------- | ---- | ------------------------------ |
| postgres | 5432 | PostgreSQL Database (optional) |
| redis    | 6379 | Redis Cache                    |
| app      | 3001 | NestJS Application             |

---

## 🔧 Troubleshooting

### Container restart liên tục

```cmd
REM Xem logs
docker-compose logs -f app

REM Kiểm tra health
docker-compose ps
```

### Migration failed

```cmd
REM Chạy từ local (khuyến nghị)
npx prisma migrate deploy --schema=./src/prisma/schema.prisma

REM Hoặc
docker.bat migrate
```

### Table không tồn tại

```cmd
REM Chạy migrations
docker.bat migrate

REM Hoặc từ local
npx prisma migrate deploy --schema=./src/prisma/schema.prisma
```

### Prisma CLI không hoạt động trong container

**Giải pháp:** Chạy từ máy local:

```cmd
npx prisma migrate deploy --schema=./src/prisma/schema.prisma
npx prisma generate --schema=./src/prisma/schema.prisma
npx prisma studio --schema=./src/prisma/schema.prisma
```

---

## 💡 Tips

### Development Workflow

```cmd
REM 1. Start databases
docker-compose up -d postgres redis

REM 2. Run app local
npm run start:dev

REM 3. Khi cần migrations
npx prisma migrate dev --name migration_name
```

### Production Workflow

```cmd
REM 1. Update .env
notepad .env

REM 2. Build and start
docker-compose up -d --build

REM 3. Check logs
docker-compose logs -f app
```

### Dùng Neon Database

```cmd
REM 1. Set DATABASE_URL trong .env
DATABASE_URL=postgresql://user:pass@host.neon.tech/db

REM 2. Chỉ start app và redis
docker-compose up -d app redis

REM 3. Migrations từ local
npx prisma migrate deploy --schema=./src/prisma/schema.prisma
```

---

## ✅ Features

- ✅ Auto migrations on startup
- ✅ Auto Prisma Client generation
- ✅ Support Docker PostgreSQL & Neon
- ✅ Health checks
- ✅ Volume persistence
- ✅ Helper scripts (Windows & Linux)
- ✅ Production-ready

---

## 📖 Files

- `docker-compose.yml` - Main compose file
- `Dockerfile` - App image definition
- `docker-entrypoint.sh` - Startup script
- `docker.bat` - Windows helper
- `Makefile` - Linux/Mac helper

---

**Version:** 2.0  
**Status:** ✅ Production Ready
