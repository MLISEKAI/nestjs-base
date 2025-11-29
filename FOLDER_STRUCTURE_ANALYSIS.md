# Phân tích cấu trúc thư mục Common vs APIM

## Tình trạng hiện tại

### 📁 `src/common/` - Shared utilities và infrastructure
```
common/
├── cache/              ✅ Infrastructure - Redis caching
├── constants/          ✅ Shared constants
├── controllers/        ⚠️  upload.controller.ts - Nên move vào module riêng
├── decorator/          ✅ Custom decorators
├── dto/                ✅ Base DTOs (pagination, query, response)
├── enum/               ⚠️  Duplicate với enums/
├── enums/              ✅ Business enums (message-type, room-mode, etc.)
├── exception/          ✅ Exception handling
├── filters/            ✅ Exception filters
├── guards/             ✅ Auth guards
├── interceptors/       ✅ Response interceptors
├── interfaces/         ✅ TypeScript interfaces
├── monitoring/         ✅ Performance monitoring
├── pipes/              ✅ Validation pipes
├── rate-limit/         ✅ Rate limiting
├── services/           ⚠️  External API services - Nên move vào apim/
│   ├── cloudinary.service.ts
│   ├── email.service.ts
│   ├── firebase.service.ts
│   └── upload.service.ts
├── tracing/            ✅ Logging và tracing
├── types/              ✅ TypeScript types
└── utils/              ✅ Utility functions
```

### 📁 `src/apim/` - External API integrations
```
apim/
├── dto/                ✅ API-specific DTOs
├── interfaces/         ✅ API interfaces
└── services/           ✅ External API services
    ├── abstract.service.ts
    ├── aws.service.ts
    ├── axios.service.ts
    ├── be-admin.service.ts
    ├── giphy.service.ts
    └── google-maps.service.ts
```

---

## ⚠️ Vấn đề phát hiện

### 1. **Duplicate folders: `enum/` và `enums/`**
- `src/common/enum/` - 3 files (error, mail, pagination)
- `src/common/enums/` - 12 files (business enums)
- **Giải pháp**: Merge vào `enums/` và xóa `enum/`

### 2. **Services không đúng chỗ**
Các services trong `common/services/` thực chất là external API integrations:

#### ❌ Nên move vào `apim/services/`:
- `cloudinary.service.ts` - Cloudinary API (upload images)
- `firebase.service.ts` - Firebase API (push notifications)
- `upload.service.ts` - File upload orchestration (dùng Cloudinary/AWS)

#### ✅ Có thể giữ trong `common/services/`:
- `email.service.ts` - Email service (infrastructure)

### 3. **Controller không đúng chỗ**
- `common/controllers/upload.controller.ts` - Nên tạo module `uploads/` riêng

### 4. **AWS Service trùng lặp**
- `apim/services/aws.service.ts` - AWS S3 upload
- `common/services/cloudinary.service.ts` - Cloudinary upload
- `common/services/upload.service.ts` - Orchestrator

**Vấn đề**: Có 2 upload services (AWS và Cloudinary) nhưng không có abstraction layer

---

## 📋 Đề xuất cấu trúc mới

### Option 1: Tách riêng Upload Module (Recommended)

```
src/
├── common/                     # Shared utilities ONLY
│   ├── cache/                  ✅ Keep
│   ├── constants/              ✅ Keep
│   ├── decorators/             ✅ Rename from decorator/
│   ├── dto/                    ✅ Keep (base DTOs only)
│   ├── enums/                  ✅ Keep (merge enum/ vào đây)
│   ├── exceptions/             ✅ Rename from exception/
│   ├── filters/                ✅ Keep
│   ├── guards/                 ✅ Keep
│   ├── interceptors/           ✅ Keep
│   ├── interfaces/             ✅ Keep
│   ├── monitoring/             ✅ Keep
│   ├── pipes/                  ✅ Keep
│   ├── rate-limit/             ✅ Keep
│   ├── services/               ✅ Keep (infrastructure only)
│   │   └── email.service.ts    ✅ Keep
│   ├── tracing/                ✅ Keep
│   ├── types/                  ✅ Keep
│   └── utils/                  ✅ Keep
│
├── apim/                       # External API integrations
│   ├── dto/
│   ├── interfaces/
│   └── services/
│       ├── abstract.service.ts
│       ├── aws.service.ts      ✅ Keep
│       ├── axios.service.ts    ✅ Keep
│       ├── be-admin.service.ts ✅ Keep
│       ├── cloudinary.service.ts  ⬅️ MOVE từ common/services/
│       ├── firebase.service.ts    ⬅️ MOVE từ common/services/
│       ├── giphy.service.ts    ✅ Keep
│       └── google-maps.service.ts ✅ Keep
│
└── modules/
    └── uploads/                ⬅️ NEW MODULE
        ├── controllers/
        │   └── upload.controller.ts  ⬅️ MOVE từ common/controllers/
        ├── dto/
        │   ├── file-upload.dto.ts    ⬅️ MOVE từ common/dto/
        │   ├── image-transformation.dto.ts
        │   └── simple-upload.dto.ts
        ├── interfaces/
        │   └── image-transformation.interface.ts
        ├── services/
        │   └── upload.service.ts     ⬅️ MOVE từ common/services/
        └── uploads.module.ts
```

