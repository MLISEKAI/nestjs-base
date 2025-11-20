# Docker Setup Guide

Hướng dẫn chạy NestJS REST API với Docker.

## 📋 Yêu cầu

- Docker >= 20.10
- Docker Compose >= 2.0

## 🚀 Quick Start

### 1. Production Mode

```bash
# Build và chạy tất cả services
docker-compose up -d

# Xem logs
docker-compose logs -f app

# Dừng services
docker-compose down

# Dừng và xóa volumes (xóa data)
docker-compose down -v
```

### 2. Local Mode (PostgreSQL trong Docker, Redis Local)

```bash
# Chỉ chạy PostgreSQL (Redis chạy local trên máy)
docker-compose -f docker-compose.local.yml up -d

# Xem logs
docker-compose -f docker-compose.local.yml logs -f

# Dừng services
docker-compose -f docker-compose.local.yml down
```

**Lưu ý**: Xem file `REDIS_LOCAL_SETUP.md` để biết cách cài đặt và chạy Redis local.

## 🔧 Configuration

### Environment Variables

Tạo file `.env` trong root directory:

```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=nestjs_db
POSTGRES_PORT=5432

# Redis
REDIS_PASSWORD=redis_password
REDIS_PORT=6379

# Application
APP_PORT=3001
NODE_ENV=production

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
JWT_REFRESH_EXPIRES_IN=30d

# Database URL (auto-generated from above)
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/nestjs_db?schema=public

# Redis URL (auto-generated from above)
REDIS_URL=redis://:redis_password@redis:6379
```

## 📦 Services

### 1. PostgreSQL (postgres)

- **Port**: 5432
- **Database**: nestjs_db (default)
- **User**: postgres (default)
- **Password**: postgres (default)
- **Volume**: `postgres_data` (persistent storage)

### 2. Redis (redis)

- **Port**: 6379
- **Password**: redis_password (default)
- **Volume**: `redis_data` (persistent storage)

### 3. NestJS App (app)

- **Port**: 3001
- **Health Check**: `/health` endpoint
- **Auto Migration**: Chạy Prisma migrations khi start

## 🛠️ Commands

### Build và Start

```bash
# Build image
docker-compose build

# Build và start
docker-compose up -d --build

# Start services
docker-compose start

# Stop services
docker-compose stop

# Restart services
docker-compose restart
```

### Database Operations

```bash
# Chạy migrations
docker-compose exec app npx prisma migrate deploy --schema=./src/prisma/schema.prisma

# Generate Prisma Client
docker-compose exec app npx prisma generate --schema=./src/prisma/schema.prisma

# Prisma Studio (GUI)
docker-compose exec app npx prisma studio --schema=./src/prisma/schema.prisma

# Reset database
docker-compose exec app npx prisma migrate reset --schema=./src/prisma/schema.prisma
```

### Logs và Debugging

```bash
# Xem logs của tất cả services
docker-compose logs -f

# Xem logs của app
docker-compose logs -f app

# Xem logs của database
docker-compose logs -f postgres

# Xem logs của Redis
docker-compose logs -f redis

# Vào container
docker-compose exec app sh
```

### Cleanup

```bash
# Dừng và xóa containers
docker-compose down

# Dừng, xóa containers và volumes
docker-compose down -v

# Xóa images
docker-compose down --rmi all

# Xóa tất cả (containers, volumes, images)
docker-compose down -v --rmi all
```

## 🔍 Health Checks

Tất cả services đều có health checks:

- **PostgreSQL**: `pg_isready`
- **Redis**: `redis-cli ping`
- **App**: HTTP GET `/health`

Kiểm tra health status:

```bash
docker-compose ps
```

## 🐛 Troubleshooting

### App không start

```bash
# Kiểm tra logs
docker-compose logs app

# Kiểm tra database connection
docker-compose exec app sh
# Trong container: ping postgres
```

### Database connection error

```bash
# Kiểm tra database đã sẵn sàng
docker-compose exec postgres pg_isready -U postgres

# Kiểm tra environment variables
docker-compose exec app env | grep DATABASE
```

### Port đã được sử dụng

Thay đổi ports trong `.env` hoặc `docker-compose.yml`:

```yaml
ports:
  - '3002:3001' # Thay đổi port host
```

### Reset tất cả

```bash
# Dừng và xóa tất cả
docker-compose down -v

# Xóa images
docker rmi nestjs-base-app

# Start lại
docker-compose up -d --build
```

## 📝 Notes

- **Development**: Sử dụng `docker-compose.dev.yml` để chỉ chạy database và Redis, app chạy local với `npm run start:dev`
- **Production**: Sử dụng `docker-compose.yml` để chạy tất cả services
- **Migrations**: Tự động chạy khi app start (production mode)
- **Volumes**: Data được lưu persistent trong Docker volumes

## 🔐 Security

⚠️ **Important**: Thay đổi các default passwords trong production:

- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
