# Giải Thích Các Loại ID Trong Hệ Thống Gift

## 📋 Tổng Quan

Có **3 loại ID** khác nhau liên quan đến gift:

1. **`gift_item_id`** - ID của quà trong catalog (ResGiftItem)
2. **`item_id`** - ID của item trong inventory (ResItem)
3. **`id`** (inventory) - ID của record inventory của user (ResInventory)

---

## 🔍 Chi Tiết Từng Loại

### 1. `gift_item_id` (Catalog ID)

**Nguồn:** `GET /gifts/items` (Catalog)
**Database:** `res_gift_item` table
**Mục đích:** ID của quà trong catalog (danh sách quà có thể mua)

**Ví dụ:**

```json
// GET /gifts/items response
{
  "id": "97667713-1bc5-4bb9-a3cd-32f08e460ec7", // ← gift_item_id
  "name": "Rose",
  "price": 100,
  "image_url": "..."
}
```

**Khi dùng:**

- Mua quà mới từ catalog
- Gửi quà mới (trừ Diamond)

---

### 2. `item_id` (Item ID trong Inventory)

**Nguồn:** `GET /gifts/inventory` response (field `item_id`)
**Database:** `res_item` table
**Mục đích:** ID của item đã được tạo khi user nhận quà

**Ví dụ:**

```json
// GET /gifts/inventory response
{
  "id": "d5ab278c-7e1c-4c03-b842-70fd2732ac34", // ← ResInventory ID
  "item_id": "2a45fed3-1550-4caa-a3c9-105806bd1089", // ← ResItem ID (item_id)
  "name": "Heart",
  "quantity": 99
}
```

**Khi dùng:**

- Gửi quà từ túi (dùng `item_id` từ response)
- KHÔNG trừ Diamond (quà đã được tặng)

**Flow:**

1. User A gửi quà "Heart" cho User B
2. Hệ thống tạo `ResItem` với `id = "2a45fed3-1550-4caa-a3c9-105806bd1089"`
3. Hệ thống tạo `ResInventory` cho User B với `item_id = "2a45fed3-1550-4caa-a3c9-105806bd1089"`
4. User B thấy trong túi với `item_id = "2a45fed3-1550-4caa-a3c9-105806bd1089"`

---

### 3. `id` (Inventory Record ID)

**Nguồn:** `GET /gifts/inventory` response (field `id`)
**Database:** `res_inventory` table
**Mục đích:** ID của record inventory (mỗi user có 1 record cho mỗi item)

**Ví dụ:**

```json
// GET /gifts/inventory response
{
  "id": "d5ab278c-7e1c-4c03-b842-70fd2732ac34", // ← ResInventory ID (id)
  "item_id": "2a45fed3-1550-4caa-a3c9-105806bd1089", // ← ResItem ID
  "name": "Heart",
  "quantity": 99
}
```

**Khi dùng:**

- Có thể dùng `id` này thay cho `item_id` khi gửi quà từ túi
- Hệ thống sẽ tự động tìm `item_id` tương ứng

---

## 🔄 So Sánh

| Loại ID              | Database Table  | Mục đích                  | Khi nào dùng                                |
| -------------------- | --------------- | ------------------------- | ------------------------------------------- |
| **`gift_item_id`**   | `res_gift_item` | Quà trong catalog         | Mua quà mới từ catalog                      |
| **`item_id`**        | `res_item`      | Item trong inventory      | Gửi quà từ túi (dùng `item_id` từ response) |
| **`id`** (inventory) | `res_inventory` | Record inventory của user | Gửi quà từ túi (dùng `id` từ response)      |

---

## 📊 Database Relationship

```
res_gift_item (Catalog)
  ├─ id: "97667713-1bc5-4bb9-a3cd-32f08e460ec7" (gift_item_id)
  └─ name: "Rose"

         ↓ (Khi user nhận quà)

res_item (Item trong inventory)
  ├─ id: "2a45fed3-1550-4caa-a3c9-105806bd1089" (item_id)
  └─ name: "Rose"

         ↓ (Thêm vào túi của user)

res_inventory (Túi của user)
  ├─ id: "d5ab278c-7e1c-4c03-b842-70fd2732ac34" (inventory record ID)
  ├─ item_id: "2a45fed3-1550-4caa-a3c9-105806bd1089" (FK → res_item.id)
  └─ quantity: 99
```

---

## 💡 Ví Dụ Thực Tế

### Scenario: User A gửi "Rose" cho User B

**Bước 1:** User A mua "Rose" từ catalog

```json
POST /gifts
{
  "receiver_id": "user-b",
  "gift_item_id": "97667713-1bc5-4bb9-a3cd-32f08e460ec7"  // ← gift_item_id từ catalog
}
```

**Bước 2:** Hệ thống tạo:

- `ResItem` với `id = "2a45fed3-1550-4caa-a3c9-105806bd1089"` (item_id)
- `ResInventory` cho User B với:
  - `id = "d5ab278c-7e1c-4c03-b842-70fd2732ac34"` (inventory record ID)
  - `item_id = "2a45fed3-1550-4caa-a3c9-105806bd1089"` (FK → ResItem)

**Bước 3:** User B xem túi

```json
GET /gifts/inventory
// Response:
{
  "id": "d5ab278c-7e1c-4c03-b842-70fd2732ac34",      // ← Có thể dùng
  "item_id": "2a45fed3-1550-4caa-a3c9-105806bd1089", // ← Có thể dùng
  "name": "Rose",
  "quantity": 1
}
```

**Bước 4:** User B gửi "Rose" cho User C

```json
POST /gifts
{
  "receiver_id": "user-c",
  "item_id": "2a45fed3-1550-4caa-a3c9-105806bd1089"  // ← Dùng item_id
}
// HOẶC
{
  "receiver_id": "user-c",
  "item_id": "d5ab278c-7e1c-4c03-b842-70fd2732ac34"  // ← Dùng id (cũng được)
}
```

---

## ✅ Kết Luận

- **`gift_item_id`**: Dùng khi mua quà mới từ catalog
- **`item_id`**: Dùng khi gửi quà từ túi (từ field `item_id` trong response)
- **`id`**: Có thể dùng khi gửi quà từ túi (từ field `id` trong response)

**Lưu ý:** Hệ thống hỗ trợ cả `item_id` và `id` từ response inventory, nhưng khuyến nghị dùng `item_id` để rõ ràng hơn.
