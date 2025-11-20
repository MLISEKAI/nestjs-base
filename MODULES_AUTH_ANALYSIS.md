# 🔍 Phân tích Authentication & Authorization cho các Modules

## 📋 Tổng quan

Phân tích 7 modules để xác định:

- ✅ Cần Authentication (JWT Guard)
- ✅ Cần Admin APIs
- ✅ Cần Public APIs

---

## 1. 💰 WALLET

**Path hiện tại:** `/users/:user_id/wallet`

### Phân tích:

- ❌ **KHÔNG có AuthGuard** - Rất nguy hiểm!
- ❌ **Không có Admin endpoints**
- ❌ **Không có Public endpoints**
- ⚠️ **Có user_id trong path** - Nên bỏ như Gift

### Đề xuất:

#### ✅ **CẦN Authentication:**

- **Lý do:** Liên quan đến tiền, giao dịch, nạp/rút
- **Mức độ:** 🔴 **CRITICAL** - Bắt buộc phải có

#### ✅ **CẦN Admin APIs:**

- **Lý do:** Admin cần xem/quản lý wallet của user để hỗ trợ
- **Endpoints đề xuất:**
  ```
  GET  /admin/users/:user_id/wallet
  GET  /admin/users/:user_id/wallet/summary
  GET  /admin/users/:user_id/wallet/transactions/history
  ```

#### ❌ **KHÔNG cần Public APIs:**

- **Lý do:** Thông tin wallet là private, không nên public

#### 🔄 **Refactor:**

- Bỏ `user_id` khỏi path → `/wallet`
- Lấy `user_id` từ JWT token
- Thêm JWT Guard

---

## 2. 👑 VIP

**Path hiện tại:** `/profile/:user_id/vip-status`

### Phân tích:

- ❌ **KHÔNG có AuthGuard**
- ❌ **Không có Admin endpoints**
- ⚠️ **Có thể có Public endpoint** (xem VIP status của user khác)

### Đề xuất:

#### ✅ **CẦN Authentication:**

- **Lý do:** User chỉ xem/sửa VIP status của chính mình
- **Mức độ:** 🟡 **MEDIUM** - Nên có

#### ✅ **CẦN Admin APIs:**

- **Lý do:** Admin cần quản lý VIP status (kích hoạt/hủy VIP)
- **Endpoints đề xuất:**
  ```
  GET  /admin/users/:user_id/vip-status
  POST /admin/users/:user_id/vip-status
  PATCH /admin/users/:user_id/vip-status
  DELETE /admin/users/:user_id/vip-status
  ```

#### ✅ **CẦN Public API:**

- **Lý do:** Có thể hiển thị VIP badge trên public profile
- **Endpoint đề xuất:**
  ```
  GET /public/users/:user_id/vip-status
  → Chỉ trả về: is_vip, expiry (không có thông tin nhạy cảm)
  ```

#### 🔄 **Refactor:**

- Bỏ `user_id` khỏi path → `/vip-status`
- Lấy `user_id` từ JWT token
- Thêm JWT Guard

---

## 3. 🎒 INVENTORY

**Path hiện tại:** `/profile/:user_id/inventory`

### Phân tích:

- ❌ **KHÔNG có AuthGuard**
- ❌ **Không có Admin endpoints**
- ❌ **Không có Public endpoints**

### Đề xuất:

#### ✅ **CẦN Authentication:**

- **Lý do:** Inventory là tài sản của user, cần bảo mật
- **Mức độ:** 🟡 **MEDIUM** - Nên có

#### ✅ **CẦN Admin APIs:**

- **Lý do:** Admin cần xem/quản lý inventory để hỗ trợ (ví dụ: bug fix, refund)
- **Endpoints đề xuất:**
  ```
  GET  /admin/users/:user_id/inventory
  POST /admin/users/:user_id/inventory
  PATCH /admin/users/:user_id/inventory/:item_id
  DELETE /admin/users/:user_id/inventory/:item_id
  ```

#### ❌ **KHÔNG cần Public APIs:**

- **Lý do:** Inventory là private, không nên public

#### 🔄 **Refactor:**

- Bỏ `user_id` khỏi path → `/inventory`
- Lấy `user_id` từ JWT token
- Thêm JWT Guard

---

## 4. 🛍️ STORE

**Path hiện tại:** `/profile/:user_id/store`

### Phân tích:

- ❌ **KHÔNG có AuthGuard**
- ❌ **Không có Admin endpoints**
- ⚠️ **Có thể có Public endpoint** (xem store của user khác)

### Đề xuất:

#### ✅ **CẦN Authentication:**

- **Lý do:** User chỉ quản lý store của chính mình
- **Mức độ:** 🟡 **MEDIUM** - Nên có

#### ✅ **CẦN Admin APIs:**

- **Lý do:** Admin cần quản lý store items (moderation, ban items)
- **Endpoints đề xuất:**
  ```
  GET  /admin/users/:user_id/store
  POST /admin/users/:user_id/store/items
  PATCH /admin/users/:user_id/store/items/:item_id
  DELETE /admin/users/:user_id/store/items/:item_id
  ```

#### ✅ **CẦN Public API:**

- **Lý do:** Có thể xem store của user khác (marketplace)
- **Endpoint đề xuất:**
  ```
  GET /public/users/:user_id/store
  → Xem store items của user (chỉ read-only)
  ```

#### 🔄 **Refactor:**

- Bỏ `user_id` khỏi path → `/store`
- Lấy `user_id` từ JWT token
- Thêm JWT Guard

---

## 5. ✅ TASKS

**Path hiện tại:** `/profile/:user_id/tasks`

