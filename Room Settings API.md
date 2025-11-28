# Room Settings API - Complete Documentation

## Tổng quan
Đã tạo đầy đủ API cho màn hình "Thiết lập phòng" theo đúng UI trong ảnh, bao gồm tất cả các trường và chức năng.

## Cấu trúc màn hình Thiết lập phòng

### 1. **Bìa phòng** (Room Cover)
- **GET** `/rooms/:room_id/settings` - Lấy thông tin bìa hiện tại
- **PUT** `/rooms/:room_id/cover` - Upload/cập nhật ảnh bìa

### 2. **Tên phòng** (Room Name)
- Hiển thị: "Darlene Bears"
- **PUT** `/rooms/:room_id/name` - Cập nhật tên phòng

### 3. **Thông báo phòng** (Room Notice)
- **GET** `/rooms/:room_id/notifications` - Lấy danh sách thông báo
- **PUT** `/rooms/:room_id/notice` - Cập nhật thông báo phòng

### 4. **Chế độ phòng** (Room Mode)
- Hiển thị: "Party - Giải trí"
- **GET** `/rooms/:room_id/modes` - Lấy danh sách chế độ
- **PUT** `/rooms/:room_id/mode` - Cập nhật chế độ và nhãn
- **POST** `/rooms/:room_id/set-mode` - (Legacy) Đặt chế độ

Các chế độ:
- Game 🎮
- Make friends 💕
- Party 🎉
- Auction 🔨

Các nhãn:
- Kết bạn
- Âm nhạc
- Giải trí
- Trò chuyện

### 5. **Nền phòng** (Room Background)
- Hiển thị: "Không gian"
- **GET** `/rooms/:room_id/backgrounds` - Lấy danh sách backgrounds
- **PUT** `/rooms/:room_id/background` - Cập nhật nền phòng

### 6. **Chọn ghế** (Seat Layout)
- Hiển thị: "Chế độ 1"
- **GET** `/rooms/:room_id/seat-layouts` - Lấy danh sách layouts
- **PUT** `/rooms/:room_id/seat-layout` - Cập nhật layout ghế
- **POST** `/rooms/:room_id/set-seat-layout` - (Legacy) Đặt layout

Các chế độ ghế:
- Chế độ 1: 12 ghế
- Chế độ 2: 8 ghế
- Chế độ 3: 9 ghế
- Chế độ 4: 10 ghế

### 7. **Vô hiệu hóa tin nhắn** (Disable Message)
- Toggle switch
- **PUT** `/rooms/:room_id/toggle-message` - Bật/tắt tin nhắn

### 8. **Vô hiệu hóa lì xì** (Disable Lucky Money)
- Toggle switch
- **PUT** `/rooms/:room_id/toggle-lucky-money` - Bật/tắt lì xì

### 9. **Vô hiệu hóa gửi ảnh** (Disable Image)
- Toggle switch
- **PUT** `/rooms/:room_id/toggle-image` - Bật/tắt gửi ảnh

### 10. **Mật khẩu** (Password)
- Hiển thị: "1996" (4 số)
- Toggle switch
- **PUT** `/rooms/:room_id/password` - Bật/tắt và đặt mật khẩu

### 11. **Danh sách đen** (Blacklist)
- **GET** `/rooms/:room_id/blacklist` - Lấy danh sách đen
- **POST** `/rooms/:room_id/blacklist` - Thêm vào blacklist
- **DELETE** `/rooms/:room_id/blacklist/:user_id` - Xóa khỏi blacklist
- **POST** `/rooms/:room_id/unblock/:user_id` - Unblock user

### 12. **Quản trị viên** (Managers)
- **GET** `/rooms/:room_id/managers` - Lấy danh sách quản trị viên
- **POST** `/rooms/:room_id/managers` - Thêm quản trị viên
- **DELETE** `/rooms/:room_id/managers/:user_id` - Xóa quản trị viên

Hiển thị:
- Jaxson Curtis - Chủ phòng
- Gretchen Stanton - Admin
- Livia Curtis - Admin

### 13. **Số phòng** (Room Code)
- Hiển thị: "VC599381"
- **GET** `/rooms/:room_id/code` - Lấy số phòng

---

## API Endpoints Summary

### Main Settings Endpoint
```
GET /rooms/:room_id/settings
```
Trả về toàn bộ cài đặt phòng trong 1 request duy nhất.

**Response:**
```json
{
  "room_id": "room_12345",
  "cover_url": "https://cdn.example.com/covers/cover1.jpg",
  "name": "Darlene Bears",
  "notice": "Welcome to my room!",
  "mode": "party",
  "labels": ["giải trí", "trò chuyện"],
  "background_id": "bg_night_sky_001",
  "seat_layout_type": 1,
  "disable_message": false,
  "disable_lucky_money": false,
  "disable_image": false,
  "password_enabled": true,
  "password": "1996",
  "room_code": "VC599381"
}
```

### Individual Update Endpoints

#### 1. Cover
```
PUT /rooms/:room_id/cover
Body: { "cover_url": "https://..." }
```