### Option 2: Giữ nguyên nhưng cleanup (Simpler)

```
src/
├── common/
│   ├── enums/                  ⬅️ MERGE enum/ vào đây
│   ├── services/               ⬅️ MOVE external APIs vào apim/
│   │   └── email.service.ts    ✅ Keep only
│   └── ... (keep others)
│
└── apim/
    └── services/
        ├── aws.service.ts
        ├── cloudinary.service.ts   ⬅️ MOVE từ common/
        ├── firebase.service.ts     ⬅️ MOVE từ common/
        ├── upload.service.ts       ⬅️ MOVE từ common/
        └── ... (keep others)
```

---

## 🎯 Recommended Actions

### Phase 1: Quick Cleanup (Ngay lập tức)

1. **Merge enum folders**
```bash
# Move files từ common/enum/ vào common/enums/
mv src/common/enum/*.ts src/common/enums/
rm -rf src/common/enum/
```

2. **Move external API services to apim/**
```bash
# Move Cloudinary
mv src/common/services/cloudinary.service.ts src/apim/services/
mv src/common/services/CLOUDINARY_SETUP.md src/apim/services/

# Move Firebase
mv src/common/services/firebase.service.ts src/apim/services/

# Move Upload orchestrator
mv src/common/services/upload.service.ts src/apim/services/
mv src/common/services/FILE_UPLOAD_SETUP.md src/apim/services/
mv src/common/services/IMAGE_TRANSFORMATION_GUIDE.md src/apim/services/
```

3. **Update imports**
```typescript
// BEFORE
import { CloudinaryService } from 'src/common/services/cloudinary.service';
import { FirebaseService } from 'src/common/services/firebase.service';
import { UploadService } from 'src/common/services/upload.service';

// AFTER
import { CloudinaryService } from 'src/apim/services/cloudinary.service';
import { FirebaseService } from 'src/apim/services/firebase.service';
import { UploadService } from 'src/apim/services/upload.service';
```

### Phase 2: Create Uploads Module (Optional)

1. **Create uploads module**
```bash
nest g module modules/uploads
nest g controller modules/uploads
nest g service modules/uploads
```

2. **Move upload-related files**
```bash
# Move controller
mv src/common/controllers/upload.controller.ts src/modules/uploads/controllers/

# Move DTOs
mv src/common/dto/file-upload.dto.ts src/modules/uploads/dto/
mv src/common/dto/image-transformation.dto.ts src/modules/uploads/dto/
mv src/common/dto/simple-upload.dto.ts src/modules/uploads/dto/

# Move interfaces
mv src/common/interfaces/image-transformation.interface.ts src/modules/uploads/interfaces/
```

### Phase 3: Rename folders (Optional)

```bash
# Singular -> Plural for consistency
mv src/common/decorator src/common/decorators
mv src/common/exception src/common/exceptions
```

---

## 📊 Impact Analysis

### Files cần update imports:

#### 1. Cloudinary Service
```bash
# Find all files importing CloudinaryService
grep -r "from 'src/common/services/cloudinary" src/
```

**Expected files**:
- `src/common/services/upload.service.ts`
- `src/common/controllers/upload.controller.ts`
- `src/modules/*/` (các modules dùng upload)

#### 2. Firebase Service
```bash
# Find all files importing FirebaseService
grep -r "from 'src/common/services/firebase" src/
```

**Expected files**:
- `src/modules/notifications/`
- `src/modules/realtime/`

#### 3. Upload Service
```bash
# Find all files importing UploadService
grep -r "from 'src/common/services/upload" src/
```

**Expected files**:
- `src/common/controllers/upload.controller.ts`
- `src/modules/profile/`
- `src/modules/posts/`
- `src/modules/stories/`

---

## 🎨 Naming Conventions

### Current Issues:
- ❌ `decorator/` (singular)
- ❌ `exception/` (singular)
- ✅ `decorators/` would be better
- ✅ `exceptions/` would be better

### Recommended:
```
common/
├── decorators/     (not decorator/)
├── exceptions/     (not exception/)
├── enums/          ✅ Already plural
├── filters/        ✅ Already plural
├── guards/         ✅ Already plural
├── interceptors/   ✅ Already plural
└── ...
```

---

## 🔍 Dependency Graph

### Common Dependencies:
```
common/
├── cache/          → Redis (external)
├── services/
│   └── email.service.ts → SMTP (external)
├── monitoring/     → Winston (logging)
└── tracing/        → Winston (logging)
```

### APIM Dependencies:
```
apim/
└── services/
    ├── aws.service.ts          → AWS SDK
    ├── cloudinary.service.ts   → Cloudinary SDK
    ├── firebase.service.ts     → Firebase Admin SDK
    ├── giphy.service.ts        → Giphy API
    └── google-maps.service.ts  → Google Maps API