### Phân tích:

- ❌ **KHÔNG có AuthGuard**
- ❌ **Không có Admin endpoints**
- ❌ **Không có Public endpoints**

### Đề xuất:

#### ✅ **CẦN Authentication:**

- **Lý do:** Tasks là private của user
- **Mức độ:** 🟡 **MEDIUM** - Nên có

#### ⚠️ **CÓ THỂ cần Admin APIs:**

- **Lý do:** Admin có thể cần xem tasks để debug (nếu có bug)
- **Endpoints đề xuất (optional):**
  ```
  GET  /admin/users/:user_id/tasks/summary
  ```

#### ❌ **KHÔNG cần Public APIs:**

- **Lý do:** Tasks là private, không nên public

#### 🔄 **Refactor:**

- Bỏ `user_id` khỏi path → `/tasks`
- Lấy `user_id` từ JWT token
- Thêm JWT Guard

---

## 6. 🎁 REFERRALS

**Path hiện tại:** `/profile/:user_id/referrals`

### Phân tích:

- ❌ **KHÔNG có AuthGuard**
- ❌ **Không có Admin endpoints**
- ⚠️ **Có thể có Public endpoint** (xem số lượng referrals)

### Đề xuất:

#### ✅ **CẦN Authentication:**

- **Lý do:** User chỉ xem referrals của chính mình
- **Mức độ:** 🟡 **MEDIUM** - Nên có

#### ✅ **CẦN Admin APIs:**

- **Lý do:** Admin cần quản lý referrals (kiểm tra fraud, ban referrals)
- **Endpoints đề xuất:**
  ```
  GET  /admin/users/:user_id/referrals
  POST /admin/users/:user_id/referrals
  DELETE /admin/users/:user_id/referrals/:referred_id
  ```

#### ✅ **CẦN Public API:**

- **Lý do:** Có thể hiển thị số lượng referrals trên profile (social proof)
- **Endpoint đề xuất:**
  ```
  GET /public/users/:user_id/referrals
  → Chỉ trả về: total_referrals, total_earned (không có danh sách chi tiết)
  ```

#### 🔄 **Refactor:**

- Bỏ `user_id` khỏi path → `/referrals`
- Lấy `user_id` từ JWT token
- Thêm JWT Guard

---

## 7. 💕 LOVE SPACE

**Path hiện tại:** `/profile/:user_id/love-space`

### Phân tích:

- ❌ **KHÔNG có AuthGuard**
- ❌ **Không có Admin endpoints**
- ✅ **CẦN Public endpoint** (xem Love Space của user khác)

### Đề xuất:

#### ✅ **CẦN Authentication:**

- **Lý do:** User chỉ edit Love Space của chính mình
- **Mức độ:** 🟡 **MEDIUM** - Nên có

#### ⚠️ **CÓ THỂ cần Admin APIs:**

- **Lý do:** Admin có thể cần xóa/moderation nội dung không phù hợp
- **Endpoints đề xuất (optional):**
  ```
  GET  /admin/users/:user_id/love-space
  DELETE /admin/users/:user_id/love-space
  ```

#### ✅ **CẦN Public API:**

- **Lý do:** Love Space là public profile feature
- **Endpoint đề xuất:**
  ```
  GET /public/users/:user_id/love-space
  → Xem Love Space của user (read-only)
  ```

#### 🔄 **Refactor:**

- Bỏ `user_id` khỏi path → `/love-space`
- Lấy `user_id` từ JWT token
- Thêm JWT Guard

---

## 📊 Tổng kết

| Module         | Auth Required | Admin APIs  | Public APIs | Priority  |
| -------------- | ------------- | ----------- | ----------- | --------- |
| **Wallet**     | ✅ CRITICAL   | ✅ Yes      | ❌ No       | 🔴 High   |
| **VIP**        | ✅ Yes        | ✅ Yes      | ✅ Yes      | 🟡 Medium |
| **Inventory**  | ✅ Yes        | ✅ Yes      | ❌ No       | 🟡 Medium |
| **Store**      | ✅ Yes        | ✅ Yes      | ✅ Yes      | 🟡 Medium |
| **Tasks**      | ✅ Yes        | ⚠️ Optional | ❌ No       | 🟢 Low    |
| **Referrals**  | ✅ Yes        | ✅ Yes      | ✅ Yes      | 🟡 Medium |
| **Love Space** | ✅ Yes        | ⚠️ Optional | ✅ Yes      | 🟡 Medium |

---

## 🎯 Action Items

### Priority 1 (Critical):

1. ✅ **Wallet** - Thêm JWT Guard ngay lập tức
2. ✅ **Wallet** - Tạo Admin APIs

### Priority 2 (High):

3. ✅ **VIP** - Thêm JWT Guard + Admin APIs + Public API
4. ✅ **Inventory** - Thêm JWT Guard + Admin APIs
5. ✅ **Store** - Thêm JWT Guard + Admin APIs + Public API
6. ✅ **Referrals** - Thêm JWT Guard + Admin APIs + Public API
7. ✅ **Love Space** - Thêm JWT Guard + Public API

### Priority 3 (Low):

8. ✅ **Tasks** - Thêm JWT Guard

---

## 🔄 Refactor Pattern (giống Gift)

Tất cả modules nên follow pattern:

### User APIs:

```
GET  /wallet
POST /wallet
→ Lấy user_id từ JWT token
```

### Admin APIs:

```
GET  /admin/users/:user_id/wallet
→ Admin xem wallet của user bất kỳ
```

### Public APIs (nếu cần):

```
GET /public/users/:user_id/vip-status
→ Xem VIP status của user (read-only)
```