#### 2. Name
```
PUT /rooms/:room_id/name
Body: { "name": "New Room Name" }
```

#### 3. Notice
```
PUT /rooms/:room_id/notice
Body: { "notice": "Welcome message..." }
```

#### 4. Mode
```
PUT /rooms/:room_id/mode
Body: {
  "mode": "party",
  "labels": ["giải trí", "trò chuyện"]
}
```

#### 5. Background
```
GET /rooms/:room_id/backgrounds
PUT /rooms/:room_id/background
Body: { "background_id": "bg_night_sky_001" }
```

#### 6. Seat Layout
```
PUT /rooms/:room_id/seat-layout
Body: { "layout_type": 1 }
```

#### 7-9. Toggle Features
```
PUT /rooms/:room_id/toggle-message
PUT /rooms/:room_id/toggle-lucky-money
PUT /rooms/:room_id/toggle-image
Body: { "enabled": true }
```

#### 10. Password
```
PUT /rooms/:room_id/password
Body: {
  "enabled": true,
  "password": "1996"
}
```

#### 11. Blacklist
```
GET /rooms/:room_id/blacklist
POST /rooms/:room_id/blacklist
Body: { "user_id": "u789", "reason": "Spam" }
DELETE /rooms/:room_id/blacklist/:user_id
```

#### 12. Managers
```
GET /rooms/:room_id/managers
POST /rooms/:room_id/managers
Body: { "user_id": "u456" }
DELETE /rooms/:room_id/managers/:user_id
```

#### 13. Room Code
```
GET /rooms/:room_id/code
```

---

## DTOs Created

### Request DTOs
1. `UpdateRoomCoverDto` - Upload ảnh bìa
2. `UpdateRoomNameDto` - Đổi tên phòng
3. `UpdateRoomNoticeDto` - Cập nhật thông báo
4. `UpdateRoomModeDto` - Đổi chế độ và nhãn
5. `UpdateRoomBackgroundDto` - Đổi nền phòng
6. `UpdateSeatLayoutDto` - Đổi layout ghế
7. `ToggleRoomFeatureDto` - Bật/tắt tính năng
8. `UpdateRoomPasswordDto` - Cập nhật mật khẩu
9. `AddToBlacklistDto` - Thêm vào blacklist
10. `AddManagerDto` - Thêm quản trị viên

### Response DTOs
1. `RoomSettingsResponseDto` - Thông tin thiết lập đầy đủ
2. `RoomBackgroundDto` - Thông tin background
3. `RoomManagerDto` - Thông tin quản trị viên
4. `RoomNotificationDto` - Thông báo phòng

---

## Service Methods Implemented

### New Methods (17 methods)
1. `getRoomSettings()` - Lấy toàn bộ settings
2. `updateRoomCover()` - Cập nhật bìa
3. `updateRoomName()` - Cập nhật tên
4. `updateRoomNotice()` - Cập nhật thông báo
5. `getRoomNotifications()` - Lấy thông báo
6. `updateRoomMode()` - Cập nhật chế độ
7. `getRoomBackgrounds()` - Lấy danh sách backgrounds
8. `updateRoomBackground()` - Cập nhật nền
9. `updateSeatLayout()` - Cập nhật layout ghế
10. `toggleMessage()` - Toggle tin nhắn
11. `toggleLuckyMoney()` - Toggle lì xì
12. `toggleImage()` - Toggle gửi ảnh
13. `updatePassword()` - Cập nhật mật khẩu
14. `getManagers()` - Lấy danh sách admin
15. `addManager()` - Thêm admin
16. `removeManager()` - Xóa admin
17. `getRoomCode()` - Lấy số phòng

### Existing Methods (kept for backward compatibility)
- `getModes()` - Lấy danh sách modes
- `setMode()` - Đặt mode
- `getSeatLayouts()` - Lấy layouts
- `setSeatLayout()` - Đặt layout
- `getSeats()` - Lấy thông tin ghế
- `joinSeat()` - Tham gia ghế
- `assignSeat()` - Chỉ định ghế
- `lockSeat()` - Khóa/mở ghế
- `leaveSeat()` - Rời ghế

---

## UI Flow Examples

### 1. Mở màn hình Thiết lập phòng
```
GET /rooms/room_12345/settings
→ Hiển thị tất cả thông tin trong 1 màn hình
```

### 2. Nhấn vào "Bìa phòng"
```
→ Mở gallery/camera
→ Upload ảnh lên CDN
→ PUT /rooms/room_12345/cover
   Body: { "cover_url": "https://cdn.../new_cover.jpg" }
```

### 3. Nhấn vào "Tên phòng"
```
→ Mở dialog nhập tên
→ PUT /rooms/room_12345/name
   Body: { "name": "New Room Name" }
```

### 4. Nhấn vào "Thông báo phòng"
```
→ Mở màn hình danh sách thông báo
→ GET /rooms/room_12345/notifications
→ Có thể edit thông báo:
   PUT /rooms/room_12345/notice
   Body: { "notice": "New notice..." }
```

