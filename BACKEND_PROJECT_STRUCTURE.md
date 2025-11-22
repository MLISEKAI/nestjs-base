# 📁 Cấu trúc dự án Backend chuẩn (NestJS)

## 📚 Tài liệu tham khảo

### Links chính thức:

- **NestJS Official Docs**: https://docs.nestjs.com/
- **NestJS Best Practices**: https://docs.nestjs.com/fundamentals/module-ref
- **NestJS Architecture**: https://docs.nestjs.com/fundamentals/custom-providers
- **TypeScript Best Practices**: https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html

### Community Resources:

- **Awesome NestJS**: https://github.com/nestjs/awesome-nestjs
- **NestJS Style Guide**: https://github.com/nestjs/nest/blob/master/docs/STYLE_GUIDE.md

---

## 🏗️ Cấu trúc dự án chuẩn

```
project-root/
├── src/                                    # Source code chính
│   ├── main.ts                            # Entry point của ứng dụng
│   ├── app.module.ts                      # Root module
│   │
│   ├── config/                            # Configuration files
│   │   ├── config.module.ts
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   └── *.config.ts                     # Các config khác
│   │
│   ├── common/                            # Shared/common code
│   │   ├── common.module.ts
│   │   ├── constants/                     # Constants
│   │   │   ├── index.ts
│   │   │   └── *.constants.ts
│   │   ├── dto/                           # Common DTOs
│   │   │   ├── index.ts
│   │   │   ├── base-query.dto.ts          # Base pagination DTO
│   │   │   ├── base-response.dto.ts
│   │   │   └── *.dto.ts
│   │   ├── enums/                         # Enumerations
│   │   │   ├── index.ts
│   │   │   └── *.enum.ts
│   │   ├── interfaces/                    # TypeScript interfaces
│   │   │   ├── index.ts
│   │   │   └── *.interface.ts
│   │   ├── guards/                        # Auth guards
│   │   │   └── *.guard.ts
│   │   ├── interceptors/                  # Response interceptors
│   │   │   └── *.interceptor.ts
│   │   ├── filters/                       # Exception filters
│   │   │   └── *.filter.ts
│   │   ├── pipes/                         # Validation pipes
│   │   │   └── *.pipe.ts
│   │   ├── decorators/                    # Custom decorators
│   │   │   └── *.decorator.ts
│   │   ├── utils/                         # Utility functions
│   │   │   ├── index.ts
│   │   │   └── *.util.ts
│   │   ├── services/                      # Shared services
│   │   │   └── *.service.ts
│   │   └── controllers/                   # Shared controllers
│   │       └── *.controller.ts
│   │
│   ├── auth/                              # Authentication module
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── dto/
│   │   │   └── auth.dto.ts
│   │   ├── guards/
│   │   │   ├── guards.module.ts
│   │   │   └── *.guard.ts
│   │   ├── strategy/                      # Passport strategies
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── google.strategy.ts
│   │   │   └── *.strategy.ts
│   │   └── security/                      # Security services
│   │       ├── token.service.ts
│   │       └── *.service.ts
│   │
│   ├── modules/                           # Feature modules
│   │   ├── users/                         # Users module
│   │   │   ├── users.module.ts
│   │   │   ├── controller/                # Controllers
│   │   │   │   ├── users.controller.ts
│   │   │   │   ├── users-admin.controller.ts
│   │   │   │   └── users-public.controller.ts
│   │   │   ├── service/                   # Services
│   │   │   │   ├── user-profile.service.ts
│   │   │   │   ├── user-connections.service.ts
│   │   │   │   └── *.service.ts
│   │   │   ├── dto/                       # DTOs
│   │   │   │   ├── user-response.ts
│   │   │   │   └── *.dto.ts
│   │   │   ├── interfaces/                # Module-specific interfaces
│   │   │   │   ├── index.ts
│   │   │   │   └── *.interface.ts
│   │   │   └── entities/                  # Entities (nếu dùng TypeORM)
│   │   │       └── *.entity.ts
│   │   │
│   │   ├── posts/                         # Posts module
│   │   │   ├── posts.module.ts
│   │   │   ├── controller/
│   │   │   ├── service/
│   │   │   └── dto/
│   │   │
│   │   └── [other-modules]/               # Các modules khác
│   │
│   ├── prisma/                            # Prisma ORM
│   │   ├── prisma.module.ts
│   │   ├── prisma.service.ts
│   │   ├── schema.prisma                  # Database schema
│   │   └── migrations/                    # Database migrations
│   │
│   └── [other-features]/                  # Các features khác
│
├── test/                                  # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docs/                                  # Documentation
│   └── *.md
│
├── .env                                   # Environment variables
├── .env.example                           # Example env file
├── .gitignore
├── .eslintrc.js                          # ESLint config
├── .prettierrc                           # Prettier config
├── tsconfig.json                         # TypeScript config
├── nest-cli.json                         # NestJS CLI config
├── package.json
├── README.md
└── [other-config-files]
```

