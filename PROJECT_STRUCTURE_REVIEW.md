# 📁 Tổng quan cấu trúc dự án NestJS

## ✅ Cấu trúc hiện tại - Đánh giá

### 1. **Root Structure** (`src/`)

```
src/
├── main.ts                    ✅ Entry point
├── app.module.ts              ✅ Root module
├── app.controller.ts         ✅ Root controller
├── app.service.ts             ✅ Root service
├── auth/                      ✅ Authentication module (chuẩn)
├── common/                     ✅ Shared utilities (chuẩn)
├── config/                     ✅ Configuration (chuẩn)
├── modules/                     ✅ Feature modules (chuẩn)
├── prisma/                     ✅ Database schema & migrations (chuẩn)
└── apim/                       ⚠️  Cần kiểm tra (có vẻ là mock API)
```

**Đánh giá**: ✅ Cấu trúc root đã chuẩn theo NestJS

---

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
└── strategy/                   ✅
    ├── jwt.strategy.ts
    ├── google.strategy.ts
    └── facebook.strategy.ts
```

**Đánh giá**: ✅ Cấu trúc chuẩn NestJS, tổ chức tốt

---

### 3. **Common Module** (`src/common/`)

```
common/
├── common.module.ts           ✅
├── constants/                 ✅
│   ├── api.constants.ts
│   ├── database.constants.ts
│   └── index.ts
├── controllers/               ✅
│   └── upload.controller.ts
├── dto/                       ✅
│   ├── base-query.dto.ts
│   ├── base-response.dto.ts
│   ├── date-range-query.dto.ts
│   ├── file-upload.dto.ts
│   ├── id-param.dto.ts
│   └── index.ts
├── enums/                     ✅
│   ├── index.ts
│   ├── provider.enum.ts
│   ├── user-role.enum.ts
│   └── wallet-transaction.enum.ts
├── filters/                   ✅
│   └── response-exception.filter.ts
├── interceptors/              ✅
│   └── response.interceptor.ts
├── interfaces/                ✅
│   ├── api-response.interface.ts
│   ├── index.ts
│   ├── pagination.interface.ts
│   ├── profile.interface.ts
│   └── user.interface.ts
├── pipes/                     ✅
│   └── sanitize-input.pipe.ts
├── services/                  ✅
│   ├── cloudinary.service.ts
│   ├── email.service.ts
│   ├── firebase.service.ts
│   └── upload.service.ts
└── utils/                     ✅
    ├── index.ts
    ├── pagination.util.ts
    ├── trace-id.util.ts
    └── uuid.util.ts
```

**Đánh giá**: ✅ Cấu trúc chuẩn, đã có đầy đủ folders cần thiết

**Thiếu (tùy chọn)**:

- ❌ `decorators/` - Nếu có custom decorators (hiện tại không có)
- ❌ `guards/` - Nếu có shared guards (hiện tại guards chỉ có trong auth/)

---

### 4. **Config Module** (`src/config/`)

```
config/
├── config.module.ts           ✅
├── database.config.ts         ✅
├── jwt.config.ts              ✅
└── firebase-service-account.json ⚠️  Nên vào .env hoặc .gitignore
```

**Đánh giá**: ✅ Cấu trúc chuẩn

**Lưu ý**: `firebase-service-account.json` nên được ignore hoặc dùng environment variables

---

### 5. **Modules** (`src/modules/`)

#### 5.1. **Users Module** (`src/modules/users/`)

```
users/
├── users.module.ts            ✅
├── controller/                ✅
│   ├── connections.controller.ts
│   ├── messages.controller.ts
│   └── users.controller.ts
├── service/                   ✅
│   ├── res-user.service.ts
│   ├── user-albums.service.ts
│   ├── user-connections.service.ts
│   ├── user-messaging.service.ts
│   └── user-profile.service.ts
└── dto/                       ✅
    ├── connection-user.dto.ts
    ├── search-user.dto.ts
    ├── send-message.dto.ts
    └── user-response.ts
```

**Đánh giá**: ✅ Cấu trúc chuẩn NestJS

---

#### 5.2. **Profile DB Module** (`src/modules/profile_db/`)

```
profile_db/
├── profile_db.module.ts        ✅
├── profile_db.service.ts      ✅
├── profile-views_db/          ✅
│   ├── profile-views_db.controller.ts
│   └── profile-views_db.service.ts
│
├── [13 features - đã chuẩn]   ✅
│   ├── user-profile/
│   ├── album/
│   ├── clan/
│   ├── gifts/
│   ├── wallet/
│   ├── inventory/
│   ├── store/
│   ├── task/
│   ├── feedback/
│   ├── post/
│   ├── love-space/
│   ├── vip/
│   ├── support/
│   └── referral/
│
└── [Mỗi feature có structure chuẩn]
    ├── controller/
    ├── service/
    └── dto/
