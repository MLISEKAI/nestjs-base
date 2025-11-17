# Hướng dẫn sử dụng Mock API (src-v2)

## Cài đặt

Đảm bảo đã cài đặt các dependencies:
```bash
npm install
```

## Chạy Mock API

### Cách 1: Sử dụng ts-node (khuyến nghị)
```bash
npm run start:v2
```

### Cách 2: Sử dụng nodemon (auto-reload)
```bash
npm run start:v2:dev
```

Server sẽ chạy tại: **http://localhost:3002**

## Truy cập Swagger UI

Sau khi server chạy, truy cập:
```
http://localhost:3002/api/v2
```

## Cấu trúc Mock Data

Tất cả mock data được lưu trong thư mục `mock-data/`:

- `users.json` - Dữ liệu users
- `associates.json` - Dữ liệu authentication
- `albums.json` - Dữ liệu albums
- `posts.json` - Dữ liệu posts
- `wallets.json` - Dữ liệu ví
- `vip-status.json` - Dữ liệu VIP status
- `gifts.json` - Dữ liệu quà tặng
- `tasks.json` - Dữ liệu tasks
- ... và nhiều hơn nữa

## API Endpoints

### Users
- `GET /api/v2/users` - Lấy danh sách users (có pagination, search, sort)
- `GET /api/v2/users/:id` - Lấy thông tin user
- `POST /api/v2/users` - Tạo user mới
- `PUT /api/v2/users/:id` - Cập nhật user
- `DELETE /api/v2/users/:id` - Xóa user (soft delete)

### Posts
- `GET /api/v2/posts` - Lấy danh sách posts
- `GET /api/v2/posts/:id` - Lấy thông tin post
- `POST /api/v2/posts` - Tạo post mới
- `PUT /api/v2/posts/:id` - Cập nhật post
- `DELETE /api/v2/posts/:id` - Xóa post

### Auth
- `POST /api/v2/auth/register` - Đăng ký user mới
- `POST /api/v2/auth/login` - Login

## Tính năng

1. **Mock Data từ JSON**: Tất cả dữ liệu được load từ các file JSON trong `mock-data/`
2. **CRUD Operations**: Hỗ trợ đầy đủ Create, Read, Update, Delete
3. **Pagination**: Hỗ trợ phân trang với `page` và `limit`
4. **Search**: Tìm kiếm với tham số `search`
5. **Sort**: Sắp xếp với tham số `sort` (ví dụ: `created_at:desc`)
6. **Data Persistence**: Thay đổi dữ liệu được lưu lại vào file JSON

## Lưu ý

- Mock API chạy độc lập, không cần database
- Dữ liệu được lưu trong các file JSON
- Có thể chỉnh sửa trực tiếp các file JSON trong `mock-data/`
- Thay đổi sẽ được lưu lại khi thực hiện các thao tác Create/Update/Delete

## So sánh với API Database (src/)

| Tính năng | API Database (src/) | API Mock (src-v2/) |
|-----------|---------------------|-------------------|
| Port | 3001 | 3002 |
| Database | PostgreSQL + Prisma | JSON Files |
| Swagger | /api | /api/v2 |
| Data Storage | Database | mock-data/*.json |
| Setup | Cần database | Không cần database |

