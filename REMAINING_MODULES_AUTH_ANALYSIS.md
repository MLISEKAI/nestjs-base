# 🔍 Phân tích Authentication & Authorization cho các Modules còn lại

## 📋 Tổng quan

Phân tích 10 modules để xác định:

- ✅ Cần Authentication (JWT Guard)
- ✅ Cần Admin APIs
- ✅ Cần Public APIs

---

## 1. 🔐 AUTH

**Path hiện tại:** `/auth`

### Phân tích:

- ✅ **Đã có Guards** ở một số endpoints (me, refresh, logout, etc.)
- ❌ **Không có Admin endpoints**
- ✅ **Public endpoints** (register, login) - Đúng rồi, không cần auth

### Đề xuất:

#### ✅ **ĐÃ ĐÚNG:**

- **Register/Login** - Không cần auth (public)
- **Me/Refresh/Logout** - Đã có JWT Guard ✅

#### ⚠️ **CẦN KIỂM TRA:**

- Các endpoints khác có cần Admin APIs không? (thường không cần)

#### ✅ **KẾT LUẬN:**

- **Status:** ✅ **OK** - Không cần refactor
- **Lý do:** Auth module đã được thiết kế đúng (public cho register/login, protected cho me/refresh)

---

## 2. 👥 USERS

**Path hiện tại:** `/users`

### Phân tích:

- ❌ **KHÔNG có AuthGuard** - Cần thêm
- ❌ **Không có Admin endpoints**
- ⚠️ **Có Public endpoint** (GET /users/:id - public profile)

### Đề xuất:

#### ✅ **CẦN Authentication:**

- **Lý do:** User chỉ có thể update profile của chính mình
- **Mức độ:** 🟡 **MEDIUM** - Nên có

#### ✅ **CẦN Admin APIs:**

- **Lý do:** Admin cần quản lý users (ban, unban, xem thông tin)
- **Endpoints đề xuất:**
  ```
  GET  /admin/users/:user_id
  PUT  /admin/users/:user_id
  DELETE /admin/users/:user_id
  GET  /admin/users (list all users)
  ```

#### ✅ **CẦN Public API:**

- **Lý do:** Xem public profile của user khác
- **Endpoint đề xuất:**
  ```
  GET /public/users/:user_id
  → Xem public profile (read-only)
  ```

#### 🔄 **Refactor:**

- Thêm JWT Guard cho các endpoints cần auth
- Bỏ `user_id` khỏi path cho user tự update → `/users/me`
- Tạo Admin controller
- Tạo Public controller

---

## 3. 💬 MESSAGES

**Path hiện tại:** `/users/:id/messages`

### Phân tích:

- ❌ **KHÔNG có AuthGuard** - Rất nguy hiểm!
- ❌ **Không có Admin endpoints**
- ❌ **Không có Public endpoints**

### Đề xuất:

#### ✅ **CẦN Authentication:**

- **Lý do:** Messages là private, cần bảo mật cao
- **Mức độ:** 🔴 **CRITICAL** - Bắt buộc phải có

#### ✅ **CẦN Admin APIs:**

- **Lý do:** Admin cần xem messages để moderation (spam, abuse)
- **Endpoints đề xuất:**
  ```
  GET  /admin/users/:user_id/messages
  DELETE /admin/users/:user_id/messages/:message_id
  ```

#### ❌ **KHÔNG cần Public APIs:**

- **Lý do:** Messages là private

#### 🔄 **Refactor:**

- Bỏ `user_id` khỏi path → `/messages`
- Lấy `sender_id` từ JWT token
- Thêm JWT Guard
- Tạo Admin controller

---

## 4. 🔗 CONNECTIONS

**Path hiện tại:** `/users/:id/...` (followers, following, friends)

### Phân tích:

- ❌ **KHÔNG có AuthGuard**
- ❌ **Không có Admin endpoints**
- ⚠️ **Có thể có Public endpoints** (xem followers/following của user khác)

### Đề xuất:

#### ✅ **CẦN Authentication:**

- **Lý do:** User chỉ có thể follow/unfollow từ chính mình
- **Mức độ:** 🟡 **MEDIUM** - Nên có

#### ✅ **CẦN Admin APIs:**

- **Lý do:** Admin cần quản lý connections (ban follow, remove connections)
- **Endpoints đề xuất:**
  ```
  GET  /admin/users/:user_id/followers
  GET  /admin/users/:user_id/following
  DELETE /admin/users/:user_id/following/:following_id
  ```

#### ✅ **CẦN Public API:**

- **Lý do:** Xem followers/following của user khác (public profile)
- **Endpoints đề xuất:**
  ```
  GET /public/users/:user_id/followers
  GET /public/users/:user_id/following
  GET /public/users/:user_id/stats (followers_count, following_count)
  ```

#### 🔄 **Refactor:**

- Bỏ `user_id` khỏi path cho user actions → `/followers`, `/following`
- Lấy `user_id` từ JWT token
- Thêm JWT Guard
- Tạo Admin controller
- Tạo Public controller