---

## 📋 Chi tiết từng thư mục

### 1. **`src/main.ts`**

- Entry point của ứng dụng
- Setup global pipes, filters, interceptors
- Cấu hình CORS, Helmet, Swagger
- Khởi động server

### 2. **`src/config/`**

- Chứa tất cả configuration files
- Database config, JWT config, etc.
- Sử dụng `@nestjs/config` để quản lý

### 3. **`src/common/`**

- Code dùng chung cho toàn bộ ứng dụng
- **Không nên** chứa business logic cụ thể
- Các thành phần:
  - `constants/`: Magic numbers, strings
  - `dto/`: Base DTOs (pagination, response)
  - `enums/`: Enumerations
  - `interfaces/`: TypeScript interfaces
  - `guards/`: Authentication/Authorization guards
  - `interceptors/`: Response transformation
  - `filters/`: Exception handling
  - `pipes/`: Validation pipes
  - `decorators/`: Custom decorators
  - `utils/`: Helper functions
  - `services/`: Shared services (upload, email, etc.)

### 4. **`src/auth/`**

- Module xử lý authentication & authorization
- JWT strategies, OAuth strategies
- Guards, token services

### 5. **`src/modules/`**

- Mỗi module đại diện cho một feature/business domain
- Cấu trúc module chuẩn:

```
module-name/
├── module-name.module.ts          # Module definition
├── controller/                    # Controllers (API endpoints)
│   ├── module-name.controller.ts
│   ├── module-name-admin.controller.ts
│   └── module-name-public.controller.ts
├── service/                       # Business logic
│   ├── module-name.service.ts
│   └── *.service.ts
├── dto/                          # Data Transfer Objects
│   ├── *.dto.ts
│   └── index.ts
├── interfaces/                   # Module-specific interfaces
│   ├── *.interface.ts
│   └── index.ts
├── entities/                     # Database entities (nếu dùng TypeORM)
│   └── *.entity.ts
└── [sub-modules]/                # Nested modules nếu cần
```

### 6. **`src/prisma/`**

- Prisma ORM configuration
- Database schema
- Migrations

---

## 🎯 Nguyên tắc tổ chức code

### 1. **Module-based Architecture**

- Mỗi feature là một module độc lập
- Module có thể import/exports để tái sử dụng
- Tránh circular dependencies

### 2. **Separation of Concerns**

- **Controller**: Xử lý HTTP requests/responses
- **Service**: Business logic
- **DTO**: Data validation và transformation
- **Interface**: Type definitions

### 3. **Naming Conventions**

#### Files:

- `*.controller.ts` - Controllers
- `*.service.ts` - Services
- `*.dto.ts` - DTOs
- `*.interface.ts` - Interfaces
- `*.module.ts` - Modules
- `*.guard.ts` - Guards
- `*.interceptor.ts` - Interceptors
- `*.filter.ts` - Exception filters
- `*.pipe.ts` - Pipes
- `*.decorator.ts` - Decorators
- `*.util.ts` - Utilities
- `*.enum.ts` - Enumerations
- `*.constants.ts` - Constants

#### Classes:

- `UserController` - PascalCase
- `UserService` - PascalCase
- `CreateUserDto` - PascalCase với suffix Dto
- `IUser` - PascalCase với prefix I (cho interfaces)

#### Variables/Functions:

- `userService` - camelCase
- `getUserById` - camelCase

### 4. **File Organization Rules**

#### ✅ Nên làm:

- Mỗi class/interface trong file riêng (trừ khi liên quan chặt chẽ)
- Export tất cả qua `index.ts` trong mỗi folder
- Group related files trong cùng folder
- Sử dụng barrel exports (`index.ts`)

#### ❌ Không nên:

- Đặt tất cả code trong một file lớn
- Import từ nhiều cấp sâu (`../../../`)
- Circular dependencies
- Business logic trong controllers

---

## 📦 Cấu trúc Module chi tiết

