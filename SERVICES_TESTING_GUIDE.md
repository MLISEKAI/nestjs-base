# 🧪 Hướng dẫn Test tất cả Services trong profile_db

## ✅ **Tổng quan các thay đổi đã thực hiện**

### **1. Pagination**
Tất cả endpoints list đã có pagination với format chuẩn:
- ✅ `getAlbums()` - Album Service
- ✅ `getClans()` - Clan Service
- ✅ `getAllClans()` - Clan Service
- ✅ `getFeedback()` - Feedback Service
- ✅ `getPosts()` - Post Service
- ✅ `getReferrals()` - Referral Service
- ✅ `getStore()` - Store Service
- ✅ `getHelpArticles()` - Support Service
- ✅ `getTaskSummary()` - Task Service

### **2. Optimize Update/Delete**
Các methods đã được optimize (bỏ query trước khi không cần):
- ✅ `updateFeedback()` - Feedback Service
- ✅ `deleteFeedback()` - Feedback Service (thêm error handling)
- ✅ `updateLoveSpace()` - Love Space Service
- ✅ `updatePost()` - Post Service
- ✅ `deletePost()` - Post Service
- ✅ `updateStoreItem()` - Store Service
- ✅ `deleteStoreItem()` - Store Service
- ✅ `updateClanRole()` - Clan Service

### **3. Error Handling**
- ✅ `deleteFeedback()` - Thêm error handling với P2025

### **4. Logic Issues**
- ✅ `getStats()` - Tính posts thật từ database thay vì hardcode

---

## 📋 **Chi tiết từng Service**

### **1. Album Service**

#### **Endpoints:**
- `GET /profile/:user_id/albums` - Lấy danh sách albums (với pagination)
- `POST /profile/:user_id/albums` - Tạo album mới
- `PATCH /profile/:user_id/albums/:album_id` - Cập nhật album
- `GET /profile/:user_id/albums/:album_id/photos` - Lấy photos trong album
- `POST /profile/:user_id/albums/:album_id/photos` - Thêm photo vào album
- `DELETE /profile/:user_id/albums/:album_id/photos/:photo_id` - Xóa photo

#### **Test Cases:**
1. **GET albums với pagination:**
   ```
   GET /profile/{user_id}/albums?page=1&limit=10
   ```
   - Response format: `{ error: false, code: 0, message: "Success", data: { items: [...], meta: {...} }, traceId: "..." }`

2. **Tạo album:**
   ```
   POST /profile/{user_id}/albums
   Body: { "title": "My Album", "imageUrl": "https://..." }
   ```

3. **Update album:**
   - Test với cả `title` và `imageUrl`
   - Test chỉ với `title`
   - Test chỉ với `imageUrl`
   - Test với ID không tồn tại → 404

---

### **2. Clan Service**

#### **Endpoints:**
- `GET /profile/:user_id/clans/all` - Lấy tất cả clans (với pagination)
- `GET /profile/:user_id/clans` - Lấy clans của user (với pagination)
- `POST /profile/:user_id/clans` - Tạo clan mới
- `POST /profile/:user_id/clans/:clan_id/join` - Tham gia clan
- `DELETE /profile/:user_id/clans/:clan_id/leave` - Rời clan
- `PATCH /profile/:user_id/clans/:clan_id/role` - Cập nhật role
- `GET /profile/:user_id/clans/info` - Thông tin clan của user

#### **Test Cases:**
1. **GET all clans với pagination:**
   ```
   GET /profile/{user_id}/clans/all?page=1&limit=20
   ```

2. **GET user clans với pagination:**
   ```
   GET /profile/{user_id}/clans?page=1&limit=10
   ```

3. **Update clan role:**
   - Test với `rank` hợp lệ
   - Test với ID không tồn tại → 404

---

### **3. Feedback Service**

