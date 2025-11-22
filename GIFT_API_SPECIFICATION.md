# 🎁 Gift API Specification - Theo code thực tế

## 📋 Tổng quan

Tất cả endpoints Gift được chia thành **3 controllers**:

1. **GiftCatalogController** (`/gifts`) - Public catalog (không cần auth)
2. **GiftsController** (`/gifts`) - User endpoints (cần auth, lấy user_id từ JWT token)
3. **GiftsPublicController** (`/public/users/:user_id/gifts`) - Xem gift wall của user khác (không cần auth)

**Lưu ý:** User endpoints tự động lấy `user_id` từ JWT token, không cần truyền trong path.

---

## 🛍️ 1. Give a Gift - Gửi quà tặng

### 1.1. User Balance & Level

**Endpoint:** `GET /users/me/balance`

**Authentication:** ✅ Cần JWT token

**Mục đích:** Lấy thông tin cấp độ và XP của user hiện tại

**Response Format:**
```json
{
  "level": 34,
  "current_xp": 12,
  "xp_to_next_level": 200
}
```

**Logic:**
- Tính level dựa trên tổng số quà đã nhận (mỗi 10 quà = 1 level)
- `current_xp = totalGifts % 10`
- `xp_to_next_level = 10 - current_xp`
- Cache 5 phút

**Sử dụng trong UI:**
- ✅ Hiển thị level và XP progress trong header modal gửi quà

---

### 1.2. Gift Items (Catalog)

**Endpoint:** `GET /gifts/items`

**Authentication:** ❌ Không cần (public)

**Query Parameters:**
- `type` (optional): Lọc theo loại quà
  - `hot` - Quà hot/trending
  - `event` - Quà sự kiện
  - `lucky` - Quà may mắn
  - `friendship` - Quà tình bạn
  - `vip` - Quà VIP
  - `normal` - Quà thường

**Response Format:**
```json
[
  {
    "id": 101,
    "name": "Rose",
    "image_url": "https://img.com/rose.png",
    "price": 10,
    "type": "normal",
    "is_event": true,
    "event_end_date": "2025-12-31T23:59:59Z"
  }
]
```

**Logic:**
- Cache 30 phút
- Convert UUID → numeric ID bằng hash function
- `is_event = true` nếu có `event_id`
- Lấy `event_end_date` từ `event.end_time`

**Sử dụng trong UI:**
- ✅ **Modal chọn quà**: Hiển thị tất cả quà có sẵn theo tab (Hot, Event, Lucky, Friendship, VIP)
- Frontend tự group theo `type` (không cần endpoint categories)

---

### 1.3. User Inventory (Gift Bag)

**Endpoint:** `GET /gifts/inventory`

**Authentication:** ✅ Cần JWT token

**Query Parameters:**
- `page` (optional, default: 1) - Số trang
- `limit` (optional, default: 20) - Số lượng mỗi trang

**Response Format:**
```json
{
  "error": false,
  "code": 0,
  "message": "Success",
  "data": {
    "items": [
      {
        "id": "inventory-uuid",
        "user_id": "user-uuid",
        "item_id": "item-uuid",
        "name": "Rose",
        "quantity": 5
      }
    ],
    "meta": {
      "item_count": 20,
      "total_items": 100,
      "items_per_page": 20,
      "total_pages": 5,
      "current_page": 1
    }
  },
  "traceId": "..."
}
```

**Logic:**
- Lấy từ `res_inventory` table
- Filter theo `user_id` (từ JWT) và `item_type = 'gift'`
- Pagination với `page` và `limit`

**Sử dụng trong UI:**
- ✅ **Gift Bag modal**: Hiển thị danh sách quà trong túi với quantity (x3, x1, etc.)

---

### 1.4. Send Gift

**Endpoint:** `POST /gifts`

**Authentication:** ✅ Cần JWT token

**Rate Limit:** 10 requests/phút

**Request Body:**
```json
{
  "receiver_id": "user-receiver-uuid",
  "gift_item_id": "gift-item-uuid",
  "quantity": 1,
  "message": "Happy birthday!"
}
```

**Response Format:**
```json
{
  "id": "gift-uuid",
  "sender_id": "user-sender-uuid",
  "receiver_id": "user-receiver-uuid",
  "gift_item_id": "gift-item-uuid",
  "quantity": 1,
  "message": "Happy birthday!",
  "created_at": "2025-11-22T10:00:00Z"
}
```

