# Hướng dẫn chạy Redis Local

## 🚀 Cách 1: Cài đặt Redis trên máy (Windows)

### Option A: Sử dụng WSL2 (Khuyến nghị)

```bash
# Trong WSL2 terminal
sudo apt update
sudo apt install redis-server

# Start Redis
sudo service redis-server start

# Kiểm tra Redis đang chạy
redis-cli ping
# Kết quả: PONG
```

### Option B: Sử dụng Chocolatey (Windows)

```powershell
# Cài đặt Redis
choco install redis-64

# Start Redis service
redis-server
```

### Option C: Download Redis cho Windows

1. Download từ: https://github.com/microsoftarchive/redis/releases
2. Extract và chạy `redis-server.exe`
3. Hoặc cài đặt như Windows Service

## 🐳 Cách 2: Chạy Redis trong Docker (riêng biệt)

```bash
# Chạy Redis container
docker run -d \
  --name redis-local \
  -p 6379:6379 \
  redis:7-alpine

# Kiểm tra
docker ps | grep redis
```

## 📝 Cấu hình .env

Cập nhật file `.env` của bạn:

```env
# Redis Local (không có password)
REDIS_URL=redis://localhost:6379

# Hoặc nếu Redis có password
REDIS_URL=redis://:your_password@localhost:6379

# Database URL (PostgreSQL trong Docker)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nestjs_db?schema=public
```

## 🎯 Chạy ứng dụng

### 1. Start PostgreSQL (Docker)

```bash
# Chạy chỉ PostgreSQL
docker-compose -f docker-compose.local.yml up -d

# Kiểm tra
docker-compose -f docker-compose.local.yml ps
```

### 2. Start Redis (Local)

**Windows với WSL2:**

```bash
# Trong WSL2
sudo service redis-server start
```

**Windows với Chocolatey:**

```powershell
# Chạy Redis server
redis-server
```

**Hoặc Redis trong Docker riêng:**

```bash
docker run -d --name redis-local -p 6379:6379 redis:7-alpine
```

### 3. Start NestJS App (Local)

```bash
# Install dependencies (nếu chưa có)
npm install

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:deploy

# Start app
npm run start:dev
```

## ✅ Kiểm tra kết nối

### Kiểm tra PostgreSQL

```bash
# Kiểm tra container đang chạy
docker ps | grep postgres

# Test connection
docker-compose -f docker-compose.local.yml exec postgres psql -U postgres -d nestjs_db -c "SELECT 1;"
```

### Kiểm tra Redis

```bash
# Test Redis connection
redis-cli ping
# Kết quả: PONG

# Hoặc nếu Redis trong Docker
docker exec redis-local redis-cli ping
```

### Kiểm tra từ NestJS App

App sẽ tự động kết nối với:

- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

Nếu có lỗi, kiểm tra logs:

```bash
npm run start:dev
```

## 🔧 Troubleshooting

### Redis không kết nối được

1. **Kiểm tra Redis đang chạy:**

   ```bash
   # Windows
   tasklist | findstr redis

   # WSL2
   sudo service redis-server status
   ```

2. **Kiểm tra port 6379:**

   ```bash
   # Windows
   netstat -an | findstr 6379

   # WSL2/Linux
   sudo netstat -tulpn | grep 6379
   ```

3. **Kiểm tra firewall:**
   - Đảm bảo port 6379 không bị block

### PostgreSQL không kết nối được

1. **Kiểm tra container:**

   ```bash
   docker-compose -f docker-compose.local.yml ps
   ```

2. **Kiểm tra logs:**

   ```bash
   docker-compose -f docker-compose.local.yml logs postgres
   ```

3. **Kiểm tra DATABASE_URL trong .env:**
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nestjs_db?schema=public
   ```

## 📋 Tóm tắt Commands

```bash
# 1. Start PostgreSQL
docker-compose -f docker-compose.local.yml up -d

# 2. Start Redis (chọn 1 trong các cách trên)

# 3. Start App
npm run start:dev

# Stop PostgreSQL
docker-compose -f docker-compose.local.yml down

# Stop Redis (nếu dùng Docker)
docker stop redis-local
docker rm redis-local
```
