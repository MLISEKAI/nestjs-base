# 📁 Phân tích cấu trúc dự án NestJS

## ✅ Cấu trúc hiện tại

### 1. **Root Structure** (`src/`)

```
src/
├── main.ts                    ✅ Entry point
├── app.module.ts              ✅ Root module
├── app.controller.ts         ✅ Root controller
├── app.service.ts             ✅ Root service
├── auth/                      ✅ Authentication module
├── common/                    ✅ Shared utilities
├── config/                    ✅ Configuration
├── modules/                   ✅ Feature modules
├── prisma/                    ✅ Database schema & migrations
└── apim/                      ⚠️  Cần kiểm tra (có vẻ là mock API)
```

### 2. **Auth Module** (`src/auth/`)

```
auth/
├── auth.module.ts             ✅
├── auth.controller.ts         ✅
├── auth.service.ts            ✅
├── dto/                       ✅
│   └── auth.dto.ts
├── guards/                    ✅
│   ├── guards.module.ts
│   └── optional-auth.guard.ts
├── security/                  ✅
│   ├── token.service.ts
│   ├── verification.service.ts
│   ├── two-factor.service.ts
│   └── auth-rate-limit.service.ts
└── strategy/                  ✅
    ├── jwt.strategy.ts
    ├── google.strategy.ts
    └── facebook.strategy.ts
```

**Đánh giá**: ✅ Cấu trúc tốt, đúng chuẩn NestJS

### 3. **Common Module** (`src/common/`)

```
common/
├── common.module.ts           ✅
├── constants/                 ✅
├── dto/                       ✅
├── enums/                     ✅
├── interfaces/                ✅
├── pipes/                     ✅
├── services/                  ✅
├── utils/                     ✅
├── response.interceptor.ts    ⚠️  Nên vào interceptors/
├── response-exception.filter.ts ⚠️  Nên vào filters/
└── upload.controller.ts       ⚠️  Nên vào controllers/ hoặc tách ra module riêng
```

**Đánh giá**: ⚠️ Cần tổ chức lại một số file

### 4. **Users Module** (`src/modules/users/`)

```
users/
├── users.module.ts            ✅
├── res-user.service.ts        ⚠️  Nên vào service/
├── controller/                ✅
├── service/                   ✅
└── dto/                       ✅
```

**Đánh giá**: ⚠️ Cần di chuyển `res-user.service.ts` vào `service/`

### 5. **Profile DB Module** (`src/modules/profile_db/`)

```
profile_db/
├── profile_db.module.ts       ✅
├── profile_db.service.ts      ✅
├── profile-views_db/          ✅
├── wallet/                    ✅ (đã chuẩn)
├── user-profile/              ✅ (đã chuẩn)
├── album/                     ✅ (đã chuẩn)
├── clan/                      ✅ (đã chuẩn)
├── gifts/                     ✅ (đã chuẩn)
├── inventory/                 ✅ (đã chuẩn)
├── store/                     ✅ (đã chuẩn)
├── task/                      ✅ (đã chuẩn)
├── feedback/                  ✅ (đã chuẩn)
├── post/                      ✅ (đã chuẩn)
├── love-space/                ✅ (đã chuẩn)
├── vip/                       ✅ (đã chuẩn)
├── support/                   ✅ (đã chuẩn)
├── referral/                  ✅ (đã chuẩn)
├── controller/                ❌ CẦN XÓA (file cũ)
├── service/                   ❌ CẦN XÓA (file cũ)
└── dto/                       ❌ CẦN XÓA (file cũ, trừ base-query.dto.ts)
```

**Đánh giá**: ⚠️ Cần xóa các file cũ trong `controller/`, `service/`, `dto/`

## ❌ Vấn đề cần sửa

### 1. **Profile DB Module - File cũ cần xóa**

- `src/modules/profile_db/controller/*.ts` (13 files) - đã di chuyển vào các folder riêng
- `src/modules/profile_db/service/*.ts` (12 files) - đã di chuyển vào các folder riêng
- `src/modules/profile_db/dto/*.ts` (14 files) - đã di chuyển vào các folder riêng (trừ `base-query.dto.ts`)

