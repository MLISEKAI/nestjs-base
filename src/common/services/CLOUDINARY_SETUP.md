# ☁️ Hướng dẫn Setup Cloudinary

## 📋 **Tổng quan**

Đã chuyển từ **Firebase Storage** sang **Cloudinary** để upload ảnh.

**Lợi ích của Cloudinary:**

- ✅ Dễ setup hơn (không cần tạo bucket)
- ✅ Tự động optimize images (resize, format conversion, etc.)
- ✅ CDN tích hợp sẵn
- ✅ Free tier rộng rãi (25GB storage, 25GB bandwidth/month)
- ✅ Transform images on-the-fly với URL parameters

---

## 🔧 **Cách setup**

### **Bước 1: Tạo Cloudinary Account**

1. Vào: https://cloudinary.com/users/register/free
2. Đăng ký tài khoản miễn phí
3. Verify email

### **Bước 2: Lấy Credentials**

Sau khi đăng nhập, vào **Dashboard**, bạn sẽ thấy:

```
Cloud name: your-cloud-name
API Key: 123456789012345
API Secret: abcdefghijklmnopqrstuvwxyz123456
```

### **Bước 3: Cấu hình .env**

Thêm vào file `.env`:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

### **Bước 4: Restart Server**

```bash
npm run start:dev
```

---

## 🧪 **Test Upload**

### **1. Upload một ảnh:**

```bash
curl -X POST http://localhost:3001/upload/image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.jpg" \
  -F "folder=avatars"
```

**Response:**

```json
{
  "url": "https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/avatars/1234567890-test.jpg",
  "filename": "test.jpg",
  "size": 12345,
  "mimetype": "image/jpeg"
}
```

### **2. Upload nhiều ảnh:**

```bash
curl -X POST http://localhost:3001/upload/images \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@image1.jpg" \
  -F "files=@image2.jpg" \
  -F "folder=albums"
```

---

## 🎨 **Transform Images (Cloudinary Feature)**

Cloudinary cho phép transform images trực tiếp từ URL:

### **Resize:**

```
Original: https://res.cloudinary.com/cloud/image/upload/v1/avatars/photo.jpg
Resized:  https://res.cloudinary.com/cloud/image/upload/w_200,h_200,c_fill/avatars/photo.jpg
```

### **Format Conversion:**

```
WebP: https://res.cloudinary.com/cloud/image/upload/f_webp/avatars/photo.jpg
AVIF: https://res.cloudinary.com/cloud/image/upload/f_avif/avatars/photo.jpg
```

### **Quality:**

```
High: https://res.cloudinary.com/cloud/image/upload/q_auto:best/avatars/photo.jpg
Low:  https://res.cloudinary.com/cloud/image/upload/q_auto:low/avatars/photo.jpg
```

### **Crop:**

```
Fill:  https://res.cloudinary.com/cloud/image/upload/w_300,h_300,c_fill/avatars/photo.jpg
Fit:   https://res.cloudinary.com/cloud/image/upload/w_300,h_300,c_fit/avatars/photo.jpg
Scale: https://res.cloudinary.com/cloud/image/upload/w_300,h_300,c_scale/avatars/photo.jpg
```

**Xem thêm:** https://cloudinary.com/documentation/image_transformations

---

## 📊 **So sánh Firebase vs Cloudinary**

| Feature            | Firebase Storage     | Cloudinary               |
| ------------------ | -------------------- | ------------------------ |
| Setup              | Cần tạo bucket       | Chỉ cần credentials      |
| Image Optimization | ❌ Không có          | ✅ Tự động               |
| Transform          | ❌ Không có          | ✅ On-the-fly            |
| CDN                | ✅ Có                | ✅ Có                    |
| Free Tier          | 5GB storage, 1GB/day | 25GB storage, 25GB/month |
| Pricing            | $0.026/GB storage    | $0.04/GB storage         |

---

## 🔒 **Security**

### **1. Upload Presets (Khuyến nghị)**

Tạo upload preset trong Cloudinary Dashboard để giới hạn:

- File types
- File size
- Folder paths
- Transformations

**Cách tạo:**

1. Vào **Settings** → **Upload**
2. Click **Add upload preset**
3. Cấu hình:
   - **Preset name**: `avatar-upload`
   - **Signing mode**: `Unsigned` (hoặc `Signed` cho security)
   - **Folder**: `avatars`
   - **Allowed formats**: `jpg, png, webp`
   - **Max file size**: `5MB`

### **2. Upload Signatures (Production)**

Để secure hơn, có thể dùng signed uploads:

```typescript
// Generate signature on server
const timestamp = Math.round(new Date().getTime() / 1000);
const signature = cloudinary.utils.api_sign_request(
  {
    timestamp: timestamp,
    folder: 'avatars',
  },
  process.env.CLOUDINARY_API_SECRET,
);
```

---

## 📝 **API Endpoints**

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

---

## ✅ **Checklist Setup**

- [ ] Tạo Cloudinary account
- [ ] Lấy Cloud Name, API Key, API Secret
- [ ] Thêm vào `.env`
- [ ] Restart server
- [ ] Test upload file
- [ ] Verify file trong Cloudinary Dashboard

---

## 🔗 **Links hữu ích**

- Cloudinary Dashboard: https://console.cloudinary.com/
- Documentation: https://cloudinary.com/documentation
- Image Transformations: https://cloudinary.com/documentation/image_transformations
- Node.js SDK: https://cloudinary.com/documentation/node_integration

---

## 💡 **Troubleshooting**

### **Lỗi: "Cloudinary is not configured"**

- ✅ Kiểm tra `.env` có đủ 3 biến: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- ✅ Restart server sau khi thêm env variables

### **Lỗi: "Invalid API credentials"**

- ✅ Kiểm tra API Key và API Secret có đúng không
- ✅ Copy từ Cloudinary Dashboard (không có spaces)

### **Lỗi: "File size exceeds limit"**

- ✅ Cloudinary free tier: 10MB per file
- ✅ Có thể tăng trong paid plan

---

## 🎯 **Migration từ Firebase**

Nếu đã có files trong Firebase Storage:

1. **Download files từ Firebase**
2. **Upload lại lên Cloudinary** (có thể dùng script)
3. **Update URLs trong database**

**Script example:**

```typescript
// migrate-files.ts
import { CloudinaryService } from './cloudinary.service';
import { PrismaService } from './prisma.service';

async function migrateFiles() {
  // 1. Get all users with Firebase URLs
  const users = await prisma.resUser.findMany({
    where: { avatar: { startsWith: 'https://storage.googleapis.com' } },
  });

  // 2. Download and re-upload to Cloudinary
  for (const user of users) {
    const firebaseUrl = user.avatar;
    // Download file...
    // Upload to Cloudinary...
    // Update database...
  }
}
```

---

## 📚 **Best Practices**

1. **Use folders** để organize files: `avatars/`, `albums/`, `posts/`
2. **Optimize images** với transformations: `q_auto`, `f_auto`
3. **Use CDN** - Cloudinary tự động dùng CDN
4. **Set upload limits** trong code (đã có: 5MB max)
5. **Delete old files** khi không dùng nữa
