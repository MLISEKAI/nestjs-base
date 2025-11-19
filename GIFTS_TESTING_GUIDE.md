# 🎁 Hướng dẫn Test Gifts API trên Swagger

## 📋 **Tổng quan**

Tất cả endpoints Gifts đã được chuẩn hóa với:

- ✅ Pagination format chuẩn
- ✅ Validation đầy đủ
- ✅ Error handling tốt
- ✅ Swagger documentation đầy đủ

---

## 🔧 **Các vấn đề đã sửa**

### 1. ✅ **Logic `findAll()` - Filter theo user_id**

- **Trước**: Trả về tất cả gifts trong hệ thống
- **Sau**: Filter theo `receiver_id` = `user_id` trong path

### 2. ✅ **Chuẩn hóa `getGiftsSummary()`**

- **Trước**: Format cũ `{ total, gifts }`
- **Sau**: Format pagination chuẩn với `items` và `meta`

### 3. ✅ **Optimize `update()` và `remove()`**

- **Trước**: Query trước khi update/delete
- **Sau**: Dùng Prisma error handling (P2025) để bắt lỗi

### 4. ✅ **Thêm Validation**

- `quantity` phải >= 1 (`@Min(1)`)

### 5. ✅ **Thêm Pagination**

- `findAll()` và `getGiftsSummary()` đã có pagination

---

## 🧪 **Các bước test trên Swagger**

### **Bước 1: Chuẩn bị dữ liệu**

#### 1.1. Tạo Gift Categories (nếu chưa có)

```
GET /profile/:user_id/gifts/categories
```

- **Path**: `user_id` = bất kỳ (không ảnh hưởng)
- **Response**: Danh sách categories
- **Lưu ý**: Lưu `id` của category để dùng bước sau

#### 1.2. Tạo Gift Items (nếu chưa có)

```
GET /profile/:user_id/gifts/items?category_id={category_id}
```

- **Path**: `user_id` = bất kỳ
- **Query**: `category_id` (optional) - lọc theo category
- **Response**: Danh sách gift items
- **Lưu ý**: Lưu `id` của gift item để tạo gift

#### 1.3. Tạo Users (nếu chưa có)

```
POST /auth/register
```

- Tạo ít nhất 2 users: `sender` và `receiver`

---

### **Bước 2: Test CRUD Operations**

#### 2.1. **Tạo Gift mới**

```
POST /profile/:user_id/gifts
```

**Request Body:**

```json
{
  "sender_id": "user-sender-id",
  "receiver_id": "user-receiver-id",
  "gift_item_id": "gift-item-id",
  "quantity": 1,
  "message": "Happy Birthday!"
}
```

**Validation:**

- ✅ `quantity` >= 1 (nếu gửi 0 hoặc âm sẽ báo lỗi)
- ✅ Tất cả fields bắt buộc (trừ `quantity` và `message`)

**Expected Response:**

```json
{
  "error": false,
  "code": 0,
  "message": "Success",
  "data": {
    "id": "gift-id",
    "sender_id": "user-sender-id",
    "receiver_id": "user-receiver-id",
    "gift_item_id": "gift-item-id",
    "quantity": 1,
    "message": "Happy Birthday!",
    "created_at": "2025-01-20T10:00:00.000Z"
  },
  "traceId": "..."
}
```

---

#### 2.2. **Lấy danh sách Gifts (với pagination)**

```
GET /profile/:user_id/gifts?page=1&limit=20
```

**Path Parameters:**

- `user_id`: ID của user nhận quà (receiver)

**Query Parameters:**

- `page` (optional): Số trang (mặc định: 1)
- `limit` (optional): Số lượng mỗi trang (mặc định: 20)

**Expected Response:**

```json
{
  "error": false,
  "code": 0,
  "message": "Success",
  "data": {
    "items": [
      {
        "id": "gift-id",
        "sender_id": "user-sender-id",
        "receiver_id": "user-receiver-id",
        "gift_item_id": "gift-item-id",
        "quantity": 1,
        "message": "Happy Birthday!",
        "created_at": "2025-01-20T10:00:00.000Z",
        "sender": {
          "id": "user-sender-id",
          "nickname": "Sender Name",
          "avatar": "https://..."
        },
        "receiver": {
          "id": "user-receiver-id",
          "nickname": "Receiver Name",
          "avatar": "https://..."
        },
        "giftItem": {
          "id": "gift-item-id",
          "name": "Rose",
          "image_url": "https://...",
          "price": "100.00"
        }
      }
    ],
    "meta": {
      "item_count": 1,
      "total_items": 1,
      "items_per_page": 20,
      "total_pages": 1,
      "current_page": 1
    }
  },
  "traceId": "..."
}
```

**Test Cases:**

- ✅ Test với `page=1&limit=10`
- ✅ Test với `page=2&limit=5` (nếu có nhiều gifts)
- ✅ Test không có query params (dùng mặc định)

---

#### 2.3. **Lấy Gift Summary (với pagination)**

```
GET /profile/:user_id/gifts/summary?page=1&limit=20
```

**Path Parameters:**

- `user_id`: ID của user nhận quà (receiver)

**Query Parameters:**

- `page` (optional): Số trang (mặc định: 1)
- `limit` (optional): Số lượng mỗi trang (mặc định: 20)

**Expected Response:** (giống format pagination như trên)

**Test Cases:**

- ✅ Test với user có nhiều gifts
- ✅ Test với user chưa có gift nào
- ✅ Test pagination với `page=2`

---

#### 2.4. **Lấy chi tiết 1 Gift**

```
GET /profile/:user_id/gifts/:id
```

**Path Parameters:**