#### **Endpoints:**
- `POST /profile/feedback` - Gửi feedback
- `GET /profile/feedback/:user_id` - Lấy feedbacks (với pagination)
- `PATCH /profile/feedback/:feedback_id` - Cập nhật feedback
- `DELETE /profile/feedback/:feedback_id` - Xóa feedback

#### **Test Cases:**
1. **GET feedbacks với pagination:**
   ```
   GET /profile/feedback/{user_id}?page=1&limit=20
   ```

2. **Update feedback:**
   - Test với ID hợp lệ
   - Test với ID không tồn tại → 404

3. **Delete feedback:**
   - Test với ID hợp lệ
   - Test với ID không tồn tại → 404 (đã có error handling)

---

### **4. Love Space Service**

#### **Endpoints:**
- `GET /profile/:user_id/love-space` - Lấy love space
- `POST /profile/:user_id/love-space` - Tạo love space
- `PATCH /profile/:user_id/love-space` - Cập nhật love space
- `DELETE /profile/:user_id/love-space` - Xóa love space

#### **Test Cases:**
1. **Update love space:**
   - Test với `bio` hợp lệ
   - Test với ID không tồn tại → 404

---

### **5. Post Service**

#### **Endpoints:**
- `GET /profile/:user_id/posts` - Lấy posts (với pagination) ⚠️ **Cần thêm endpoint này vào controller**
- `POST /profile/:user_id/posts` - Tạo post
- `PATCH /profile/:user_id/posts/:post_id` - Cập nhật post
- `DELETE /profile/:user_id/posts/:post_id` - Xóa post

#### **Test Cases:**
1. **GET posts với pagination:**
   ```
   GET /profile/{user_id}/posts?page=1&limit=20
   ```
   ⚠️ **Cần thêm endpoint này vào controller**

2. **Update post:**
   - Test với `content` hợp lệ
   - Test với ID không tồn tại → 404

3. **Delete post:**
   - Test với ID hợp lệ
   - Test với ID không tồn tại → 404

---

### **6. Referral Service**

#### **Endpoints:**
- `GET /profile/:user_id/referrals` - Lấy referrals (với pagination)
- `POST /profile/:user_id/referrals` - Thêm referral
- `DELETE /profile/:user_id/referrals/:referred_id` - Xóa referral

#### **Test Cases:**
1. **GET referrals với pagination:**
   ```
   GET /profile/{user_id}/referrals?page=1&limit=20
   ```

---

### **7. Store Service**

#### **Endpoints:**
- `GET /profile/:user_id/store` - Lấy store items (với pagination)
- `POST /profile/:user_id/store/items` - Thêm item
- `PATCH /profile/:user_id/store/items/:item_id` - Cập nhật item
- `DELETE /profile/:user_id/store/items/:item_id` - Xóa item

#### **Test Cases:**
1. **GET store với pagination:**
   ```
   GET /profile/{user_id}/store?page=1&limit=20
   ```

2. **Update store item:**
   - Test với cả `name` và `price`
   - Test chỉ với `name`
   - Test chỉ với `price`
   - Test với ID không tồn tại → 404

3. **Delete store item:**
   - Test với ID hợp lệ
   - Test với ID không tồn tại → 404

---

### **8. Support Service**

#### **Endpoints:**
- `GET /profile/:user_id/support/company` - Lấy company info
- `GET /profile/:user_id/support/info` - Lấy support info
- `GET /profile/:user_id/support/articles` - Lấy help articles (với pagination)

#### **Test Cases:**
1. **GET help articles với pagination:**
   ```
   GET /profile/{user_id}/support/articles?page=1&limit=20
   ```

---

### **9. Task Service**

#### **Endpoints:**
- `GET /profile/:user_id/tasks/summary` - Lấy tasks (với pagination)
- `POST /profile/:user_id/tasks` - Tạo task
- `PATCH /profile/:user_id/tasks/:task_id` - Cập nhật task
- `DELETE /profile/:user_id/tasks/:task_id` - Xóa task

