# 🎁 Hướng dẫn Test Gifts API trên Swagger

## 📋 **Tổng quan**

Tất cả endpoints Gifts đã được chuẩn hóa và thống nhất tại:

**Base Path**: `/profile/:user_id/gifts`

**Tính năng:**

- ✅ Pagination format chuẩn
- ✅ Validation đầy đủ
- ✅ Error handling tốt
- ✅ Swagger documentation đầy đủ
- ✅ Gift Wall với milestones và progress
- ✅ Recent gifts tracking
- ✅ Inventory/Gift bag management
- ✅ Filter items theo category và type

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
GET /profile/:user_id/gifts/items?category={category_id}&type={type}
```

- **Path**: `user_id` = bất kỳ
- **Query**:
  - `category` (optional) - lọc theo category ID
  - `type` (optional) - lọc theo type: `hot`, `event`, `lucky`, `friendship`, `vip`, `normal`
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
  "receiver_id": "user-receiver-id",
  "gift_item_id": "gift-item-id",
  "quantity": 1,
  "message": "Happy Birthday!"
}
```

**Lưu ý:**

- `sender_id` sẽ tự động được set từ `user_id` trong path param
- Nếu muốn gửi từ user khác, có thể thêm `sender_id` vào body (override)

**Validation:**

- ✅ `quantity` >= 1 (nếu gửi 0 hoặc âm sẽ báo lỗi)
- ✅ `receiver_id` và `gift_item_id` bắt buộc
- ✅ `message` là optional

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
GET /profile/:user_id/gifts/items?category={category_id}&type={type}
```

**Query Parameters:**

- `category` (optional): Lọc theo category ID
- `type` (optional): Lọc theo type: `hot`, `event`, `lucky`, `friendship`, `vip`, `normal`

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

- ✅ Test không có query params → trả về tất cả items
- ✅ Test với `category` hợp lệ → chỉ trả về items của category đó
- ✅ Test với `type` hợp lệ → chỉ trả về items của type đó
- ✅ Test với cả `category` và `type` → filter kết hợp

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

#### 3.5. **Gift Wall Overview** (MỚI)

```
GET /profile/:user_id/gifts/gift-wall
```

**Expected Response:**

```json
{
  "error": false,
  "code": 0,
  "message": "Success",
  "data": {
    "user_id": "123",
    "username": "Darlene Bears",
    "avatar_url": "/avatars/darlene.jpg",
    "total_gifts": 112,
    "xp_to_next_level": 200,
    "level": 34,
    "description": "Help me light up the Gift Wall."
  },
  "traceId": "..."
}
```

**Test Cases:**

- ✅ Lấy thông tin tổng quan Gift Wall của user
- ✅ Tính level và XP dựa trên tổng số quà nhận được

---

#### 3.6. **Gift Wall Milestones với Progress** (MỚI)

```
GET /profile/:user_id/gifts/gift-wall/:milestone_id/givers
```

**Path Parameters:**

- `user_id`: ID của user
- `milestone_id` (optional): ID của milestone cụ thể (nếu không có thì trả về tất cả)

**Expected Response:**

```json
{
  "error": false,
  "code": 0,
  "message": "Success",
  "data": [
    {
      "milestone_id": "gift-item-1",
      "name": "Quà tặng 1",
      "icon_url": "/images/gift_milestone_1.png",
      "required_count": 10,
      "current_count": 5,
      "is_unlocked": false,
      "progress": 0.5
    }
  ],
  "traceId": "..."
}
```

**Test Cases:**

- ✅ Lấy tất cả milestones với progress
- ✅ Test với milestone_id cụ thể (nếu có)

---

#### 3.7. **Recent Gifts** (MỚI)

```
GET /profile/:user_id/gifts/recent-gifts?page=1&limit=20
```

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
        "transaction_id": "tx12345",
        "sender": {
          "user_id": "101",
          "username": "Malenna Calzoni",
          "avatar_url": "/avatars/malenna.jpg"
        },
        "gift_info": {
          "gift_name": "Quà x1",
          "icon_url": "/images/gift_icon_a.png",
          "quantity": 1
        },
        "timestamp": "2025-11-07T18:00:00Z"
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

- ✅ Lấy danh sách quà nhận gần đây với pagination
- ✅ Test với page và limit khác nhau

---

#### 3.8. **Inventory/Gift Bag** (MỚI)

```
GET /profile/:user_id/gifts/inventory?page=1&limit=20
```

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
        "id": "inv-1",
        "user_id": "user-1",
        "item_id": "101",
        "name": "Rose",
        "quantity": 5
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

- ✅ Lấy danh sách vật phẩm trong inventory với pagination
- ✅ Kiểm tra `name` được lấy từ ResItem

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

### CRUD Operations

- [ ] Tạo gift mới thành công (sender_id tự động từ path)
- [ ] Tạo gift với `quantity` < 1 → Validation error
- [ ] Lấy danh sách gifts với pagination
- [ ] Lấy gift summary với pagination
- [ ] Lấy chi tiết gift hợp lệ
- [ ] Lấy chi tiết gift không tồn tại → 404
- [ ] Update gift thành công
- [ ] Update gift không tồn tại → 404
- [ ] Xóa gift thành công
- [ ] Xóa gift không tồn tại → 404

### Catalog & Summary

- [ ] Lấy categories
- [ ] Lấy items (không có filter)
- [ ] Lấy items với filter `category`
- [ ] Lấy items với filter `type`
- [ ] Lấy items với filter `category` và `type`
- [ ] Lấy top supporters
- [ ] Lấy milestones

### Gift Wall & Recent

- [ ] Lấy Gift Wall overview
- [ ] Lấy Gift Wall milestones với progress
- [ ] Lấy recent gifts với pagination
- [ ] Lấy inventory/gift bag với pagination

---

## 🎯 **Kết luận**

Tất cả endpoints đã được:

- ✅ Chuẩn hóa format pagination
- ✅ Optimize database queries
- ✅ Thêm validation đầy đủ
- ✅ Cập nhật Swagger documentation
- ✅ Error handling tốt
- ✅ Thống nhất routing pattern (`/profile/:user_id/gifts`)
- ✅ Thêm Gift Wall với milestones và progress
- ✅ Thêm Recent Gifts tracking
- ✅ Thêm Inventory/Gift Bag management
- ✅ Cải thiện filter items (category + type)

**Tất cả Gift APIs giờ đã thống nhất tại một nơi!** 🚀

**Base Path**: `/profile/:user_id/gifts`