**Logic:**
- Tự động lấy `sender_id` từ JWT token
- Tạo record trong `res_gift` table
- Invalidate cache:
  - `user:{receiver_id}:balance`
  - `user:{receiver_id}:gift-wall`
  - `user:{receiver_id}:gifts:*`

**Sử dụng trong UI:**
- ✅ **Modal gửi quà**: Khi user click "Send" button

---

## 🎁 2. Gift Wall - Tường quà tặng

### 2.1. Gift Wall Overview

**Endpoint:** `GET /gifts/gift-wall`

**Authentication:** ✅ Cần JWT token (user hiện tại)
**Public:** `GET /public/users/:user_id/gifts/gift-wall` (không cần auth)

**Mục đích:** Lấy thông tin tổng quan Gift Wall

**Response Format:**
```json
{
  "user_id": "user-uuid",
  "username": "Darlene Bears",
  "avatar_url": "/avatars/darlene.jpg",
  "total_gifts": 112,
  "xp_to_next_level": 200,
  "level": 34,
  "description": "Help me light up the Gift Wall."
}
```

**Logic:**
- `total_gifts` = tổng giá trị daimon = `sum(price * quantity)` cho tất cả quà đã nhận
- Tính `level` và `xp_to_next_level` dựa trên giá trị daimon (mỗi 10 daimon = 1 level)
- Cache 5 phút

**Sử dụng trong UI:**
- ✅ **Gift Wall header**: Hiển thị level progress (★112/200 Level 34)

---

### 2.2. Gift Wall Milestones

**Endpoint:** `GET /gifts/gift-wall/:milestone_id/givers`

**Authentication:** ✅ Cần JWT token (user hiện tại)
**Public:** `GET /public/users/:user_id/gifts/gift-wall/:milestone_id/givers` (không cần auth)

**Path Parameters:**
- `milestone_id` (optional) - Nếu có thì chỉ lấy milestone đó

**Response Format:**
```json
[
  {
    "id": "gift-item-uuid",
    "name": "Quà tặng 1",
    "icon_url": "/images/gift_milestone_1.png",
    "required_count": 10,
    "current_count": 5
  }
]
```

**Logic:**
- Lấy tất cả gift items
- Tính `current_count` từ số lượng gift items đã nhận (tổng `quantity`)
- `required_count` = 10 (default milestone requirement)
- Frontend tự tính progress và hiển thị (5/10, 1/10, etc.)

**Sử dụng trong UI:**
- ✅ **Gift Wall grid**: Hiển thị grid gift icons với progress (5/10, 1/10, etc.)

---

### 2.3. Recent Gifts

**Endpoint:** `GET /gifts/recent-gifts`

**Authentication:** ✅ Cần JWT token

**Query Parameters:**
- `page` (optional, default: 1) - Số trang
- `limit` (optional, default: 20) - Số lượng mỗi trang

**Response Format:**
```json
{
  "items": [
    {
      "transaction_id": "gift-uuid",
      "sender": {
        "user_id": "user-uuid",
        "username": "Malenna Calzoni",
        "avatar_url": "/avatars/malenna.jpg"
      },
      "gift_info": {
        "gift_name": "Rose",
        "icon_url": "/images/gift_icon_a.png",
        "quantity": 1
      },
      "timestamp": "2025-11-07T18:00:00Z"
    }
  ],
  "meta": {
    "item_count": 20,
    "total_items": 100,
    "items_per_page": 20,
    "total_pages": 5,
    "current_page": 1
  }
}
```

**Logic:**
- Lấy gifts với `receiver_id = user_id` (từ JWT)
- Sort theo `created_at DESC`
- Pagination với `page` và `limit`
- Cache 1 phút

**Sử dụng trong UI:**
- ✅ **Tab "Quà tặng gần đây"**: Danh sách người gửi quà gần đây

---

## 📊 3. Gift Overview - Tổng quan quà tặng

### 3.1. Gift Overview (Items mẫu + Total Count)

**Endpoint:** `GET /gifts`

**Authentication:** ✅ Cần JWT token

**Query Parameters:**
- `type` (optional): Lọc quà theo type (hot, event, lucky, friendship, vip, normal)
- `limit` (optional, default: 3): Số lượng items mẫu muốn lấy

**Response Format:**
```json
{
  "items": [
    {
      "id": 101,
      "name": "Rose",
      "image_url": "https://..."
    },
    {
      "id": 102,
      "name": "Crown",
      "image_url": "https://..."
    },
    {
      "id": 103,
      "name": "Rocket",
      "image_url": "https://..."
    }
  ],
  "total_count": 180
}
```