---

## 5. 🔔 NOTIFICATIONS

**Path hiện tại:** `/notifications`

### Phân tích:

- ✅ **ĐÃ CÓ AuthGuard** - OK!
- ❌ **Không có Admin endpoints**
- ❌ **Không có Public endpoints**

### Đề xuất:

#### ✅ **ĐÃ ĐÚNG:**

- **User APIs** - Đã có JWT Guard ✅
- **Lấy user_id từ req.user.id** - Đã đúng ✅

#### ✅ **CẦN Admin APIs:**

- **Lý do:** Admin cần xem/quản lý notifications của user
- **Endpoints đề xuất:**
  ```
  GET  /admin/users/:user_id/notifications
  POST /admin/users/:user_id/notifications
  DELETE /admin/users/:user_id/notifications/:id
  ```

#### ✅ **KẾT LUẬN:**

- **Status:** ✅ **OK** - Chỉ cần thêm Admin APIs

---

## 6. 📤 UPLOAD

**Path hiện tại:** `/upload`

### Phân tích:

- ✅ **ĐÃ CÓ AuthGuard** - OK!
- ❌ **Không có Admin endpoints**
- ❌ **Không có Public endpoints**

### Đề xuất:

#### ✅ **ĐÃ ĐÚNG:**

- **User APIs** - Đã có JWT Guard ✅
- **Lấy user từ req.user** - Đã đúng ✅

#### ⚠️ **CÓ THỂ cần Admin APIs:**

- **Lý do:** Admin có thể cần upload files (optional)
- **Endpoints đề xuất (optional):**
  ```
  POST /admin/upload/image
  ```

#### ✅ **KẾT LUẬN:**

- **Status:** ✅ **OK** - Không cần refactor

---

## 7. 👁️ PROFILE VIEWS

**Path hiện tại:** `/profile/:user_id/profile-views`

### Phân tích:

- ❌ **KHÔNG có AuthGuard**
- ❌ **Không có Admin endpoints**
- ⚠️ **Có thể có Public endpoint** (xem số lượt xem profile)

### Đề xuất:

#### ✅ **CẦN Authentication:**

- **Lý do:** User chỉ xem profile views của chính mình
- **Mức độ:** 🟡 **MEDIUM** - Nên có

#### ✅ **CẦN Admin APIs:**

- **Lý do:** Admin cần xem profile views để analytics
- **Endpoints đề xuất:**
  ```
  GET  /admin/users/:user_id/profile-views
  ```

#### ✅ **CẦN Public API:**

- **Lý do:** Có thể hiển thị số lượt xem profile (social proof)
- **Endpoint đề xuất:**
  ```
  GET /public/users/:user_id/profile-views
  → Chỉ trả về: total_views (không có danh sách chi tiết)
  ```

#### 🔄 **Refactor:**

- Bỏ `user_id` khỏi path → `/profile-views`
- Lấy `user_id` từ JWT token
- Thêm JWT Guard
- Tạo Admin controller
- Tạo Public controller

---

## 8. 👤 PROFILE

**Path hiện tại:** `/profile/:user_id`

### Phân tích:

- ❌ **KHÔNG có AuthGuard**
- ❌ **Không có Admin endpoints**
- ⚠️ **Có Public endpoint** (GET /profile/:user_id - public profile)

### Đề xuất:

#### ✅ **CẦN Authentication:**

- **Lý do:** User chỉ update profile của chính mình
- **Mức độ:** 🟡 **MEDIUM** - Nên có

#### ✅ **CẦN Admin APIs:**

- **Lý do:** Admin cần quản lý profiles (ban, unban, edit)
- **Endpoints đề xuất:**
  ```
  GET  /admin/users/:user_id/profile
  PATCH /admin/users/:user_id/profile
  DELETE /admin/users/:user_id/profile
  ```

#### ✅ **CẦN Public API:**

- **Lý do:** Xem public profile của user khác
- **Endpoint đề xuất:**
  ```
  GET /public/users/:user_id/profile
  → Xem public profile (read-only)
  ```

#### 🔄 **Refactor:**

- Bỏ `user_id` khỏi path cho user actions → `/profile`
- Lấy `user_id` từ JWT token
- Thêm JWT Guard
- Tạo Admin controller
- Tạo Public controller

---

## 9. 📷 ALBUMS

**Path hiện tại:** `/profile/:user_id/albums`

### Phân tích:

- ❌ **KHÔNG có AuthGuard**
- ❌ **Không có Admin endpoints**
- ⚠️ **Có thể có Public endpoint** (xem albums của user khác)

### Đề xuất:

#### ✅ **CẦN Authentication:**

- **Lý do:** User chỉ quản lý albums của chính mình
- **Mức độ:** 🟡 **MEDIUM** - Nên có

#### ✅ **CẦN Admin APIs:**

- **Lý do:** Admin cần quản lý albums (moderation, ban inappropriate content)
- **Endpoints đề xuất:**
  ```
  GET  /admin/users/:user_id/albums
  DELETE /admin/users/:user_id/albums/:album_id
  ```