- `user_id`: ID của user (không ảnh hưởng logic)
- `id`: ID của gift

**Expected Response:**

```json
{
  "error": false,
  "code": 0,
  "message": "Success",
  "data": {
    "id": "gift-id",
    "sender_id": "user-sender-id",
    "receiver_id": "user-receiver-id",
    "gift_item_id": "gift-item-id",
    "quantity": 1,
    "message": "Happy Birthday!",
    "created_at": "2025-01-20T10:00:00.000Z"
  },
  "traceId": "..."
}
```

**Test Cases:**

- ✅ Test với ID hợp lệ
- ✅ Test với ID không tồn tại → 404 Not Found

---

#### 2.5. **Cập nhật Gift**

```
PUT /profile/:user_id/gifts/:id
```

**Request Body:**

```json
{
  "quantity": 2,
  "message": "Updated message"
}
```

**Expected Response:**

```json
{
  "error": false,
  "code": 0,
  "message": "Success",
  "data": {
    "id": "gift-id",
    "quantity": 2,
    "message": "Updated message",
    ...
  },
  "traceId": "..."
}
```

**Test Cases:**

- ✅ Update chỉ `quantity`
- ✅ Update chỉ `message`
- ✅ Update cả 2 fields
- ✅ Update với ID không tồn tại → 404 Not Found
- ✅ Update với `quantity` < 1 → Validation Error

---

#### 2.6. **Xóa Gift**

```
DELETE /profile/:user_id/gifts/:id
```

**Expected Response:**

```json
{
  "error": false,
  "code": 0,
  "message": "Success",
  "data": {
    "message": "Gift deleted successfully"
  },
  "traceId": "..."
}
```

**Test Cases:**

- ✅ Xóa gift hợp lệ
- ✅ Xóa gift không tồn tại → 404 Not Found

---

### **Bước 3: Test các Endpoints khác**

#### 3.1. **Top Supporters**

```
GET /profile/:user_id/gifts/top
```

**Expected Response:**

```json
{
  "error": false,
  "code": 0,
  "message": "Success",
  "data": [
    {
      "id": "sup-1",
      "user_id": "user-id",
      "supporter_id": "supporter-id",
      "amount": 500
    }
  ],
  "traceId": "..."
}
```

**Lưu ý**: Endpoint này lấy từ bảng `ResSupporter`, không phải từ `ResGift`

---

#### 3.2. **Gift Categories**

```
GET /profile/:user_id/gifts/categories
```

**Expected Response:**

```json
{
  "error": false,
  "code": 0,
  "message": "Success",
  "data": [
    {
      "id": "cat-1",
      "name": "Flowers"
    }
  ],
  "traceId": "..."
}
```

---

#### 3.3. **Gift Items**

```
GET /profile/:user_id/gifts/items?category_id={category_id}
```

**Query Parameters:**

- `category_id` (optional): Lọc theo category

**Expected Response:**

```json
{
  "error": false,
  "code": 0,
  "message": "Success",
  "data": [
    {
      "id": "gift-item-1",
      "name": "Rose",
      "price": "100.00",
      "category_id": "cat-1",
      "image_url": "https://...",
      "type": "normal"
    }
  ],
  "traceId": "..."
}
```

**Test Cases:**

- ✅ Test không có `category_id` → trả về tất cả items
- ✅ Test với `category_id` hợp lệ → chỉ trả về items của category đó

---

#### 3.4. **Gift Milestones**

```
GET /profile/:user_id/gifts/milestones
```

**Expected Response:**

```json
{
  "error": false,
  "code": 0,
  "message": "Success",
  "data": [
    {
      "id": "milestone-id",
      "user_id": "user-id",
      "milestone": 100,
      "current": 50,
      "reward_name": "Gold Badge",
      "icon_url": "https://...",
      "is_unlocked": false,
      "created_at": "2025-01-20T10:00:00.000Z"
    }
  ],
  "traceId": "..."
}
```

---

## ⚠️ **Lưu ý khi test**

### 1. **Validation Errors**

- `quantity` phải >= 1
- Tất cả string fields không được empty
- `sender_id`, `receiver_id`, `gift_item_id` phải tồn tại trong database

### 2. **Pagination**

- `page` phải >= 1
- `limit` phải >= 1
- Nếu không có query params, dùng mặc định: `page=1`, `limit=20`

### 3. **Error Responses**

- **404 Not Found**: Gift không tồn tại
- **400 Bad Request**: Validation error
- **500 Internal Server Error**: Database error

### 4. **Response Format**

- Tất cả responses đều có format chuẩn:
  ```json
  {
    "error": false,
    "code": 0,
    "message": "Success",
    "data": {...},
    "traceId": "..."
  }
  ```

---

## 📝 **Checklist Test**

- [ ] Tạo gift mới thành công
- [ ] Tạo gift với `quantity` < 1 → Validation error
- [ ] Lấy danh sách gifts với pagination
- [ ] Lấy gift summary với pagination
- [ ] Lấy chi tiết gift hợp lệ
- [ ] Lấy chi tiết gift không tồn tại → 404
- [ ] Update gift thành công
- [ ] Update gift không tồn tại → 404
- [ ] Xóa gift thành công
- [ ] Xóa gift không tồn tại → 404
- [ ] Lấy categories
- [ ] Lấy items (có và không có category_id)
- [ ] Lấy top supporters
- [ ] Lấy milestones

---

## 🎯 **Kết luận**

Tất cả endpoints đã được:

- ✅ Chuẩn hóa format pagination
- ✅ Optimize database queries
- ✅ Thêm validation đầy đủ
- ✅ Cập nhật Swagger documentation
- ✅ Error handling tốt

**Sẵn sàng để test!** 🚀
