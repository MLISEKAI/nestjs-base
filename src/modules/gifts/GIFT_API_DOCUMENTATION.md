# 🎁 Gift API Documentation - Phân tích chi tiết các endpoints

## 📋 Tổng quan

Module Gift được chia thành **4 controllers** với các mục đích khác nhau:

1. **GiftCatalogController** - Catalog công khai (không cần auth)
2. **GiftsController** - User endpoints (cần auth, chỉ xem/sửa gifts của chính mình)
3. **GiftsPublicController** - Xem gift wall của user khác (không cần auth)
4. **GiftsAdminController** - Admin endpoints (cần auth + admin role)

---

## 🛍️ 1. Gift Catalog Controller (`/gifts`)

### 1.1. `GET /gifts/items`

**Mục đích:** Lấy danh sách các gift items có sẵn để gửi (cho modal chọn quà)

**Authentication:** ❌ Không cần

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
    "id": 101, // Numeric ID (hash từ UUID)
    "name": "Rose", // Tên gift
    "image_url": "https://...", // URL hình ảnh
    "price": 10, // Giá (số)
    "type": "normal", // Loại quà
    "is_event": true, // Có phải gift của event không
    "event_end_date": "2025-12-31T23:59:59Z" // Ngày kết thúc event (null nếu không phải event)
  }
]
```

**Logic:**

- Cache 30 phút (items ít thay đổi)
- Convert UUID → numeric ID bằng hash function
- `is_event = true` nếu có `event_id` trong database
- Lấy `event_end_date` từ relation `event.end_time`

**Sử dụng trong UI:**

- ✅ **Screen 2 & 3**: Modal chọn quà với tabs (Hot, Event, Lucky, Friendship, Vip)
- Frontend sẽ gọi: `GET /gifts/items?type=hot`, `GET /gifts/items?type=event`, etc.

---

## 👤 2. Gifts Controller (`/gifts`) - User Endpoints

**Authentication:** ✅ Cần JWT token (AuthGuard)
**Base Path:** `/gifts`
**Lưu ý:** Tất cả endpoints tự động lấy `user_id` từ JWT token

---

### 2.1. `GET /gifts/items` ❌ **KHÔNG TỒN TẠI**

**Vấn đề:** Endpoint này không có trong `GiftsController`, chỉ có trong `GiftCatalogController`

**Giải pháp:** Frontend nên dùng `GET /gifts/items` (từ GiftCatalogController) vì không cần auth

---

### 2.2. `POST /gifts` - Gửi quà tặng

**Mục đích:** Gửi quà tặng cho user khác

**Authentication:** ✅ Cần JWT token

**Rate Limit:** 10 requests/phút

**Request Body:**

```json
{
  "receiver_id": "user-id-uuid", // ID người nhận
  "gift_item_id": "gift-item-uuid", // ID gift item (từ /gifts/items)
  "quantity": 1, // Số lượng (>= 1)
  "message": "Happy birthday!" // Tin nhắn kèm theo (optional)
}
```

**Response:** Gift object đã tạo

**Logic:**

- Tự động lấy `sender_id` từ JWT token
- Tạo record trong `res_gift` table
- Invalidate cache:
  - `user:{receiver_id}:balance`
  - `user:{receiver_id}:gift-wall`
  - `user:{receiver_id}:gifts:*`

**Sử dụng trong UI:**

- ✅ **Screen 2 & 3**: Khi user click "Send" button trong modal chọn quà

---

### 2.3. `GET /gifts` - Danh sách quà đã nhận

**Mục đích:** Lấy danh sách quà tặng mà user hiện tại đã nhận được

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
        "id": "gift-uuid",
        "sender_id": "sender-uuid",
        "receiver_id": "receiver-uuid",
        "gift_item_id": "item-uuid",
        "quantity": 1,
        "message": "...",
        "created_at": "2025-01-01T00:00:00Z",
        "sender": { ... },
        "giftItem": { ... }
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

- Filter theo `receiver_id = user_id` (từ JWT)
- Pagination với `page` và `limit`
- Include `sender` và `giftItem` relations

**Sử dụng trong UI:**

- ✅ Có thể dùng để hiển thị danh sách quà đã nhận (nhưng có endpoint chuyên dụng hơn)

---

### 2.4. `GET /gifts/top` - Top supporters

**Mục đích:** Lấy danh sách top người gửi quà nhiều nhất cho user hiện tại

**Authentication:** ✅ Cần JWT token

**Response Format:**

```json
[
  {
    "user_id": "user-uuid",
    "username": "John Doe",
    "avatar_url": "...",
    "total_gifts": 50, // Tổng số quà đã gửi
    "total_value": 5000 // Tổng giá trị
  }
]
```

**Logic:**

- Cache 5 phút
- Group by `sender_id`, tính tổng `quantity` và `price * quantity`
- Sort theo `total_value` DESC

**Sử dụng trong UI:**

- ✅ **Screen 1**: Section "Top Supporter" (có arrow icon)

---

---

### 2.5. `GET /gifts/gift-wall` - Thông tin Gift Wall

**Mục đích:** Lấy thông tin tổng quan về Gift Wall của user hiện tại

**Authentication:** ✅ Cần JWT token

**Response Format:**

```json
{
  "user_id": "123",
  "username": "Darlene Bears",
  "avatar_url": "/avatars/darlene.jpg",
  "total_gifts": 112, // Tổng giá trị daimon (diamond value) của tất cả quà đã nhận
  "xp_to_next_level": 200, // XP cần để lên level tiếp theo
  "level": 34, // Level hiện tại
  "description": "Help me light up the Gift Wall."
}
```

**Logic:**

- Tính `total_gifts` = tổng giá trị daimon = sum(price \* quantity) cho tất cả gifts đã nhận
- Mỗi quà có giá trị daimon = `price` (từ `res_gift_item`) × `quantity` (từ `res_gift`)
- Tính `level` và `xp_to_next_level` dựa trên giá trị daimon (mỗi 10 daimon = 1 level)
- Khi user gửi quà, giá trị daimon của quà đó sẽ được cộng vào `total_gifts` để tính level

**Sử dụng trong UI:**

- ✅ **Screen 2, 3, 4, 5**: Header của Gift Wall với level progress (★112/200 Level 34)

---

### 2.6. `GET /gifts/gift-wall/:milestone_id/givers` - Milestones với progress

**Mục đích:** Lấy danh sách milestones với progress (cho grid gift icons)

**Authentication:** ✅ Cần JWT token

**Path Parameters:**

- `milestone_id` (optional) - Nếu có thì chỉ lấy milestone đó

**Response Format:**

```json
[
  {
    "id": "gift-item-1",
    "name": "Quà tặng 1",
    "icon_url": "/images/gift_milestone_1.png",
    "required_count": 10, // Số lượng cần để unlock
    "current_count": 5 // Số lượng hiện tại (khi +1 thì frontend tự hiển thị progress)
  }
]
```

**Logic:**

- Lấy từ config milestones
- Tính `current_count` từ số lượng gift items đã nhận (tổng `quantity` của mỗi gift item)
- Frontend tự tính progress và hiển thị (1/10, 5/10, etc.) nên không cần trả về `is_unlocked` và `progress`

**Sử dụng trong UI:**

- ✅ **Screen 2, 4**: Grid gift icons với progress (5/10, 1/10, etc.)

---

### 2.7. `GET /gifts/recent-gifts` - Quà nhận gần đây

**Mục đích:** Lấy danh sách quà nhận gần đây (cho tab "Quà tặng gần đây")

**Authentication:** ✅ Cần JWT token

**Query Parameters:**

- `page` (optional, default: 1)
- `limit` (optional, default: 20)

**Response Format:**

```json
{
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
  "meta": { ... }
}
```

**Logic:**

- Lấy gifts với `receiver_id = user_id`
- Sort theo `created_at DESC`
- Format để hiển thị danh sách người gửi

**Sử dụng trong UI:**

- ✅ **Screen 3, 5**: Tab "Quà tặng gần đây" với danh sách người gửi

---

### 2.8. `GET /gifts/inventory` - Gift Bag (Túi quà)

**Mục đích:** Lấy danh sách vật phẩm trong inventory/gift bag của user

**Authentication:** ✅ Cần JWT token

**Query Parameters:**

- `page` (optional, default: 1)
- `limit` (optional, default: 20)

**Response Format:**

```json
{
  "items": [
    {
      "item_id": "101",
      "name": "Rose",
      "quantity": 5,        // Số lượng trong bag
      "image_url": "..."
    }
  ],
  "meta": { ... }
}
```

**Logic:**

- Lấy từ `user_inventory` table
- Filter theo `user_id` và `item_type = 'gift'`

**Sử dụng trong UI:**

- ✅ **Screen 4, 5**: Modal "túi quà" (gift bag)
  - Screen 4: Hiển thị grid với quantity (x3, x1, etc.)
  - Screen 5: Hiển thị "No items available" nếu empty

---

### 2.9. `GET /gifts/:id` - Chi tiết 1 quà tặng

**Mục đích:** Lấy thông tin chi tiết của 1 quà tặng

**Authentication:** ✅ Cần JWT token

**Path Parameters:**

- `id` - Gift ID

**Response:** Gift object với đầy đủ thông tin

**Logic:**

- Chỉ trả về gift mà user là sender hoặc receiver

---

### 2.10. `PUT /gifts/:id` - Cập nhật quà tặng

**Mục đích:** Cập nhật quà tặng (chỉ gift mà user đã gửi)

**Authentication:** ✅ Cần JWT token

**Request Body:**

```json
{
  "message": "Updated message"
}
```

**Logic:**

- Chỉ cho phép update gift mà `sender_id = user_id`

---

### 2.11. `DELETE /gifts/:id` - Xóa quà tặng

**Mục đích:** Xóa quà tặng (chỉ gift mà user đã gửi)

**Authentication:** ✅ Cần JWT token

**Logic:**

- Chỉ cho phép delete gift mà `sender_id = user_id`

---

## 🌐 3. Gifts Public Controller (`/public/users/:user_id/gifts`)

**Authentication:** ❌ Không cần (public endpoints)

**Mục đích:** Xem gift wall của user khác (public profile)

---

### 3.1. `GET /public/users/:user_id/gifts/gift-wall`

**Mục đích:** Xem Gift Wall của user khác (không cần đăng nhập)

**Path Parameters:**

- `user_id` - ID của user muốn xem

**Response:** Tương tự `GET /gifts/gift-wall` (nhưng của user khác)

**Sử dụng trong UI:**

- ✅ Khi xem profile của user khác

---

### 3.2. `GET /public/users/:user_id/gifts/gift-wall/:milestone_id/givers`

**Mục đích:** Xem milestones của user khác (không cần đăng nhập)

**Path Parameters:**

- `user_id` - ID của user
- `milestone_id` (optional) - ID của milestone

**Response:** Tương tự `GET /gifts/gift-wall/:milestone_id/givers`

---

## 🔐 4. Gifts Admin Controller (`/admin/users/:user_id/gifts`)

**Authentication:** ✅ Cần JWT token + Admin role

**Mục đích:** Admin có thể xem/quản lý gifts của bất kỳ user nào

**Endpoints:** Tương tự GiftsController nhưng:

- Không có `POST`, `PUT`, `DELETE` (chỉ xem)
- Tất cả endpoints đều có `user_id` trong path (thay vì lấy từ JWT)

---

## 📊 Tổng kết - Mapping với UI

### Screen 1: User Profile

- ✅ `GET /gifts/top` - Top Supporter section

### Screen 2 & 3: Gift Selection Modal

- ✅ `GET /gifts/items?type=hot` - Load gifts theo tab
- ✅ `GET /gifts/items?type=event` - Event gifts
- ✅ `GET /gifts/gift-wall` - Level progress (★112/200 Level 34)
- ✅ `POST /gifts` - Send gift

### Screen 2, 4: Gift Wall (Tường quà tặng)

- ✅ `GET /gifts/gift-wall` - Header info
- ✅ `GET /gifts/gift-wall/:milestone_id/givers` - Grid milestones với progress

### Screen 3, 5: Recent Gifts (Quà tặng gần đây)

- ✅ `GET /gifts/recent-gifts` - Danh sách người gửi gần đây

### Screen 4, 5: Gift Bag (Túi quà)

- ✅ `GET /gifts/inventory` - Danh sách items trong bag

---

## ⚠️ Vấn đề phát hiện

### 1. ❌ Endpoint trùng lặp

- `GET /gifts/items` có trong `GiftCatalogController` (public)
- Nhưng không có trong `GiftsController` (user)
- **Giải pháp:** ✅ Đúng rồi - Catalog là public, không cần auth

### 2. ✅ Tất cả endpoints đã đúng với UI requirements

### 3. ✅ Response format đã chuẩn (pagination, error handling)

---

## 🎯 Kết luận

**Tất cả API endpoints đã đúng và đầy đủ cho UI requirements!**

- ✅ Gift selection modal → `GET /gifts/items`
- ✅ Send gift → `POST /gifts`
- ✅ Gift wall → `GET /gifts/gift-wall` + `GET /gifts/gift-wall/:milestone_id/givers`
- ✅ Recent gifts → `GET /gifts/recent-gifts`
- ✅ Gift bag → `GET /gifts/inventory`
- ✅ Top supporters → `GET /gifts/top`

**Không cần thay đổi gì!** 🎉