```

**Đánh giá**: ✅ Cấu trúc rất tốt, đã được refactor hoàn chỉnh

**Đặc biệt**:

- ✅ Gifts đã được chia nhỏ thành 3 services (crud, summary, catalog)
- ✅ Wallet đã được chia nhỏ thành 8 services (wallet, summary, recharge, subscription, transaction, convert, deposit, iap)
- ✅ Không còn file cũ trong `controller/`, `service/`, `dto/` root

---

### 6. **Prisma Module** (`src/prisma/`)

```
prisma/
├── prisma.module.ts           ✅
├── prisma.service.ts          ✅
├── schema.prisma              ✅
└── migrations/                ✅
    └── [multiple migrations]
```

**Đánh giá**: ✅ Cấu trúc chuẩn Prisma

---

### 7. **APIM Module** (`src/apim/`)

```
apim/
├── dto/                       ⚠️  Empty
├── interface/                 ⚠️  Empty
└── services/                  ⚠️  Empty
```

**Đánh giá**: ⚠️ Folder trống, không có file nào

**Đề xuất**:

- ❌ **Xóa folder này** nếu không dùng
- Hoặc nếu cần → tạo `apim.module.ts` và tổ chức lại theo chuẩn NestJS

---

## ❌ Thiếu folder theo chuẩn NestJS

### 1. **Tests Folder**

```
test/                           ✅ Đã có
├── app.e2e-spec.ts            ✅
└── jest-e2e.json              ✅
```

**Đánh giá**: ✅ Đã có `test/` folder ở root level (chuẩn NestJS)

**Đề xuất**:

- ✅ OK - Có thể thêm `test/unit/` nếu muốn tách unit tests và e2e tests

---

### 2. **Common Decorators** (tùy chọn)

```
common/
└── decorators/               ❌ Thiếu (nhưng không có custom decorators)
    └── [custom decorators]
```

**Đánh giá**: ⚠️ Không có custom decorators nên không cần thiết

---

### 3. **Common Guards** (tùy chọn)

```
common/
└── guards/                   ❌ Thiếu (nhưng guards đã có trong auth/)
    └── [shared guards]
```

**Đánh giá**: ⚠️ Guards hiện tại chỉ có trong auth/, nếu có shared guards thì nên tạo folder này

---

## 📋 So sánh với cấu trúc chuẩn NestJS

### ✅ Đã có đầy đủ:

1. ✅ Root files (main.ts, app.module.ts, app.controller.ts, app.service.ts)
2. ✅ Feature modules với structure chuẩn (controller/, service/, dto/)
3. ✅ Common module với đầy đủ utilities
4. ✅ Config module
5. ✅ Auth module với guards, strategies
6. ✅ Prisma module với migrations

### ⚠️ Cần cải thiện:

1. ⚠️ **Tests folder** - Nên tạo `test/` ở root level
2. ⚠️ **APIM module** - Cần kiểm tra và tổ chức lại nếu cần
3. ⚠️ **Firebase config file** - Nên dùng environment variables thay vì file JSON

### ❌ Thiếu (nhưng không bắt buộc):

1. ❌ `common/decorators/` - Không có custom decorators nên không cần
2. ❌ `common/guards/` - Guards đã có trong auth/ nên không cần
3. ❌ `common/middleware/` - Nếu có custom middleware

---

## 🎯 Kết luận

### Điểm mạnh:

- ✅ Cấu trúc đã rất chuẩn theo NestJS
- ✅ Profile DB module đã được refactor tốt với structure rõ ràng
- ✅ Common module đã có đầy đủ utilities cần thiết
- ✅ Modules đã được tổ chức tốt với separation of concerns

### Cần cải thiện:

1. ⚠️ **Xóa hoặc tổ chức lại `apim/` module** (hiện tại folder trống)
2. ✅ **Tests folder** - Đã có `test/` ở root level
3. ✅ **Firebase config** - Đã được ignore trong `.gitignore`

### Tổng điểm: **9.5/10** ⭐⭐⭐⭐⭐

**Cấu trúc dự án đã rất tốt và chuẩn theo NestJS best practices!**

---

## 📝 Checklist cải thiện

### Priority 1: Dọn dẹp

- [ ] Xóa `src/apim/` nếu không dùng (folder trống)

### Priority 2: Tổ chức tests (tùy chọn)

- [ ] Tạo `test/unit/` cho unit tests
- [ ] Tạo `test/e2e/` cho e2e tests (hoặc giữ nguyên ở root)

### Priority 3: Cải thiện (tùy chọn)

- [ ] Tạo `common/decorators/` nếu có custom decorators
- [ ] Tạo `common/guards/` nếu có shared guards
