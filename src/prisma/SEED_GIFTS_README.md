# 🎁 Gift Seed Data

File seed để tạo dữ liệu mẫu cho hệ thống Gift.

## 📋 Nội dung seed

Seed script sẽ tạo:

1. **Gift Categories** (6 categories):
   - Hot
   - Event
   - Lucky
   - Friendship
   - VIP
   - Normal

2. **Gift Items** (~20 items):
   - Mỗi category có 3-4 items
   - Các type: `hot`, `event`, `lucky`, `friendship`, `vip`, `normal`
   - Giá từ 3 đến 500

3. **Sample Gifts**:
   - Tạo 5-10 gifts ngẫu nhiên giữa các users
   - Mỗi gift có quantity 1-3
   - Có message kèm theo

4. **Gift Milestones**:
   - Tạo milestones cho 2 users đầu tiên
   - Các mốc: 10, 50, 100, 200, 500, 1000 gifts
   - Tự động tính `is_unlocked` dựa trên số gifts đã nhận

## 🚀 Cách chạy

### Option 1: Dùng npm script

```bash
npm run seed:gifts
```

### Option 2: Chạy trực tiếp với ts-node

```bash
npx ts-node -r tsconfig-paths/register src/prisma/seed-gifts.ts
```

### Option 3: Dùng tsx (nếu đã cài)

```bash
npx tsx src/prisma/seed-gifts.ts
```

## ⚠️ Lưu ý

1. **Cần có users trước**: Seed script sẽ kiểm tra xem có users nào không. Nếu không có, sẽ bỏ qua việc tạo gifts và milestones.

2. **Idempotent**: Script có thể chạy nhiều lần an toàn:
   - Categories: Kiểm tra theo tên, nếu đã có thì bỏ qua
   - Items: Kiểm tra theo name + category_id, nếu có thì update
   - Milestones: Kiểm tra theo user_id + milestone, nếu có thì update

3. **Database connection**: Đảm bảo file `.env` có `DATABASE_URL` đúng.

## 📊 Dữ liệu được tạo

### Categories

- Hot (4 items)
- Event (3 items)
- Lucky (3 items)
- Friendship (3 items)
- VIP (3 items)
- Normal (4 items)

### Sample Gifts

- Tạo gifts giữa các users (nếu có ít nhất 2 users)
- Mỗi user sẽ nhận 5-10 gifts từ user khác
- Gifts được tạo với timestamp cách nhau để test `recent-gifts` API

### Milestones

- Tạo cho 2 users đầu tiên
- 6 milestones mỗi user: 10, 50, 100, 200, 500, 1000
- Tự động tính `current` và `is_unlocked`

## 🧪 Test sau khi seed

Sau khi chạy seed, bạn có thể test các API:

1. **Categories**:

   ```bash
   GET /profile/{user_id}/gifts/categories
   ```

2. **Items**:

   ```bash
   GET /profile/{user_id}/gifts/items
   GET /profile/{user_id}/gifts/items?category={categoryId}
   GET /profile/{user_id}/gifts/items?type=hot
   ```

3. **Gift Wall**:

   ```bash
   GET /profile/{user_id}/gifts/gift-wall
   GET /profile/{user_id}/gifts/gift-wall/{milestone_id}/givers
   ```

4. **Recent Gifts**:

   ```bash
   GET /profile/{user_id}/gifts/recent-gifts?page=1&limit=20
   ```

5. **Inventory**:

   ```bash
   GET /profile/{user_id}/gifts/inventory
   ```

6. **Balance**:
   ```bash
   GET /users/{user_id}/balance
   ```

## 🔄 Reset và seed lại

Nếu muốn reset và seed lại từ đầu:

```bash
# Reset database (xóa tất cả data)
npm run prisma:reset

# Chạy seed lại
npm run seed:gifts
```

**Lưu ý**: `prisma:reset` sẽ xóa TẤT CẢ dữ liệu trong database, không chỉ gifts!