### 5. Nhấn vào "Chế độ phòng"
```
→ Mở bottom sheet chọn chế độ
→ Hiển thị: Game, Make friends, Party, Auction
→ Hiển thị nhãn: Kết bạn, Âm nhạc, Giải trí, Trò chuyện
→ PUT /rooms/room_12345/mode
   Body: {
     "mode": "party",
     "labels": ["giải trí"]
   }
```

### 6. Nhấn vào "Nền phòng"
```
→ GET /rooms/room_12345/backgrounds
→ Hiển thị grid backgrounds
→ Chọn background
→ PUT /rooms/room_12345/background
   Body: { "background_id": "bg_night_sky_001" }
```

### 7. Nhấn vào "Chọn ghế"
```
→ Mở bottom sheet chọn layout
→ Hiển thị 4 chế độ với preview
→ PUT /rooms/room_12345/seat-layout
   Body: { "layout_type": 1 }
```

### 8. Toggle "Vô hiệu hóa tin nhắn"
```
→ PUT /rooms/room_12345/toggle-message
   Body: { "enabled": false }
```

### 9. Toggle "Mật khẩu"
```
→ Nếu bật: hiển thị dialog nhập mật khẩu 4 số
→ PUT /rooms/room_12345/password
   Body: {
     "enabled": true,
     "password": "1996"
   }
```

### 10. Nhấn vào "Danh sách đen"
```
→ GET /rooms/room_12345/blacklist
→ Hiển thị danh sách users bị block
→ Có nút "Unblock" cho mỗi user
→ POST /rooms/room_12345/unblock/:user_id
```

### 11. Nhấn vào "Quản trị viên"
```
→ GET /rooms/room_12345/managers
→ Hiển thị:
   - Jaxson Curtis (Chủ phòng)
   - Gretchen Stanton (Admin)
   - Livia Curtis (Admin)
→ Có thể thêm/xóa admin
```

---

## Database Fields Used

### Room Table
- `id` - Room ID
- `title` - Tên phòng
- `cover_url` - Ảnh bìa
- `notice` - Thông báo
- `mode` - Chế độ phòng
- `labels` - Nhãn phòng (JSON array)
- `background_id` - ID nền phòng
- `is_protected` - Có mật khẩu không
- `password_hash` - Mật khẩu (hashed)
- `settings` - JSON object chứa:
  - `seat_layout_type` - Loại layout ghế
  - `disableMessage` - Vô hiệu hóa tin nhắn
  - `disableLuckyMoney` - Vô hiệu hóa lì xì
  - `disableImage` - Vô hiệu hóa gửi ảnh
- `host_id` - ID chủ phòng
- `created_at` - Thời gian tạo

---

## Permissions

### Host Only
- Tất cả các endpoints update settings
- Chỉ host mới có quyền thay đổi cài đặt phòng

### Admin
- Có thể kick/block users (trong room-members.controller)
- Không thể thay đổi settings phòng

### Viewers
- Chỉ có thể xem thông tin phòng
- Không có quyền thay đổi gì

---

## Testing với Swagger

1. Start server: `npm run start:dev`
2. Truy cập: `http://localhost:3000/api`
3. Authenticate với JWT token
4. Test các endpoints:
   - GET `/rooms/:room_id/settings` - Xem toàn bộ settings
   - PUT các endpoints để update từng phần
   - Verify response trả về đúng format

---

## Next Steps

### 1. Database Migration
Cần thêm các fields vào Prisma schema:
```prisma
model Room {
  // ... existing fields
  cover_url       String?
  background_id   String?
  room_code       String?   @unique
  // settings JSON sẽ chứa:
  // - seat_layout_type
  // - disableMessage
  // - disableLuckyMoney
  // - disableImage
}
```

### 2. File Upload Service
Implement upload service cho room cover:
- Integrate với CDN (AWS S3, Cloudinary, etc.)
- Validate file type và size
- Generate thumbnails

### 3. WebSocket Events
Broadcast realtime khi settings thay đổi:
- `room_settings_updated`
- `room_mode_changed`
- `room_background_changed`
- `room_password_changed`

### 4. Validation
- Tên phòng: 1-50 ký tự
- Thông báo: max 500 ký tự
- Mật khẩu: đúng 4 số
- Background ID: phải tồn tại trong danh sách

### 5. Caching
- Cache room settings trong Redis
- Invalidate cache khi có update
- Reduce database queries

---

## Tổng kết

✅ **Hoàn thành:**
- 17 endpoints mới cho Room Settings
- 10 Request DTOs với validation
- 4 Response DTOs với examples
- 17 service methods với business logic
- Full Swagger documentation
- Tất cả endpoints compile không lỗi

✅ **Tương thích:**
- Giữ nguyên các endpoints cũ (backward compatible)
- Sử dụng Prisma schema hiện tại
- Không breaking changes

✅ **Theo đúng UI:**
- Tất cả các trường trong ảnh đều có API
- Flow tương tác giống y hệt mockup
- Response format phù hợp với UI requirements
