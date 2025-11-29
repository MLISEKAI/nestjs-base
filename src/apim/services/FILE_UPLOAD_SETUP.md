# 📤 Hướng dẫn Setup File Upload

## 🔍 **Phân tích vấn đề**

### **Lỗi hiện tại:**

```
ERROR [FirebaseService] Error: Could not load the default credentials
```

### **Nguyên nhân:**

- ❌ **Thiếu Firebase credentials** (service account key)
- ❌ **Chưa cấu hình Google Cloud Storage**
- ✅ **Đây là lỗi BACKEND**, không phải frontend

---

## 📊 **Cách hệ thống lưu file**

### **1. File được lưu ở đâu?**

**File KHÔNG lưu vào Database!**

```
┌─────────────┐      Upload      ┌──────────────────┐      Save URL      ┌──────────┐
│   Client    │ ──────────────> │  Firebase Storage │ ────────────────> │ Database │
│  (Frontend) │                  │  (Google Cloud)   │                   │ (Postgres)│
└─────────────┘                  └──────────────────┘                   └──────────┘
     File                            File (Binary)                          URL (String)
```

**Quy trình:**

1. **Client upload file** → Backend nhận file
2. **Backend upload file** → Firebase Storage (Google Cloud Storage)
3. **Firebase trả về URL** → `https://storage.googleapis.com/...`
4. **Backend lưu URL** → Database (chỉ lưu URL, không lưu file)

### **2. Ví dụ:**

**Upload avatar:**

```typescript
// 1. Upload file lên Firebase Storage
POST /upload/image
→ Response: { url: "https://storage.googleapis.com/bucket/avatars/123-avatar.jpg" }

// 2. Lưu URL vào database
PUT /users/{id}/avatar
Body: { fileUrl: "https://storage.googleapis.com/bucket/avatars/123-avatar.jpg" }
→ Database: resUser.avatar = "https://storage.googleapis.com/..."
```

**Database schema:**

```prisma
model ResUser {
  avatar String?  // Chỉ lưu URL, không lưu file
  // ...
}
```

---

## 🔧 **Cách fix lỗi**

### **Option 1: Cấu hình Firebase Service Account (Khuyến nghị)**

#### **Bước 1: Tạo Firebase Project**

1. Vào [Firebase Console](https://console.firebase.google.com/)
2. Tạo project mới hoặc chọn project có sẵn
3. Enable **Storage** trong project

#### **Bước 2: Tạo Service Account**

1. Vào **Project Settings** → **Service Accounts**
2. Click **Generate New Private Key**
3. Download file JSON (ví dụ: `firebase-service-account.json`)

#### **Bước 3: Cấu hình trong project**

**Cách 1: Lưu file JSON (Development)**

```bash
# Tạo thư mục config (nếu chưa có)
mkdir config

# Copy file service account vào
cp ~/Downloads/firebase-service-account.json config/firebase-service-account.json
```

**Cách 2: Dùng Environment Variable (Production)**

```bash
# Encode file JSON thành base64
cat firebase-service-account.json | base64

# Thêm vào .env
FIREBASE_SERVICE_ACCOUNT_BASE64=<base64_string>
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

#### **Bước 4: Cấu hình .env**

```env
# Option 1: Dùng file path
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com

# Option 2: Dùng base64 (production)
FIREBASE_SERVICE_ACCOUNT_BASE64=<base64_encoded_json>
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com

# Option 3: Chỉ cần project ID (nếu dùng default credentials)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

---

### **Option 2: Dùng Mock URL (Development - Tạm thời)**

Nếu chưa có Firebase, hệ thống sẽ tự động dùng mock URL:

```typescript
// UploadService sẽ trả về mock URL nếu Firebase chưa config
if (!this.firebaseService.isConfigured()) {
  return `https://example.com/${folder}/${Date.now()}-${file.originalname}`;
}
```

**⚠️ Lưu ý:** Mock URL không thật sự lưu file, chỉ để test API.

---

## 📝 **Cấu trúc thư mục**

```
nestjs-base/
├── config/
│   ├── firebase-service-account.json.example  # Template
│   └── firebase-service-account.json          # File thật (gitignore)
├── .env                                       # Environment variables
└── src/
    └── common/
        └── services/
            ├── firebase.service.ts            # Firebase service
            └── upload.service.ts              # Upload service
```

---

## 🧪 **Test Upload**

### **1. Upload file:**

```bash
curl -X POST http://localhost:3001/upload/image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "folder=avatars"
```

**Response:**

```json
{
  "url": "https://storage.googleapis.com/bucket/avatars/1234567890-image.jpg",
  "filename": "image.jpg",
  "size": 12345,
  "mimetype": "image/jpeg"
}
```

### **2. Lưu URL vào database:**

```bash
curl -X PUT http://localhost:3001/users/{id}/avatar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileUrl": "https://storage.googleapis.com/bucket/avatars/1234567890-image.jpg"
  }'
```

---

## ✅ **Checklist Setup**

- [ ] Tạo Firebase project
- [ ] Enable Firebase Storage
- [ ] Tạo Service Account key
- [ ] Download file JSON
- [ ] Copy file vào `config/firebase-service-account.json`
- [ ] Cấu hình `.env` với `FIREBASE_STORAGE_BUCKET`
- [ ] Restart server
- [ ] Test upload file

---

## 🔒 **Security Notes**

### **1. Gitignore:**

```gitignore
# Firebase credentials
config/firebase-service-account.json
*.json
!*.json.example
```

### **2. Production:**

- ✅ **KHÔNG commit** file service account vào git
- ✅ Dùng **environment variables** (base64 hoặc secret manager)
- ✅ Set **proper permissions** cho service account
- ✅ Chỉ cho phép upload **image types** (đã có validation)

---

## 📚 **API Endpoints**

### **Upload Image:**

```http
POST /upload/image
Content-Type: multipart/form-data
Authorization: Bearer {token}

Body:
- file: File (binary)
- folder: string (optional, default: "uploads")
```

### **Upload Multiple Images:**

```http
POST /upload/images
Content-Type: multipart/form-data
Authorization: Bearer {token}

Body:
- files: File[] (binary)
- folder: string (optional)
```

### **Update Avatar:**

```http
PUT /users/{id}/avatar
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "fileUrl": "https://storage.googleapis.com/..."
}
```

---

## 🎯 **Tóm tắt**

1. **File được lưu ở đâu?**
   - ✅ Firebase Storage (Google Cloud Storage)
   - ❌ KHÔNG lưu vào Database

2. **Database lưu gì?**
   - ✅ Chỉ lưu **URL** của file (string)
   - ❌ KHÔNG lưu file binary

3. **Lỗi hiện tại?**
   - ❌ Thiếu Firebase credentials
   - ✅ Cần cấu hình service account

4. **Cách fix?**
   - ✅ Tạo Firebase project
   - ✅ Download service account JSON
   - ✅ Cấu hình trong `.env` hoặc `config/`

5. **Có sẵn chỗ lưu chưa?**
   - ✅ Có! Database đã có field `avatar`, `image_url`, etc.
   - ✅ Chỉ cần cấu hình Firebase Storage