#### ✅ **CẦN Public API:**

- **Lý do:** Xem albums của user khác (public gallery)
- **Endpoint đề xuất:**
  ```
  GET /public/users/:user_id/albums
  → Xem albums của user (read-only)
  ```

#### 🔄 **Refactor:**

- Bỏ `user_id` khỏi path → `/albums`
- Lấy `user_id` từ JWT token
- Thêm JWT Guard
- Tạo Admin controller
- Tạo Public controller

---

## 10. 👥 CLANS

**Path hiện tại:** `/profile/:user_id/clans`

### Phân tích:

- ❌ **KHÔNG có AuthGuard**
- ❌ **Không có Admin endpoints**
- ⚠️ **Có Public endpoint** (GET /clans/all - danh sách clans)

### Đề xuất:

#### ✅ **CẦN Authentication:**

- **Lý do:** User chỉ quản lý clans của chính mình
- **Mức độ:** 🟡 **MEDIUM** - Nên có

#### ✅ **CẦN Admin APIs:**

- **Lý do:** Admin cần quản lý clans (ban clans, moderation)
- **Endpoints đề xuất:**
  ```
  GET  /admin/users/:user_id/clans
  DELETE /admin/clans/:clan_id
  PATCH /admin/clans/:clan_id
  ```

#### ✅ **CẦN Public API:**

- **Lý do:** Xem danh sách clans (GET /clans/all) - Đã có nhưng nên tách ra
- **Endpoints đề xuất:**
  ```
  GET /public/clans/all
  GET /public/users/:user_id/clans
  ```

#### 🔄 **Refactor:**

- Bỏ `user_id` khỏi path → `/clans`
- Lấy `user_id` từ JWT token
- Thêm JWT Guard
- Tạo Admin controller
- Tạo Public controller

---

## 📊 Tổng kết

| Module            | Auth Required            | Admin APIs  | Public APIs | Priority  | Status       |
| ----------------- | ------------------------ | ----------- | ----------- | --------- | ------------ |
| **Auth**          | ✅ OK (một số endpoints) | ❌ No       | ✅ OK       | ✅ Done   | ✅ OK        |
| **Users**         | ✅ Yes                   | ✅ Yes      | ✅ Yes      | 🟡 Medium | ❌ Need      |
| **Messages**      | ✅ CRITICAL              | ✅ Yes      | ❌ No       | 🔴 High   | ❌ Need      |
| **Connections**   | ✅ Yes                   | ✅ Yes      | ✅ Yes      | 🟡 Medium | ❌ Need      |
| **Notifications** | ✅ OK                    | ✅ Yes      | ❌ No       | ✅ Done   | ⚠️ Add Admin |
| **Upload**        | ✅ OK                    | ⚠️ Optional | ❌ No       | ✅ Done   | ✅ OK        |
| **Profile Views** | ✅ Yes                   | ✅ Yes      | ✅ Yes      | 🟡 Medium | ❌ Need      |
| **Profile**       | ✅ Yes                   | ✅ Yes      | ✅ Yes      | 🟡 Medium | ❌ Need      |
| **Albums**        | ✅ Yes                   | ✅ Yes      | ✅ Yes      | 🟡 Medium | ❌ Need      |
| **Clans**         | ✅ Yes                   | ✅ Yes      | ✅ Yes      | 🟡 Medium | ❌ Need      |

---

## 🎯 Action Items

### Priority 1 (Critical):

1. ✅ **Messages** - Thêm JWT Guard ngay lập tức
2. ✅ **Messages** - Tạo Admin APIs

### Priority 2 (High):

3. ✅ **Users** - Thêm JWT Guard + Admin APIs + Public API
4. ✅ **Connections** - Thêm JWT Guard + Admin APIs + Public API
5. ✅ **Profile Views** - Thêm JWT Guard + Admin APIs + Public API
6. ✅ **Profile** - Thêm JWT Guard + Admin APIs + Public API
7. ✅ **Albums** - Thêm JWT Guard + Admin APIs + Public API
8. ✅ **Clans** - Thêm JWT Guard + Admin APIs + Public API

### Priority 3 (Low):

9. ✅ **Notifications** - Thêm Admin APIs (User APIs đã OK)

---

## ✅ Modules đã OK

- **Auth** - ✅ Không cần refactor
- **Upload** - ✅ Không cần refactor
- **Notifications** - ✅ Chỉ cần thêm Admin APIs

---

## 🔄 Refactor Pattern (giống Gift)

Tất cả modules cần refactor nên follow pattern:

### User APIs:

```
GET  /messages
POST /messages
→ Lấy user_id từ JWT token
```

### Admin APIs:

```
GET  /admin/users/:user_id/messages
→ Admin xem messages của user bất kỳ
```

### Public APIs (nếu cần):

```
GET /public/users/:user_id/profile
→ Xem public profile của user (read-only)
```
