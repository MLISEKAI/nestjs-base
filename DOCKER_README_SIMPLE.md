# 🐳 Docker Setup - ĐƠN GIẢN

## ⭐ Chỉ Dùng 1 File

✅ `docker-compose.yml` - File duy nhất cho mọi trường hợp

## 🚀 3 Bước Để Chạy

### Bước 1: Tạo .env

```cmd
copy env.example .env
notepad .env
```

**Thay đổi bắt buộc:**

```env
POSTGRES_PASSWORD=your_password
JWT_TOKEN_SECRET=your-secret-32-chars-minimum
```

### Bước 2: Khởi động

**Production (tất cả):**

```cmd
docker-compose up -d
```

**Development (chỉ databases):**

```cmd
docker-compose up -d postgres redis
npm run start:dev
```

### Bước 3: Truy cập

- 🌐 API: http://localhost:3001
- 📚 Swagger: http://localhost:3001/api

## 🛠️ Commands Cơ Bản

```cmd
docker-compose up -d              # Start tất cả
docker-compose up -d postgres     # Chỉ PostgreSQL
docker-compose up -d postgres redis  # Chỉ databases
docker-compose down               # Stop
docker-compose logs -f            # Xem logs
docker-compose ps                 # Xem status
docker.bat help                   # Xem tất cả lệnh
```

## 📊 Services

| Service  | Port | Dùng cho |
| -------- | ---- | -------- |
| postgres | 5432 | Database |
| redis    | 6379 | Cache    |
| app      | 3001 | API      |

## 💡 Tips

**Chỉ cần database?**

```cmd
docker-compose up -d postgres
```

**Development thường ngày?**

```cmd
docker-compose up -d postgres redis
npm run start:dev
```

**Production?**

```cmd
docker-compose up -d
```

**Dừng?**

```cmd
docker-compose down
```

**Reset (XÓA DATA)?**

```cmd
docker-compose down -v
docker-compose up -d --build
```

## 🔧 Troubleshooting

**Xem logs:**

```cmd
docker-compose logs -f
```

**Kiểm tra:**

```cmd
docker-compose ps
```

**Reset:**

```cmd
docker-compose down -v
docker-compose up -d
```

## 📖 Tài Liệu Chi Tiết

Đọc: **DOCKER_GUIDE.md** - Hướng dẫn đầy đủ

## ✅ Done!

Đơn giản, linh hoạt, dễ dùng! 🎉
