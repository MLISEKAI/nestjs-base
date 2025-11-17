# Cấu trúc thư mục chuẩn - Backend API với Database

## Tổng quan

Dự án sử dụng NestJS với Prisma ORM kết nối PostgreSQL database.

## Cấu trúc thư mục

```
src/
├── common/                    # Các thành phần dùng chung
│   ├── dto/                   # Request/Response DTOs chung
│   │   ├── base-query.dto.ts          # Pagination, search, sort
│   │   ├── base-response.dto.ts       # Standard API response
│   │   ├── id-param.dto.ts            # ID parameter DTOs
│   │   ├── file-upload.dto.ts         # File upload DTO
│   │   ├── date-range-query.dto.ts    # Date range filter
│   │   └── index.ts                   # Exports
│   │
│   ├── interfaces/            # TypeScript interfaces chung
│   │   ├── api-response.interface.ts   # API response interfaces
│   │   ├── pagination.interface.ts     # Pagination interfaces
│   │   ├── user.interface.ts           # User interfaces
│   │   ├── profile.interface.ts       # Profile interfaces
│   │   └── index.ts                   # Exports
│   │
│   ├── enums/                 # Enums chung
│   │   ├── user-role.enum.ts          # User roles (admin, user, guest)
│   │   ├── provider.enum.ts            # Auth providers
│   │   ├── wallet-transaction.enum.ts # Wallet transaction enums
│   │   └── index.ts                   # Exports
│   │
│   ├── utils/                 # Helper functions
│   │   ├── uuid.util.ts               # UUID generation
│   │   ├── trace-id.util.ts           # Trace ID generation
│   │   └── index.ts                   # Exports
│   │
│   ├── constants/             # Constants
│   │   ├── api.constants.ts           # API constants
│   │   ├── database.constants.ts      # Database constants
│   │   └── index.ts                   # Exports
│   │
│   ├── decorator/             # Custom decorators
│   ├── exception/            # Exception filters
│   ├── tracing/              # Tracing utilities
│   ├── response.ts           # Response utilities (backward compat)
│   ├── response.interceptor.ts
│   └── response-exception.filter.ts
│
├── modules/                   # Feature modules
│   ├── users/                 # Users module
│   │   ├── controller/        # Controllers
│   │   │   ├── users.controller.ts
│   │   │   ├── connections.controller.ts
│   │   │   └── messages.controller.ts
│   │   ├── dto/               # Module-specific DTOs
│   │   │   ├── user-response.ts       # User response DTOs
│   │   │   ├── connection-user.dto.ts
│   │   │   ├── send-message.dto.ts
│   │   │   └── search-user.dto.ts
│   │   ├── service/           # Services
│   │   │   ├── user-profile.service.ts
│   │   │   ├── user-connections.service.ts
│   │   │   ├── user-messaging.service.ts
│   │   │   └── user-albums.service.ts
│   │   ├── res-user.service.ts
│   │   └── users.module.ts
│   │
│   └── profile_db/            # Profile module (with DB)
│       ├── controller/        # Controllers
│       ├── dto/               # Module-specific DTOs
│       ├── service/           # Services
│       ├── profile_db.service.ts
│       └── profile_db.module.ts
│
├── auth/                      # Authentication module
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   ├── dto/
│   │   └── auth.dto.ts
│   └── strategy/
│       └── jwt.strategy.ts
│
├── prisma/                    # Prisma ORM
│   ├── schema.prisma          # Database schema
│   ├── prisma.service.ts      # Prisma service
│   ├── prisma.module.ts       # Prisma module
│   └── migrations/            # Database migrations
│
├── config/                    # Configuration
│   ├── config.module.ts
│   ├── database.config.ts
│   └── jwt.config.ts
│
├── app.module.ts              # Root module
├── main.ts                    # Entry point
└── app.controller.ts
```

## Quy tắc tổ chức

### 1. Common Module (`src/common/`)

#### DTOs (`common/dto/`)
- **Request DTOs**: DTOs cho request parameters, query, body
- **Response DTOs**: DTOs cho response data
- **Base DTOs**: DTOs cơ bản có thể extend (BaseQueryDto, BaseResponseDto)

#### Interfaces (`common/interfaces/`)
- TypeScript interfaces cho type safety
- Không chứa decorators, chỉ định nghĩa structure

#### Enums (`common/enums/`)
- Enums từ Prisma schema
- Enums dùng chung trong project

#### Utils (`common/utils/`)
- Helper functions thuần túy
- Không phụ thuộc vào NestJS

#### Constants (`common/constants/`)
- Hằng số dùng chung
- API constants, database constants, etc.

### 2. Module Structure

Mỗi module nên có cấu trúc:
```
module-name/
├── controller/        # Controllers
├── dto/              # Module-specific DTOs (request/response)
├── service/          # Business logic services
├── entity/           # Database entities (nếu cần)
├── repository/       # Data access layer (nếu cần)
└── module-name.module.ts
```

### 3. DTO Naming Convention

- **Request DTOs**: `CreateXxxDto`, `UpdateXxxDto`, `XxxQueryDto`
- **Response DTOs**: `XxxResponseDto`, `XxxDto`
- **Base DTOs**: `BaseQueryDto`, `BaseResponseDto`

### 4. Import Paths

Sử dụng relative paths:
```typescript
// From common
import { BaseQueryDto } from '../../../common/dto';
import { IUser } from '../../../common/interfaces';
import { UserRole } from '../../../common/enums';

// Within module
import { UserResponseDto } from '../dto/user-response';
```

## Best Practices

1. **DTOs**: Luôn sử dụng class với decorators cho validation
2. **Interfaces**: Dùng cho type definitions, không có decorators
3. **Enums**: Export từ Prisma schema để đảm bảo consistency
4. **Utils**: Pure functions, không side effects
5. **Constants**: Read-only, không thay đổi runtime