### Ví dụ: Users Module

```
users/
├── users.module.ts
│
├── controller/
│   ├── users.controller.ts              # Main controller
│   ├── users-admin.controller.ts       # Admin endpoints
│   └── users-public.controller.ts       # Public endpoints
│
├── service/
│   ├── user-profile.service.ts         # Profile logic
│   ├── user-connections.service.ts     # Connections logic
│   └── res-user.service.ts             # Main service (facade)
│
├── dto/
│   ├── user-response.ts                 # Response DTOs
│   ├── search-user.dto.ts              # Query DTOs
│   └── index.ts                         # Barrel export
│
├── interfaces/
│   ├── user-profile.interface.ts        # Service interfaces
│   └── index.ts                         # Barrel export
│
└── [sub-features]/                      # Nested features
    └── block-user/
        ├── controller/
        ├── service/
        └── dto/
```

---

## 🔧 Best Practices

### 1. **DTOs (Data Transfer Objects)**

```typescript
// ✅ Tốt: Sử dụng class với decorators
export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nickname: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;
}

// ❌ Không tốt: Inline types
async createUser(data: { nickname: string; email?: string }) {}
```

### 2. **Interfaces vs Types**

```typescript
// ✅ Interface cho object shapes
export interface SearchUsersParams {
  search?: string;
  page?: number;
}

// ✅ Type cho unions, intersections
export type UserRole = 'admin' | 'user' | 'guest';
```

### 3. **Service Organization**

```typescript
// ✅ Tốt: Service với single responsibility
@Injectable()
export class UserProfileService {
  async findOne(id: string) {}
  async updateProfile(id: string, dto: UpdateUserDto) {}
}

// ❌ Không tốt: Service quá lớn với nhiều responsibilities
```

### 4. **Module Exports**

```typescript
// ✅ Tốt: Export qua index.ts
// interfaces/index.ts
export * from './user-profile.interface';
export * from './user-connection.interface';

// Import
import { SearchUsersParams } from '../interfaces';
```

### 5. **Error Handling**

```typescript
// ✅ Tốt: Sử dụng NestJS exceptions
throw new NotFoundException('User not found');
throw new BadRequestException('Invalid input');

// ❌ Không tốt: Throw generic errors
throw new Error('User not found');
```

---

## 📊 So sánh với dự án hiện tại

### ✅ Đã đúng:

- Module-based architecture
- Separation of concerns
- Common folder cho shared code
- DTOs với validation
- Prisma integration

### 🔄 Cần cải thiện:

- Thêm `interfaces/` folder trong mỗi module (đã làm cho users)
- Tổ chức sub-modules tốt hơn
- Thêm `index.ts` exports cho tất cả folders
- Tách services nhỏ hơn nếu quá lớn

---

## 🚀 Checklist khi tạo module mới

- [ ] Tạo folder module trong `src/modules/`
- [ ] Tạo `[module].module.ts`
- [ ] Tạo `controller/` folder với controllers
- [ ] Tạo `service/` folder với services
- [ ] Tạo `dto/` folder với DTOs
- [ ] Tạo `interfaces/` folder nếu cần
- [ ] Tạo `index.ts` trong mỗi folder để export
- [ ] Import module vào `app.module.ts`
- [ ] Thêm Swagger decorators
- [ ] Thêm validation cho DTOs
- [ ] Thêm error handling
- [ ] Viết tests (nếu có)

---

## 📚 Tài liệu tham khảo thêm

### NestJS Official:

- **Documentation**: https://docs.nestjs.com/
- **CLI**: https://docs.nestjs.com/cli/overview
- **Testing**: https://docs.nestjs.com/fundamentals/testing

### Architecture Patterns:

- **Clean Architecture**: https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
- **SOLID Principles**: https://en.wikipedia.org/wiki/SOLID

### TypeScript:

- **Handbook**: https://www.typescriptlang.org/docs/handbook/intro.html
- **Best Practices**: https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html

---

## 💡 Kết luận

Cấu trúc dự án backend chuẩn giúp:

- ✅ Dễ maintain và mở rộng
- ✅ Code rõ ràng, dễ đọc
- ✅ Tái sử dụng code tốt hơn
- ✅ Testing dễ dàng hơn
- ✅ Onboarding developers mới nhanh hơn

**Lưu ý**: Cấu trúc có thể thay đổi tùy theo quy mô dự án, nhưng nguyên tắc cơ bản nên giữ nguyên.
