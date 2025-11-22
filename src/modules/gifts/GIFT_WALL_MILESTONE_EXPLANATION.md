# Gift Wall Milestone - Giải Thích

## 📋 `milestone_id` là gì?

**`milestone_id`** = **`gift_item_id`** (ID của quà trong catalog)

Mỗi quà trong catalog là một **milestone**. Ví dụ:

- "Rose" → milestone_id = `gift-item-rose-uuid`
- "Heart" → milestone_id = `gift-item-heart-uuid`
- "Diamond Ring" → milestone_id = `gift-item-diamond-ring-uuid`

---

## 🎯 Endpoint: `GET /gifts/gift-wall/{milestone_id}/givers`

### Mục đích:

Lấy danh sách milestones với **progress** (tiến độ) của user.

### Path Parameter:

- **`milestone_id`** (optional): ID của gift item (gift_item_id)
  - Nếu **có** → Trả về milestone cụ thể đó
  - Nếu **không có** → Trả về tất cả milestones

### Response Format:

```json
[
  {
    "id": "gift-item-rose-uuid", // ← milestone_id (gift_item_id)
    "name": "Rose",
    "icon_url": "/images/rose.png",
    "required_count": 10, // Số lượng cần để unlock milestone
    "current_count": 5 // Số lượng user đã nhận được
  },
  {
    "id": "gift-item-heart-uuid", // ← milestone_id (gift_item_id)
    "name": "Heart",
    "icon_url": "/images/heart.png",
    "required_count": 10,
    "current_count": 3
  }
]
```

---

## 💡 Ví Dụ Sử Dụng

### 1. Lấy tất cả milestones (không có milestone_id)

```typescript
GET / gifts / gift - wall / givers;
// hoặc
GET / gifts / gift -
  wall[ //givers  // milestone_id rỗng
    // Response: Tất cả milestones với progress
    ({ id: 'rose-uuid', name: 'Rose', current_count: 5, required_count: 10 },
    { id: 'heart-uuid', name: 'Heart', current_count: 3, required_count: 10 },
    { id: 'diamond-uuid', name: 'Diamond Ring', current_count: 0, required_count: 10 })
  ];
```

### 2. Lấy milestone cụ thể (có milestone_id)

```typescript
GET / gifts / gift -
  wall / rose -
  uuid /
    givers[
      // Response: Chỉ milestone "Rose"
      { id: 'rose-uuid', name: 'Rose', current_count: 5, required_count: 10 }
    ];
```

---

## 🔄 Logic Hoạt Động

1. **Lấy tất cả gift items** từ catalog (`res_gift_item`)
2. **Đếm số lượng quà đã nhận** của user (group by `gift_item_id`)
3. **Tính progress** cho mỗi gift item:
   - `current_count` = Tổng `quantity` của quà đã nhận
   - `required_count` = 10 (default, có thể config)
4. **Trả về danh sách milestones** với progress

---

## 📊 Database Relationship

```
res_gift_item (Catalog)
  ├─ id: "rose-uuid" (milestone_id)
  └─ name: "Rose"
         ↓
res_gift (Gifts đã nhận)
  ├─ gift_item_id: "rose-uuid"
  ├─ receiver_id: "user-id"
  └─ quantity: 5
         ↓
Milestone Progress:
  ├─ id: "rose-uuid" (milestone_id)
  ├─ current_count: 5 (tổng quantity)
  └─ required_count: 10
```

---

## 🎨 Frontend Sử Dụng

### Hiển thị Gift Wall Grid:

```typescript
// 1. Lấy tất cả milestones
const milestones = await fetch('/api/gifts/gift-wall/givers').then((r) => r.json());

// 2. Hiển thị grid với progress
milestones.forEach((milestone) => {
  const progress = milestone.current_count / milestone.required_count;
  const isUnlocked = milestone.current_count >= milestone.required_count;

  // Hiển thị icon với progress bar
  // Ví dụ: "Rose 5/10" hoặc "Rose ✓" (nếu unlocked)
});
```

### Hiển thị milestone cụ thể:

```typescript
// Lấy milestone "Rose" cụ thể
const roseMilestone = await fetch('/api/gifts/gift-wall/rose-uuid/givers').then((r) => r.json());

// Hiển thị progress: "5/10 Roses"
```

---

## ⚠️ Lưu Ý

1. **`milestone_id` = `gift_item_id`**: Cùng một giá trị, chỉ khác tên gọi
2. **`milestone_id` là optional**: Nếu không có, trả về tất cả milestones
3. **Progress tính tự động**: Dựa trên số lượng quà đã nhận
4. **Default `required_count` = 10**: Có thể config sau

---

## ✅ Tóm Tắt

- **`milestone_id`** = ID của gift item trong catalog (`gift_item_id`)
- Mỗi gift item là một milestone
- Endpoint trả về progress (current_count / required_count) của milestone
- Có thể lấy tất cả hoặc milestone cụ thể