### 2. **Common Module - Cần tổ chức lại**

- `response.interceptor.ts` → nên vào `common/interceptors/`
- `response-exception.filter.ts` → nên vào `common/filters/`
- `upload.controller.ts` → nên vào `common/controllers/` hoặc tách ra module riêng

### 3. **Users Module - Cần di chuyển file**

- `res-user.service.ts` → nên vào `service/res-user.service.ts`

### 4. **Thiếu folder chuẩn**

- `src/tests/` hoặc `test/` - cho unit tests và e2e tests
- `src/common/decorators/` - cho custom decorators
- `src/common/guards/` - cho shared guards (nếu có)

## 📋 Cấu trúc chuẩn NestJS đề xuất

```
src/
├── main.ts
├── app.module.ts
├── app.controller.ts
├── app.service.ts
│
├── auth/                          ✅ OK
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── dto/
│   ├── guards/
│   ├── strategy/
│   └── security/
│
├── common/                         ⚠️ Cần cải thiện
│   ├── common.module.ts
│   ├── constants/
│   ├── dto/
│   ├── enums/
│   ├── interfaces/
│   ├── pipes/
│   ├── services/
│   ├── utils/
│   ├── interceptors/              ➕ Cần tạo
│   │   └── response.interceptor.ts
│   ├── filters/                    ➕ Cần tạo
│   │   └── response-exception.filter.ts
│   ├── decorators/                 ➕ Có thể thêm
│   └── controllers/                ➕ Có thể thêm
│       └── upload.controller.ts
│
├── config/                         ✅ OK
│   ├── config.module.ts
│   ├── database.config.ts
│   └── jwt.config.ts
│
├── modules/                        ⚠️ Cần dọn dẹp
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── controller/
│   │   ├── service/                ⚠️ Thiếu res-user.service.ts
│   │   └── dto/
│   │
│   └── profile_db/
│       ├── profile_db.module.ts
│       ├── profile_db.service.ts
│       ├── [feature]/              ✅ Đã chuẩn
│       │   ├── controller/
│       │   ├── service/
│       │   └── dto/
│       ├── controller/             ❌ CẦN XÓA
│       ├── service/                ❌ CẦN XÓA
│       └── dto/                    ❌ CẦN XÓA (trừ base-query.dto.ts)
│
├── prisma/                         ✅ OK
│   ├── schema.prisma
│   ├── prisma.module.ts
│   ├── prisma.service.ts
│   └── migrations/
│
└── tests/                          ➕ Nên tạo
    ├── unit/
    └── e2e/
```

## 🔧 Đề xuất cải thiện

### Priority 1: Dọn dẹp file cũ

1. ✅ Xóa `src/modules/profile_db/controller/*.ts` (13 files)
2. ✅ Xóa `src/modules/profile_db/service/*.ts` (12 files)
3. ✅ Xóa `src/modules/profile_db/dto/*.ts` (trừ `base-query.dto.ts`)
4. ✅ Di chuyển `base-query.dto.ts` vào `common/dto/` hoặc giữ lại nếu cần

### Priority 2: Tổ chức lại Common Module

1. ✅ Tạo `common/interceptors/` và di chuyển `response.interceptor.ts`
2. ✅ Tạo `common/filters/` và di chuyển `response-exception.filter.ts`
3. ✅ Tạo `common/controllers/` và di chuyển `upload.controller.ts` (hoặc tách ra module riêng)

### Priority 3: Cải thiện Users Module

1. ✅ Di chuyển `res-user.service.ts` vào `service/`

### Priority 4: Tạo folder tests (optional)

1. ✅ Tạo `tests/unit/` cho unit tests
2. ✅ Tạo `tests/e2e/` cho e2e tests

## 📊 Tổng kết

### ✅ Đã đúng chuẩn:

- Auth module structure
- Config module
- Prisma module
- Profile DB features (đã refactor xong)

### ⚠️ Cần cải thiện:

- Common module organization
- Users module (di chuyển 1 file)
- Xóa file cũ trong profile_db

### ➕ Có thể thêm:

- Tests folder structure
- Decorators folder (nếu cần)
- Shared guards folder (nếu cần)
