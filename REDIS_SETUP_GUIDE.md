# 🔴 Redis Setup Guide

## 📋 Tổng quan

Redis là in-memory data store được dùng cho caching trong project này. Guide này hướng dẫn cách cài đặt và chạy Redis trên Windows.

## 🪟 Cài đặt Redis trên Windows

### Option 1: WSL2 (Recommended - Best Performance)

Nếu bạn đã có WSL2 (Windows Subsystem for Linux):

```bash
# 1. Mở WSL2 terminal
wsl

# 2. Cài đặt Redis
sudo apt update
sudo apt install redis-server -y

# 3. Start Redis
sudo service redis-server start

# 4. Kiểm tra Redis đang chạy
redis-cli ping
# Should return: PONG

# 5. (Optional) Enable Redis to start on boot
sudo systemctl enable redis-server
```

**Cấu hình trong `.env`:**

```env
REDIS_URL=redis://localhost:6379
```

### Option 2: Docker (Easiest)

Nếu bạn đã có Docker Desktop:

```bash
# 1. Pull Redis image
docker pull redis:latest

# 2. Run Redis container
docker run -d --name redis -p 6379:6379 redis:latest

# 3. Kiểm tra Redis đang chạy
docker ps
# Should see redis container running

# 4. Test connection
docker exec -it redis redis-cli ping
# Should return: PONG
```

**Cấu hình trong `.env`:**

```env
REDIS_URL=redis://localhost:6379
```

**Stop Redis:**

```bash
docker stop redis
```

**Start Redis:**

```bash
docker start redis
```

**Remove Redis:**

```bash
docker stop redis
docker rm redis
```

### Option 3: Memurai (Windows Native)

Memurai là Redis-compatible server cho Windows:

1. **Download Memurai:**
   - Truy cập: https://www.memurai.com/get-memurai
   - Download Memurai Developer Edition (free)

2. **Cài đặt:**
   - Chạy installer
   - Chọn "Install as Windows Service" (optional)
   - Port mặc định: 6379

3. **Start Memurai:**
   - Nếu cài như service: Tự động start
   - Nếu không: Start từ Start Menu → Memurai

4. **Kiểm tra:**
   ```bash
   # Download redis-cli for Windows hoặc dùng WSL
   redis-cli ping
   # Should return: PONG
   ```

**Cấu hình trong `.env`:**

```env
REDIS_URL=redis://localhost:6379
```

### Option 4: Redis Cloud (Free Tier)

Nếu không muốn cài đặt local:

1. **Đăng ký Redis Cloud:**
   - Truy cập: https://redis.com/try-free/
   - Tạo account (free tier có 30MB)

2. **Tạo database:**
   - Tạo database mới
   - Copy connection URL

3. **Cấu hình trong `.env`:**
   ```env
   REDIS_URL=redis://default:password@host:port
   # Example: redis://default:abc123@redis-12345.c1.us-east-1-1.ec2.cloud.redislabs.com:12345
   ```

## ✅ Verify Redis Connection

### 1. **Test từ Command Line**

```bash
# Nếu dùng WSL/Docker
redis-cli ping
# Should return: PONG

# Test set/get
redis-cli set test "hello"
redis-cli get test
# Should return: "hello"
```

### 2. **Test từ NestJS App**

Sau khi start server, check logs:

```
[Nest] LOG [CacheService] Redis connected successfully
```

Nếu thấy message này, Redis đã kết nối thành công!

### 3. **Test qua API**

```bash
# Gọi API có sử dụng cache
GET http://localhost:3001/profile/{user_id}

# Check metrics để xem cache hoạt động
GET http://localhost:3001/performance/metrics
```

## 🔧 Troubleshooting

### Redis không connect được

1. **Check Redis đang chạy:**

   ```bash
   # WSL
   sudo service redis-server status

   # Docker
   docker ps | grep redis

   # Windows (Memurai)
   # Check Services → Memurai
   ```

2. **Check port 6379:**

   ```bash
   # Windows PowerShell
   netstat -an | findstr 6379

   # Should see: LISTENING on 0.0.0.0:6379
   ```

3. **Check firewall:**
   - Đảm bảo port 6379 không bị block
   - Nếu dùng Docker, check Docker Desktop settings

4. **Check .env file:**
   ```env
   REDIS_URL=redis://localhost:6379
   ```

### Redis connection refused

**Lỗi:** `ECONNREFUSED`

**Giải pháp:**

1. Đảm bảo Redis đang chạy
2. Check port đúng (mặc định: 6379)
3. Check REDIS_URL trong .env
4. Nếu dùng Docker, check container đang running

### Redis password required

Nếu Redis yêu cầu password:

```env
REDIS_URL=redis://:password@localhost:6379
# hoặc
REDIS_URL=redis://username:password@localhost:6379
```

## 📊 Redis Commands (Useful)

```bash
# Connect to Redis CLI
redis-cli

# Check all keys
KEYS *

# Get value
GET key_name

# Set value
SET key_name "value"

# Delete key
DEL key_name

# Delete all keys
FLUSHALL

# Check info
INFO

# Monitor commands in real-time
MONITOR

# Exit
EXIT
```

## 🚀 Quick Start (Recommended: Docker)

Nếu bạn có Docker, đây là cách nhanh nhất:

```bash
# 1. Start Redis
docker run -d --name redis -p 6379:6379 redis:latest

# 2. Add to .env
echo REDIS_URL=redis://localhost:6379 >> .env

# 3. Restart NestJS server
npm run start:dev

# 4. Check logs - should see:
# [Nest] LOG [CacheService] Redis connected successfully
```

**Stop Redis khi không dùng:**

```bash
docker stop redis
```

**Start lại Redis:**

```bash
docker start redis
```

## 📝 Notes

- **Development:** Redis không bắt buộc - app vẫn chạy bình thường nếu Redis không available
- **Production:** Nên có Redis để tối ưu performance
- **Memory:** Redis sử dụng RAM, đảm bảo có đủ RAM
- **Persistence:** Redis có thể persist data (RDB/AOF), nhưng với caching thì không cần thiết

## 🎯 Next Steps

Sau khi Redis đã chạy:

1. ✅ Verify connection trong server logs
2. ✅ Test cache bằng cách gọi API nhiều lần
3. ✅ Check performance metrics
4. ✅ Monitor cache hit rate

**Happy caching!** 🚀
