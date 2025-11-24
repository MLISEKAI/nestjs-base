# Fix Prisma Connection Pool Timeout

## Vấn đề

Lỗi: `Timed out fetching a new connection from the connection pool (Current connection pool timeout: 10, connection limit: 9)`

## Giải pháp

### 1. Cập nhật DATABASE_URL trong file `.env`

Thêm connection pool parameters vào `DATABASE_URL`:

```env
# CŨ (không có connection pool config)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nestjs_db?schema=public

# MỚI (có connection pool config)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nestjs_db?schema=public&connection_limit=20&pool_timeout=20
```

### 2. Giải thích các tham số:

- `connection_limit=20`: Tăng số lượng connection tối đa từ 9 lên 20
- `pool_timeout=20`: Tăng timeout từ 10 giây lên 20 giây

### 3. Nếu vẫn còn lỗi, thử các giá trị cao hơn:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nestjs_db?schema=public&connection_limit=50&pool_timeout=30
```

### 4. Sau khi cập nhật `.env`:

1. **Restart NestJS server** để áp dụng thay đổi
2. **Kiểm tra lại** xem lỗi còn không

### 5. Kiểm tra số lượng connection đang dùng:

Nếu vẫn gặp vấn đề, có thể có **connection leak**. Kiểm tra:

```sql
-- Chạy trong PostgreSQL
SELECT count(*) FROM pg_stat_activity WHERE datname = 'nestjs_db';
```

Nếu số lượng connection quá cao (> 80% của max), có thể có connection leak trong code.

## Lưu ý

- Connection pool size phụ thuộc vào số lượng request đồng thời
- Nếu có nhiều request cùng lúc, cần tăng `connection_limit`
- PostgreSQL mặc định cho phép tối đa 100 connections (có thể cấu hình trong `postgresql.conf`)