#### **Test Cases:**
1. **GET tasks với pagination:**
   ```
   GET /profile/{user_id}/tasks/summary?page=1&limit=20
   ```

---

### **10. User Profile Service**

#### **Endpoints:**
- `GET /profile/:user_id` - Lấy profile
- `PATCH /profile/:user_id` - Cập nhật profile
- `DELETE /profile/:user_id` - Xóa profile
- `GET /profile/:user_id/stats` - Lấy stats (đã sửa tính posts thật)
- `GET /profile/:user_id/room-status` - Lấy room status

#### **Test Cases:**
1. **GET stats:**
   ```
   GET /profile/{user_id}/stats
   ```
   - Response: `{ posts: <số thật>, followers: <số thật>, following: <số thật>, totalViews: <random> }`

---

### **11. Vip Service**

#### **Endpoints:**
- `GET /profile/:user_id/vip` - Lấy VIP status
- `POST /profile/:user_id/vip` - Tạo VIP status
- `PATCH /profile/:user_id/vip` - Cập nhật VIP status
- `DELETE /profile/:user_id/vip` - Xóa VIP status

#### **Test Cases:**
1. **Update VIP status:**
   - Test với cả `is_vip` và `expiry`
   - Test chỉ với `is_vip`
   - Test chỉ với `expiry`
   - Test với date không hợp lệ → 400

---

### **12. Wallet Service**

#### **Endpoints:**
- `GET /profile/:user_id/wallet` - Lấy wallet
- `POST /profile/:user_id/wallet` - Tạo wallet
- `PATCH /profile/:user_id/wallet` - Cập nhật wallet
- `DELETE /profile/:user_id/wallet` - Xóa wallet

#### **Test Cases:**
1. **Update wallet:**
   - Test với cả `balance` và `currency`
   - Test chỉ với `balance`
   - Test chỉ với `currency`

---

## ⚠️ **Lưu ý quan trọng**

### **1. Controllers cần cập nhật:**
Một số controllers cần cập nhật để truyền `query` params vào services:
- `PostController` - Cần thêm endpoint `GET /profile/:user_id/posts` với query params
- `FeedbackController` - Cần cập nhật `getFeedback()` để truyền query
- `ReferralController` - Cần cập nhật `getReferrals()` để truyền query
- `SupportController` - Cần cập nhật `getHelpArticles()` để truyền query
- `AlbumController` - Cần cập nhật `getAlbums()` để truyền query
- `ClanController` - Cần cập nhật `getAllClans()` và `getClans()` để truyền query
- `StoreController` - Cần cập nhật `getStore()` để truyền query
- `TaskController` - Cần cập nhật `getTaskSummary()` để truyền query

### **2. Response Format:**
Tất cả endpoints pagination trả về format chuẩn:
```json
{
  "error": false,
  "code": 0,
  "message": "Success",
  "data": {
    "items": [...],
    "meta": {
      "item_count": 10,
      "total_items": 100,
      "items_per_page": 20,
      "total_pages": 5,
      "current_page": 1
    }
  },
  "traceId": "..."
}
```

### **3. Error Handling:**
Tất cả update/delete methods đã có error handling với P2025 (record not found)

---

## ✅ **Checklist Test**

- [ ] Test pagination cho tất cả list endpoints
- [ ] Test update methods với ID hợp lệ
- [ ] Test update methods với ID không tồn tại → 404
- [ ] Test delete methods với ID hợp lệ
- [ ] Test delete methods với ID không tồn tại → 404
- [ ] Test getStats() - verify posts count là số thật
- [ ] Test các controllers đã cập nhật query params

---

## 🎯 **Kết luận**

Tất cả services đã được:
- ✅ Thêm pagination cho list endpoints
- ✅ Optimize update/delete methods
- ✅ Thêm error handling
- ✅ Sửa logic issues

**Cần cập nhật controllers để truyền query params!** ⚠️

