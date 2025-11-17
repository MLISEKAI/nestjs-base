# API Mock v2 - Sử dụng Mock Data

## Cấu trúc thư mục

```
src-v2/
├── common/
│   ├── mock-data.service.ts      # Service để load/save mock data từ JSON
│   ├── dto/
│   │   └── base-response.dto.ts
│   ├── interfaces/
│   │   └── paginated.interface.ts
│   └── utils/
│       └── uuid.util.ts
├── modules/
│   ├── users/
│   │   ├── users.controller.ts
│   │   ├── users.mock.service.ts
│   │   └── users.module.ts
│   └── posts/
│       ├── posts.controller.ts
│       ├── posts.mock.service.ts
│       └── posts.module.ts
├── app.module.ts
└── main.ts
```

## Mock Data

Tất cả mock data được lưu trong thư mục `mock-data/` ở root của project.

## Cách sử dụng

1. Chạy server:
```bash
npm run start:v2
```

2. Truy cập Swagger UI:
```
http://localhost:3002/api/v2
```

## API Endpoints

- `GET /api/v2/users` - Lấy danh sách users
- `GET /api/v2/users/:id` - Lấy thông tin user
- `POST /api/v2/users` - Tạo user mới
- `PUT /api/v2/users/:id` - Cập nhật user
- `DELETE /api/v2/users/:id` - Xóa user

- `GET /api/v2/posts` - Lấy danh sách posts
- `GET /api/v2/posts/:id` - Lấy thông tin post
- `POST /api/v2/posts` - Tạo post mới
- `PUT /api/v2/posts/:id` - Cập nhật post
- `DELETE /api/v2/posts/:id` - Xóa post