```

**Observation**: Tất cả services trong `apim/` đều là external API integrations ✅

---

## ✅ Benefits of Restructuring

### 1. Clear Separation of Concerns
- `common/` = Shared utilities và infrastructure
- `apim/` = External API integrations
- `modules/` = Business logic

### 2. Better Maintainability
- Dễ tìm file hơn
- Rõ ràng file nào là external API
- Dễ test và mock external services

### 3. Consistent Naming
- Plural folder names
- Clear module boundaries

### 4. Easier Onboarding
- New developers biết ngay đâu là external API
- Rõ ràng dependencies

---

## 🚀 Migration Steps

### Step 1: Backup
```bash
git checkout -b refactor/folder-structure
git add .
git commit -m "backup: before folder restructure"
```

### Step 2: Merge enum folders
```bash
# Move files
mv src/common/enum/*.ts src/common/enums/
rm -rf src/common/enum/

# Update imports
find src/ -type f -name "*.ts" -exec sed -i "s|from 'src/common/enum/|from 'src/common/enums/|g" {} +
```

### Step 3: Move services to apim
```bash
# Move Cloudinary
mv src/common/services/cloudinary.service.ts src/apim/services/
mv src/common/services/CLOUDINARY_SETUP.md src/apim/services/

# Move Firebase  
mv src/common/services/firebase.service.ts src/apim/services/

# Move Upload
mv src/common/services/upload.service.ts src/apim/services/
mv src/common/services/FILE_UPLOAD_SETUP.md src/apim/services/
mv src/common/services/IMAGE_TRANSFORMATION_GUIDE.md src/apim/services/

# Update imports
find src/ -type f -name "*.ts" -exec sed -i "s|from 'src/common/services/cloudinary|from 'src/apim/services/cloudinary|g" {} +
find src/ -type f -name "*.ts" -exec sed -i "s|from 'src/common/services/firebase|from 'src/apim/services/firebase|g" {} +
find src/ -type f -name "*.ts" -exec sed -i "s|from 'src/common/services/upload|from 'src/apim/services/upload|g" {} +
```

### Step 4: Test
```bash
yarn build
yarn test
```

### Step 5: Commit
```bash
git add .
git commit -m "refactor: restructure common and apim folders"
```

---

## 📝 Summary

### Current State:
- ❌ Duplicate folders (`enum/` và `enums/`)
- ❌ External API services trong `common/services/`
- ❌ Upload controller trong `common/controllers/`
- ⚠️  Inconsistent naming (singular vs plural)

### Recommended State:
- ✅ Single `enums/` folder
- ✅ All external APIs trong `apim/services/`
- ✅ Upload module riêng (optional)
- ✅ Consistent plural naming

### Priority:
1. **High**: Merge enum folders
2. **High**: Move external API services to apim
3. **Medium**: Create uploads module
4. **Low**: Rename singular folders to plural