**Logic:**
- Chỉ trả về một số items mẫu (mặc định 3 items) để hiển thị icon
- `total_count` = tổng số quà đã nhận (count)
- Gọi song song `getGiftItemsSample()` và `getCount()` để tối ưu
- Cache 1 phút

**Sử dụng trong UI:**
- ✅ **User Profile**: Phần "Gifts" với icon quà (Rocket, Flower, Crown) và số "180 Gifts"

---

### 3.2. Top Supporters

**Endpoint:** `GET /gifts/top-supporters`

**Authentication:** ✅ Cần JWT token

**Response Format:**
```json
[
  {
    "id": "supporter-uuid",
    "user_id": "user-uuid",
    "supporter_id": "supporter-uuid",
    "amount": 1200
  }
]
```

**Logic:**
- Lấy từ `res_supporter` table
- Filter theo `user_id` (từ JWT)
- Sort theo `amount DESC`
- Limit 5 supporters
- Cache 5 phút

**Sử dụng trong UI:**
- ✅ **User Profile**: Section "Top Supporter" với 4 người và giá trị daimon

---

## 📝 4. API Endpoints Summary

### User Endpoints (Cần Auth, lấy user_id từ JWT)

| Method | Endpoint | Mục đích | Response Format |
| --- | --- | --- | --- |
| GET | `/gifts` | Items mẫu + total_count | `{ items: [...], total_count: 180 }` |
| GET | `/gifts/items?type={type}` | Tất cả items (catalog) | `[{ id, name, image_url, price, type, is_event, event_end_date }]` |
| GET | `/gifts/inventory` | Gift bag (túi quà) | Pagination format với `items` và `meta` |
| POST | `/gifts` | Gửi quà tặng | Gift object |
| GET | `/gifts/gift-wall` | Gift Wall overview | `{ user_id, username, avatar_url, total_gifts, level, xp_to_next_level }` |
| GET | `/gifts/gift-wall/:milestone_id/givers` | Milestones với progress | `[{ id, name, icon_url, required_count, current_count }]` |
| GET | `/gifts/recent-gifts` | Quà nhận gần đây | Pagination format với `items` và `meta` |
| GET | `/gifts/top-supporters` | Top supporters | `[{ id, user_id, supporter_id, amount }]` |
| GET | `/gifts/:id` | Chi tiết 1 quà | Gift object |
| DELETE | `/gifts/:id` | Xóa quà | `{ message: "Gift deleted" }` |

### Public Endpoints (Không cần Auth)

| Method | Endpoint | Mục đích | Response Format |
| --- | --- | --- | --- |
| GET | `/gifts/items?type={type}` | Tất cả items (catalog) | `[{ id, name, image_url, price, type, is_event, event_end_date }]` |
| GET | `/public/users/:user_id/gifts/gift-wall` | Gift Wall của user khác | `{ user_id, username, avatar_url, total_gifts, level, xp_to_next_level }` |
| GET | `/public/users/:user_id/gifts/gift-wall/:milestone_id/givers` | Milestones của user khác | `[{ id, name, icon_url, required_count, current_count }]` |

### User Balance & Level (Users Module)

| Method | Endpoint | Mục đích | Response Format |
| --- | --- | --- | --- |
| GET | `/users/me/balance` | Level và XP của user hiện tại | `{ level: 34, current_xp: 12, xp_to_next_level: 200 }` |

---

## 🔄 So sánh với Document cũ

### Khác biệt chính:

1. **Path structure:**
   - ❌ Document cũ: `/users/{user_id}/gifts/...`
   - ✅ Code thực tế: `/gifts/...` (lấy user_id từ JWT token)

2. **Categories:**
   - ❌ Document cũ: Có endpoint `/users/{user_id}/gifts/categories`
   - ✅ Code thực tế: Không có categories endpoint (frontend tự group theo `type`)

3. **Query parameter:**
   - ❌ Document cũ: `category={categoryId}`
   - ✅ Code thực tế: `type={type}` (hot, event, lucky, friendship, vip, normal)

4. **Response format:**
   - ✅ Code thực tế: Một số endpoints dùng pagination format chuẩn, một số trả về array trực tiếp

5. **User Balance:**
   - ❌ Document cũ: `/users/{user_id}/balance`
   - ✅ Code thực tế: `/users/me/balance` (lấy user_id từ JWT)

---

## ✅ Kết luận

Tất cả endpoints đã được implement đúng và đầy đủ cho UI requirements. Document này phản ánh chính xác code thực tế trong dự án.

