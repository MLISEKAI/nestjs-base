# 🎁 Gift API Structure - Phân biệt Admin, User, Public

## 📋 Tổng quan

Hệ thống Gift API được chia thành **3 nhóm** rõ ràng:

1. **🔐 User APIs** - Yêu cầu authentication, user chỉ xem/sửa của chính mình
2. **👑 Admin APIs** - Yêu cầu admin role, có thể xem/sửa của bất kỳ user
3. **🌐 Public APIs** - Không cần authentication, xem gift wall của user khác

---

## 🔐 1. USER APIs (Authenticated)

**Base Path:** `/gifts`

**Authentication:** ✅ Required (JWT Token)

**Authorization:** User chỉ có thể xem/sửa gifts của chính mình

### Endpoints:

| Method | Endpoint                                | Mô tả                            |
| ------ | --------------------------------------- | -------------------------------- |
| GET    | `/gifts/summary`                        | Gift summary của user hiện tại   |
| GET    | `/gifts/top`                            | Top gifts của user hiện tại      |
| GET    | `/gifts/milestones`                     | Milestones của user hiện tại     |
| GET    | `/gifts/gift-wall`                      | Gift wall của user hiện tại      |
| GET    | `/gifts/gift-wall/:milestone_id/givers` | Milestones với progress          |
| GET    | `/gifts/recent-gifts`                   | Recent gifts của user hiện tại   |
| GET    | `/gifts/inventory`                      | Inventory của user hiện tại      |
| POST   | `/gifts`                                | Gửi quà (sender = user hiện tại) |
| GET    | `/gifts`                                | List gifts của user hiện tại     |
| GET    | `/gifts/:id`                            | Chi tiết gift                    |
| PUT    | `/gifts/:id`                            | Update gift (chỉ gift của user)  |
| DELETE | `/gifts/:id`                            | Delete gift (chỉ gift của user)  |

### Ví dụ Request:

```bash
# Lấy gift summary
GET /gifts/summary
Headers: Authorization: Bearer <token>

# Gửi quà
POST /gifts
Headers: Authorization: Bearer <token>
Body: {
  "receiver_id": "user-123",
  "gift_item_id": "gift-item-1",
  "quantity": 1,
  "message": "For you"
}
```

---

## 👑 2. ADMIN APIs

**Base Path:** `/admin/users/:user_id/gifts`

**Authentication:** ✅ Required (JWT Token)

**Authorization:** ✅ Required (Admin role only)

**Mục đích:** Admin có thể xem gifts của bất kỳ user nào

### Endpoints:

| Method | Endpoint                                                     | Mô tả                        |
| ------ | ------------------------------------------------------------ | ---------------------------- |
| GET    | `/admin/users/:user_id/gifts/summary`                        | Gift summary của user bất kỳ |
| GET    | `/admin/users/:user_id/gifts/top`                            | Top gifts của user bất kỳ    |
| GET    | `/admin/users/:user_id/gifts/milestones`                     | Milestones của user bất kỳ   |
| GET    | `/admin/users/:user_id/gifts/gift-wall`                      | Gift wall của user bất kỳ    |
| GET    | `/admin/users/:user_id/gifts/gift-wall/:milestone_id/givers` | Milestones với progress      |
| GET    | `/admin/users/:user_id/gifts/recent-gifts`                   | Recent gifts của user bất kỳ |
| GET    | `/admin/users/:user_id/gifts/inventory`                      | Inventory của user bất kỳ    |
| GET    | `/admin/users/:user_id/gifts`                                | List gifts của user bất kỳ   |

### Ví dụ Request:

```bash
# Admin xem gift summary của user khác
GET /admin/users/user-123/gifts/summary
Headers: Authorization: Bearer <admin-token>
```

### Guard:

```typescript
@UseGuards(AuthGuard('account-auth'), AdminGuard)
```

**AdminGuard** sẽ check:

- User phải có `role === 'admin'`
- Nếu không phải admin → `403 Forbidden`

---

## 🌐 3. PUBLIC APIs

**Base Path:** `/public/users/:user_id/gifts`

**Authentication:** ❌ Không cần

**Mục đích:** Xem gift wall của user khác (public profile)

### Endpoints:

| Method | Endpoint                                                      | Mô tả                            |
| ------ | ------------------------------------------------------------- | -------------------------------- |
| GET    | `/public/users/:user_id/gifts/gift-wall`                      | Gift wall của user (public)      |
| GET    | `/public/users/:user_id/gifts/gift-wall/:milestone_id/givers` | Milestones với progress (public) |

### Ví dụ Request:

```bash
# Xem gift wall của user khác (không cần login)
GET /public/users/user-123/gifts/gift-wall
# Không cần Authorization header
```

---

## 📊 So sánh 3 loại APIs

| Tiêu chí     | User APIs       | Admin APIs                        | Public APIs                        |
| ------------ | --------------- | --------------------------------- | ---------------------------------- |
| **Path**     | `/gifts/...`    | `/admin/users/:user_id/gifts/...` | `/public/users/:user_id/gifts/...` |
| **Auth**     | ✅ Required     | ✅ Required                       | ❌ Not required                    |
| **Role**     | Any user        | Admin only                        | Anyone                             |
| **Scope**    | Own data only   | Any user's data                   | Public profile only                |
| **Use case** | User tự quản lý | Admin quản lý                     | Xem profile người khác             |

---

## 🎯 Catalog APIs (Chung cho tất cả)

**Base Path:** `/gifts` (catalog endpoints)

**Authentication:** ❌ Không cần (catalog chung)

| Method | Endpoint                     | Mô tả                |
| ------ | ---------------------------- | -------------------- |
| GET    | `/gifts/categories`          | Danh sách categories |
| GET    | `/gifts/items`               | Danh sách items      |
| GET    | `/gifts/items?category={id}` | Filter theo category |
| GET    | `/gifts/items?type={type}`   | Filter theo type     |

**Lưu ý:** Catalog endpoints nằm trong `GiftCatalogController`, không có guard.

---

## 🔒 Security Flow

### User API Flow:

```
1. Client gửi request với JWT token
2. AuthGuard verify token → req.user
3. Controller lấy req.user.id → chỉ xem/sửa của chính mình
```

### Admin API Flow:

```
1. Client gửi request với JWT token (admin)
2. AuthGuard verify token → req.user
3. AdminGuard check role === 'admin'
4. Controller lấy user_id từ path → xem/sửa của user bất kỳ
```

### Public API Flow:

```
1. Client gửi request (không cần token)
2. Controller lấy user_id từ path → xem public profile
```

---

## 📝 Ví dụ sử dụng

### Scenario 1: User xem gift của chính mình

```bash
GET /gifts/summary
Headers: Authorization: Bearer <user-token>
→ Trả về gift summary của user hiện tại
```

### Scenario 2: Admin xem gift của user khác

```bash
GET /admin/users/user-456/gifts/summary
Headers: Authorization: Bearer <admin-token>
→ Trả về gift summary của user-456
```

### Scenario 3: Xem gift wall của user khác (public)

```bash
GET /public/users/user-789/gifts/gift-wall
→ Trả về gift wall của user-789 (không cần login)
```

---

## ✅ Checklist

- [x] User APIs - Yêu cầu auth, chỉ xem của chính mình
- [x] Admin APIs - Yêu cầu admin role, xem của bất kỳ user
- [x] Public APIs - Không cần auth, xem public profile
- [x] Catalog APIs - Không cần auth, catalog chung
- [x] Admin Guard - Check role === 'admin'
- [x] JWT Guard - Verify token cho User/Admin APIs
