# 🔧 Tối ưu hóa User Profile Endpoint

## 📋 **Vấn đề đã phát hiện**

### **Endpoint:** `GET /users/{id}`

**Vấn đề:**

- Endpoint này đang include **tất cả albums** và **tất cả photos** trong mỗi album
- Không có pagination cho albums
- Có thể gây vấn đề hiệu năng nghiêm trọng

### **Ví dụ vấn đề:**

```typescript
// Code cũ (CÓ VẤN ĐỀ):
include: {
  albums: {
    include: {
      photos: true;
    }
  }
}
```

**Kịch bản xấu:**

- User có **100 albums**
- Mỗi album có **100 photos**
- → **10,000 records** được load trong 1 query!
- Response size có thể lên đến **MB** thay vì **KB**

### **Vấn đề về Query:**

Mặc dù Prisma sẽ optimize thành JOIN (không phải N+1 query), nhưng vẫn có vấn đề:

- ✅ **Không phải N+1 query** (Prisma optimize tốt)
- ❌ **Nhưng load quá nhiều data** (không cần thiết)
- ❌ **Không có pagination** (load hết tất cả)
- ❌ **Response size lớn** (ảnh hưởng network)

---

## ✅ **Giải pháp đã áp dụng**

### **Thay đổi:**

1. **Bỏ albums khỏi user profile response**
2. **Sử dụng endpoint riêng** khi cần albums: `GET /profile/:user_id/albums`

### **Code mới:**

```typescript
// Code mới (ĐÃ TỐI ƯU):
async findUser(id: string, includeAssociates = false) {
  // Tối ưu: Không include albums vì:
  // 1. Đã có endpoint riêng GET /profile/:user_id/albums với pagination
  // 2. Include albums + photos có thể load rất nhiều data (N albums × M photos)
  // 3. Public profile chỉ cần thông tin cơ bản của user
  // Nếu cần albums, client nên gọi endpoint riêng với pagination
  return this.prisma.resUser.findUnique({
    where: { id },
    include: {
      ...(includeAssociates && {
        associates: { ... }
      }),
    },
  });
}
```

---

## 📊 **So sánh Before/After**

### **Before (Có vấn đề):**

```json
{
  "id": "user-123",
  "nickname": "John",
  "albums": [
    {
      "id": "album-1",
      "title": "Summer",
      "photos": [
        { "id": "photo-1", ... },
        { "id": "photo-2", ... },
        // ... 100 photos
      ]
    },
    // ... 100 albums
  ]
}
```

**Vấn đề:**

- ❌ Load tất cả albums (không pagination)
- ❌ Load tất cả photos trong mỗi album
- ❌ Response size có thể rất lớn
- ❌ Query time chậm với nhiều data

### **After (Đã tối ưu):**

```json
{
  "id": "user-123",
  "nickname": "John",
  "bio": "I love coding",
  "avatar": "https://..."
  // Không có albums nữa
}
```

**Lợi ích:**

- ✅ Response nhỏ gọn, nhanh
- ✅ Chỉ load thông tin cơ bản của user
- ✅ Albums được lấy riêng với pagination khi cần

---

## 🔄 **Cách sử dụng mới**

### **Lấy thông tin user cơ bản:**

```http
GET /users/{id}
```

### **Lấy albums của user (với pagination):**

```http
GET /profile/{user_id}/albums?page=1&limit=20
```

**Response:**

```json
{
  "data": [
    {
      "id": "album-1",
      "title": "Summer",
      "image_url": "...",
      "photos": [] // Chỉ metadata, không load photos
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "total_pages": 5
  }
}
```

### **Lấy photos trong album cụ thể:**

```http
GET /profile/{user_id}/albums/{album_id}/photos
```

---

## 🎯 **Lý do thiết kế**

### **1. Separation of Concerns**

- User profile = thông tin cơ bản của user
- Albums = resource riêng, cần pagination

### **2. Performance**

- User profile được gọi thường xuyên (trong list, search, etc.)
- Không nên load albums mỗi lần
- Albums chỉ load khi user xem profile chi tiết

### **3. Scalability**

- Với 1,000 users, mỗi user 100 albums → 100,000 albums
- Nếu include albums trong profile → response rất lớn
- Tách riêng → có thể cache và optimize riêng

### **4. API Design Best Practices**

- Endpoint nên trả về data cần thiết nhất
- Data lớn nên có pagination
- Tách resource phức tạp thành endpoint riêng

---

## ⚠️ **Breaking Changes**

### **Nếu client code đang expect albums trong response:**

**Trước:**

```typescript
const user = await api.getUser(id);
const albums = user.albums; // ❌ Sẽ undefined
```

**Sau:**

```typescript
const user = await api.getUser(id);
const albums = await api.getUserAlbums(id); // ✅ Gọi endpoint riêng
```

### **Migration Guide:**

1. **Tìm tất cả nơi sử dụng `user.albums`**
2. **Thay thế bằng gọi endpoint riêng:**

   ```typescript
   // Cũ
   const albums = user.albums;

   // Mới
   const albumsResponse = await fetch(`/profile/${userId}/albums`);
   const albums = albumsResponse.data;
   ```

---

## ✅ **Kết luận**

- ✅ **Đã tối ưu** endpoint `GET /users/{id}`
- ✅ **Bỏ albums** khỏi response (tránh load quá nhiều data)
- ✅ **Sử dụng endpoint riêng** với pagination khi cần albums
- ✅ **Cải thiện performance** đáng kể
- ✅ **Tuân thủ best practices** về API design

**Kết quả:**

- Response size giảm từ **MB** xuống **KB**
- Query time nhanh hơn
- Scalable hơn với nhiều users/albums
- Dễ maintain và optimize riêng từng resource
