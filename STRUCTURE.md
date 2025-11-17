# Cấu trúc dự án Mockup API Backend

## Tổng quan

Dự án được chia thành 2 phần chính:
- **src/**: API sử dụng Prisma và Database thật
- **src-v2/**: API Mock sử dụng mock data từ JSON files

## Cấu trúc thư mục

```
project-root/
│
├── src/                          # API với Database (Prisma)
│   ├── modules/
│   │   ├── users/                # Users module với DB
│   │   ├── profile_db/           # Profile module với DB
│   │   └── auth/                 # Auth module với DB
│   ├── prisma/                   # Prisma schema và service
│   ├── common/                   # Common utilities
│   ├── config/                   # Configuration
│   └── main.ts                   # Entry point (port 3001)
│
├── src-v2/                       # API Mock với JSON files
│   ├── modules/
│   │   ├── users/                # Users mock module
│   │   │   ├── users.controller.ts
│   │   │   ├── users.mock.service.ts
│   │   │   └── users.module.ts
│   │   ├── posts/                # Posts mock module
│   │   │   ├── posts.controller.ts
│   │   │   ├── posts.mock.service.ts
│   │   │   └── posts.module.ts
│   │   └── auth/                 # Auth mock module
│   │       ├── auth.controller.ts
│   │       ├── auth.mock.service.ts
│   │       └── auth.module.ts
│   ├── common/
│   │   ├── mock-data.service.ts  # Service để load/save JSON
│   │   ├── dto/
│   │   ├── interfaces/
│   │   └── utils/
│   ├── app.module.ts
│   └── main.ts                   # Entry point (port 3002)
│
├── mock-data/                    # Mock data files (JSON)
│   ├── users.json
│   ├── associates.json
│   ├── albums.json
│   ├── posts.json
│   ├── wallets.json
│   ├── vip-status.json
│   ├── gifts.json
│   ├── tasks.json
│   └── ... (tất cả các models từ schema.prisma)
│
├── package.json
└── README.md
```

## Cách sử dụng

### Chạy API với Database (src/)
```bash
npm run start:dev
# Server chạy tại: http://localhost:3001
# Swagger UI: http://localhost:3001/api
```

### Chạy API Mock (src-v2/)
```bash
npm run start:v2
# Server chạy tại: http://localhost:3002
# Swagger UI: http://localhost:3002/api/v2
```

## Mock Data

Tất cả mock data được lưu trong thư mục `mock-data/` dưới dạng JSON files. Mỗi file tương ứng với một model trong schema.prisma:

- `users.json` - Dữ liệu users
- `associates.json` - Dữ liệu authentication
- `albums.json` - Dữ liệu albums
- `posts.json` - Dữ liệu posts
- `wallets.json` - Dữ liệu ví
- `vip-status.json` - Dữ liệu VIP status
- `gifts.json` - Dữ liệu quà tặng
- `tasks.json` - Dữ liệu tasks
- ... và các models khác

## API Endpoints

### API v1 (Database) - Port 3001
- `GET /users` - Lấy danh sách users
- `GET /profile/:user_id` - Lấy profile
- `POST /auth/login` - Login
- ... (tất cả endpoints với DB)

### API v2 (Mock) - Port 3002
- `GET /api/v2/users` - Lấy danh sách users (mock)
- `GET /api/v2/users/:id` - Lấy user (mock)
- `POST /api/v2/users` - Tạo user (mock)
- `GET /api/v2/posts` - Lấy danh sách posts (mock)
- `POST /api/v2/auth/register` - Đăng ký (mock)
- `POST /api/v2/auth/login` - Login (mock)
- ... (tất cả endpoints với mock data)

## Lưu ý

1. **src/** sử dụng Prisma và kết nối database thật
2. **src-v2/** sử dụng mock data từ JSON files, không cần database
3. Cả 2 có thể chạy đồng thời trên 2 ports khác nhau
4. Mock data có thể được chỉnh sửa trực tiếp trong các file JSON
5. Thay đổi trong mock data sẽ được lưu lại vào file JSON

