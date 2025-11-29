# MOCK API ROOM - CHÍNH XÁC THEO TÀI LIỆU

## 📋 MỤC LỤC

1. [Bảng Mockup API Room](#1-bảng-mockup-api-room)
2. [Bảng Mockup API Create & Enter Chat Room](#2-bảng-mockup-api-create--enter-chat-room)
3. [Mock Response - Tạo phòng & Join](#3-mock-response---tạo-phòng--join)
4. [Mock API Setting Room - Room Mode](#4-mock-api-setting-room---room-mode)
5. [Mock API Setting Room - Chức năng phòng](#5-mock-api-setting-room---chức-năng-phòng)
6. [Mock API Setting Room - Quản lý Micro & Slot](#6-mock-api-setting-room---quản-lý-micro--slot)
7. [Mock API Setting Room - Hiệu ứng Room](#7-mock-api-setting-room---hiệu-ứng-room)
8. [Mock API Setting Room - Hệ thống & Thông báo](#8-mock-api-setting-room---hệ-thống--thông-báo)
9. [Mock API Setting Room - Âm thanh quà tặng](#9-mock-api-setting-room---âm-thanh-quà-tặng)
10. [Mock API Setting Room - Báo cáo phòng](#10-mock-api-setting-room---báo-cáo-phòng)
11. [Mock API Setting Room - Thoát phòng](#11-mock-api-setting-room---thoát-phòng)
12. [Mock API Setting Room - Chế độ phòng](#12-mock-api-setting-room---chế-độ-phòng)
13. [Mock API Đẩy phòng (Boost)](#13-mock-api-đẩy-phòng-boost)
14. [Mock API Thiết lập phòng](#14-mock-api-thiết-lập-phòng)
15. [Mock API Chat Room](#15-mock-api-chat-room)
16. [Mock API Chọn chế độ phòng & ghế](#16-mock-api-chọn-chế-độ-phòng--ghế)
17. [Mock API Mời bạn bè](#17-mock-api-mời-bạn-bè)
18. [Mock API Thử thách phòng](#18-mock-api-thử-thách-phòng)
19. [Mock API Top người tặng quà](#19-mock-api-top-người-tặng-quà)
20. [Mock API Số lượng người xem](#20-mock-api-số-lượng-người-xem)

---

## 1. BẢNG MOCKUP API ROOM

| Component (UI) | Type (Backend) | API | Notes (Backend) |
|----------------|----------------|-----|-----------------|
| Banner livestream | Resource | GET /ads?position=room_banner | Trả về banner + link sự kiện |
| Tabs: Follow / Friends / Game / Auction | Filter params | Không cần API riêng | Giao diện gọi API /rooms với query tương ứng |
| Danh sách phòng – Follow tab | Collection | GET /rooms?tab=follow | Lọc theo danh sách idol mà user follow |
| Danh sách phòng – Friends tab | Collection | GET /rooms?tab=friends | Lọc theo phòng bạn bè đang xem hoặc đang live |
| Danh sách theo Category (Game, Make Friends, Party, Auction) | Collection (filtered) | GET /rooms?category={name} | Backend xử lý filter theo category |
| Search icon | Search | GET /search?keyword= | Tìm phòng + user |
| Item Room | Object | Nằm trong API list room | Bao gồm: room_id, host, thumbnail, viewer_count, status… |
| Status (Live / Offline) | Field | Nằm trong room object (status) | Enum: live, offline |
| Viewer Avatars | Array | Trong room object → joined_viewers | Giới hạn 10 người mới nhất |
| Nút Join Room | Action | POST /rooms/{roomId}/join | Trả về URL + token để join livestream |
| Chi tiết phòng | Resource | GET /rooms/{roomId} | Thông tin chi tiết phòng livestream |
| Tạo phòng livestream | Action (Host) | POST /rooms | Tạo room mới – trả về stream key + RTMP |
| Danh sách Category | Resource | GET /rooms/categories | Trả danh sách cố định: game, party… |
| Friends đang xem (optional) | Resource | GET /friends/activity | Danh sách bạn bè hiện đang xem room |
| User avatar góc dưới | Resource | GET /me | Trả thông tin user hiện tại |

---

## 2. BẢNG MOCKUP API CREATE & ENTER CHAT ROOM

| Component (UI) | Type (Backend) | API | Notes (Backend) |
|----------------|----------------|-----|-----------------|
| Nhập tên phòng (title) | Field | POST /rooms → title | Bắt buộc |
| Toggle Room Password | Boolean | POST /rooms → is_protected | true = cần đặt password |
| Mode (Game / Make friends / Party / Auction) | Enum | POST /rooms → mode | Enum: "game", "make_friends", "party", "auction" |
| Labels (Kết bạn / Âm nhạc / Giải trí / Trò chuyện) | Array<string> | POST /rooms → labels | Optional |
| Create Room Button | Action | POST /rooms | Tạo room mới |
| Nhập mật khẩu 4 số | Field | POST /rooms/{roomId}/password | Lưu hashed password |
| Nút Save Password | Action | POST /rooms/{roomId}/password | Sau khi lưu → phòng được active |
| UI phòng chat live | Page | GET /rooms/{roomId} | Lấy thông tin phòng |
| Danh sách slots người tham gia (Join the…) | Array | GET /rooms/{roomId}/members | 12 slot, trong đó host luôn ở slot đầu |
| Chat messages (system + user) | Collection | GET /rooms/{roomId}/messages | Tin hệ thống (welcome + thông báo chất lượng) |
| Gửi tin nhắn | Action | POST /rooms/{roomId}/messages | Text, sticker, image… |
| Thông tin host (avatar, name, id) | Object | GET /rooms/{roomId} | Trả về trong host |
| Nút leave room | Action | POST /rooms/{roomId}/leave | User rời room |
| Nút mời bạn bè | Action | Không yêu cầu API | Frontend điều hướng |
| Icon setting của host | Page | GET /rooms/{id}/settings | BE trả config |
| Hệ thống gửi thông báo | Auto Message | BE tạo message type system | Lưu vào DB và broadcast |

---


## 3. MOCK RESPONSE - TẠO PHÒNG & JOIN

### 3.1. Tạo phòng
**POST /rooms**

Request:
```json
{
  "title": "From Hani With Love",
  "mode": "party",
  "labels": ["giải trí", "trò chuyện"],
  "is_protected": true
}
```

Response:
```json
{
  "room_id": "r987",
  "title": "From Hani With Love",
  "mode": "party",
  "labels": ["giải trí", "trò chuyện"],
  "is_protected": true,
  "password_set": false,
  "status": "created",
  "host": {
    "id": "u123",
    "name": "Darlene Bears",
    "avatar": "https://cdn/avatar.png"
  }
}
```

### 3.2. Lưu mật khẩu phòng
**POST /rooms/{roomId}/password**

Request:
```json
{
  "password": "7777"
}
```

Response:
```json
{
  "room_id": "r987",
  "is_protected": true,
  "password_set": true,
  "status": "active"
}
```

### 3.3. Lấy thông tin phòng
**GET /rooms/{roomId}**

Response:
```json
{
  "room_id": "r987",
  "title": "From Hani With Love",
  "mode": "party",
  "labels": ["giải trí", "trò chuyện"],
  "is_protected": true,
  "host": {
    "id": "u123",
    "name": "Darlene Bears",
    "avatar": "https://cdn/avatar.png",
    "badges": ["verified", "idol"]
  },
  "members_count": 1,
  "slots": [
    {
      "slot": 1,
      "user": {
        "id": "u123",
        "name": "Darlene Bears",
        "avatar": "https://cdn/avatar.png"
      }
    },
    { "slot": 2, "user": null },
    { "slot": 3, "user": null }
  ]
}
```

### 3.4. Lấy tin nhắn (bao gồm system)
**GET /rooms/{id}/messages**

Response:
```json
[
  {
    "id": "m1",
    "type": "system",
    "text": "Welcome to Darlene Bears' live streaming room!",
    "created_at": "2025-01-01T10:00:00Z"
  },
  {
    "id": "m2",
    "type": "system",
    "text": "This room is high quality. The sound quality has been improved...",
    "created_at": "2025-01-01T10:00:02Z"
  }
]
```

### 3.5. Join room
**POST /rooms/{roomId}/join**

Request:
```json
{
  "password": "7777"
}
```

Response:
```json
{
  "room_id": "r987",
  "join_status": "success",
  "slot_assigned": 3,
  "stream_token": "abc123"
}
```

---

## 4. MOCK API SETTING ROOM - ROOM MODE

| Component (UI) | Type (Backend) | API | Notes |
|----------------|----------------|-----|-------|
| Danh sách chế độ phòng | Array<RoomMode> | GET /rooms/{room_id}/modes | Trả về các mode: party, music, chat, game, dating, relax… |
| Chọn chế độ "Party / Kết bạn / Trò chuyện / Game" | Action | POST /rooms/{room_id}/set-mode | Body: { mode: "party" }. Backend broadcast WebSocket → đổi UI cho tất cả user. |
| Lưu trạng thái mode | Event | WS | Gửi event room_mode_changed. |

---

## 5. MOCK API SETTING ROOM - CHỨC NĂNG PHÒNG

| Component (UI) | Type | API | Notes |
|----------------|------|-----|-------|
| Music Mode (Âm nhạc) | Action | POST /rooms/{room_id}/music/toggle | Bật/tắt chế độ âm nhạc. |
| AI Chatbot Mode | Action | POST /rooms/{room_id}/ai-mode/toggle | Bật chế độ Chat AI trong room. |
| Trò chuyện (Voice/Chat Mode) | Action | POST /rooms/{room_id}/chat-mode | Chọn kiểu chat: voice-only, text-only, mix. |
| Kết bạn (Friend Mode) | Action | POST /rooms/{room_id}/friend-mode | Chỉ mở tính năng kết bạn trong room. |
| Game Mode (Mini games) | Action | GET /rooms/{room_id}/games | List game và trạng thái game. |
| Chọn game | Action | POST /rooms/{room_id}/games/start | Start game trong room. |

---

## 6. MOCK API SETTING ROOM - QUẢN LÝ MICRO & SLOT

| Component (UI) | Type | API | Notes |
|----------------|------|-----|-------|
| Danh sách ghế / vị trí micro | Array<Seat> | GET /rooms/{room_id}/seats | { seat_id, user, locked: true/false }. |
| User bấm "Join the mic" | Action | POST /rooms/{room_id}/seats/join | Backend kiểm tra ghế trống. |
| Host kéo user vào ghế | Action | POST /rooms/{room_id}/seats/assign | { seat_id, user_id }. |
| Host khóa ghế | Action | POST /rooms/{room_id}/seats/{seat_id}/lock | Ghế bị khóa không ai join. |
| Host mở ghế | Action | DELETE /rooms/{room_id}/seats/{seat_id}/lock | — |
| User rời ghế | Action | POST /rooms/{room_id}/seats/leave | — |
| Mic On/Off | Action | POST /rooms/{room_id}/mic-toggle | { mic: true/false }. |

---

## 7. MOCK API SETTING ROOM - HIỆU ỨNG ROOM

| Component | Type | API | Notes |
|-----------|------|-----|-------|
| Đổi background phòng | Setting | POST /rooms/{room_id}/background | Body: { bg_id }. |
| Hiệu ứng icon (spark, heart, aura) | Event | POST /rooms/{room_id}/effects | Trigger animation cho room. |
| Thay đổi theme UI (Dark/Light/Party) | Setting | POST /rooms/{room_id}/theme | — |

---

## 8. MOCK API SETTING ROOM - HỆ THỐNG & THÔNG BÁO

| Component | Type | API | Notes |
|-----------|------|-----|-------|
| Tin nhắn hệ thống (khung xám trong ảnh) | Message<System> | GET /rooms/{room_id}/system-messages | Hiển thị cảnh báo, nội quy. |
| Gửi System Message | Admin Action | POST /rooms/{room_id}/system-messages | — |
| Cảnh báo tự động | Auto event | WS | Bot gửi thông báo khi có người join, leave, vi phạm. |

---

## 9. MOCK API SETTING ROOM - ÂM THANH QUÀ TẶNG

| Component | Type | API | Notes |
|-----------|------|-----|-------|
| Lấy danh sách âm thanh | GET | /rooms/{room_id}/gift-sounds | Danh sách nhạc/hiệu ứng |
| Phát âm thanh quà tặng | POST | /rooms/{room_id}/gift-sounds/play | Trigger âm thanh tới room |
| Lưu lịch sử âm thanh | GET | /rooms/{room_id}/gift-sounds/history | Optional |

Mock Response – GET gift sounds:
```json
{
  "sounds": [
    { "id": "s01", "name": "Applause", "file": "/sound/applause.mp3" },
    { "id": "s02", "name": "Magic Spark", "file": "/sound/magic.mp3" }
  ]
}
```

---

## 10. MOCK API SETTING ROOM - BÁO CÁO PHÒNG

| Component | Type | API | Notes |
|-----------|------|-----|-------|
| Gửi báo cáo phòng | POST | /rooms/{room_id}/report | User báo cáo nội dung phòng |
| Lấy danh mục báo cáo | GET | /report/categories | NSFW, spam, toxic, lừa đảo… |

Body gửi report:
```json
{
  "reason_id": "nsfw",
  "details": "Phòng có nội dung không phù hợp"
}
```

---

## 11. MOCK API SETTING ROOM - THOÁT PHÒNG

| Component | Type | API | Notes |
|-----------|------|-----|-------|
| User thoát phòng | POST | /rooms/{room_id}/leave | Xóa khỏi danh sách online |
| Host kết thúc phòng | POST | /rooms/{room_id}/close | Chỉ host |

Mock Response – leave:
```json
{
  "message": "left_room",
  "room_id": "123",
  "user_id": "u01"
}
```

---

## 12. MOCK API SETTING ROOM - CHẾ ĐỘ PHÒNG

| Component | Type | API | Notes |
|-----------|------|-----|-------|
| Lấy danh sách chế độ phòng | GET | /rooms/{room_id}/modes | Party / Friend / Chat / Game |
| Chọn chế độ | POST | /rooms/{room_id}/set-mode | { mode: "party" } |
| Realtime thay đổi mode | WS | room_mode_changed | Push về tất cả user |

Mock Response – modes:
```json
{
  "current_mode": "party",
  "available_modes": ["party", "friend", "chat", "game"]
}
```

---


## 13. MOCK API ĐẨY PHÒNG (BOOST)

### 13.1. Bảng tổng hợp API Đẩy phòng

| Component (UI) | Type | API | Notes |
|----------------|------|-----|-------|
| Tab "Cao cấp" – List thẻ | GET | /rooms/{id}/boost/items | List thẻ người dùng đang có |
| Tab "Siêu cấp" – List gói | GET | /rooms/{id}/boost/super-packages | Mua bằng xu/kim cương |
| Sử dụng 1 thẻ (Cao cấp) | POST | /rooms/{id}/boost/use-item | Giảm quantity – kích hoạt boost |
| Mua boost (Siêu cấp) | POST | /rooms/{id}/boost/purchase | Thanh toán + bật boost |
| Lịch sử nhận thẻ | GET | /rooms/{id}/boost/rewards | Optional |
| Realtime Boost Started | WS | room_boost_started | Push sự kiện vào room |
| Realtime Boost Ended | WS | room_boost_ended | Khi hết thời gian |

### 13.2. GET danh sách thẻ đẩy phòng (Cao cấp)
**GET /rooms/{room_id}/boost/items**

Response:
```json
{
  "room_id": "123",
  "items": [
    {
      "id": "boost_warmup_4",
      "name": "Làm nóng 4 phút",
      "duration_minutes": 4,
      "icon": "/icons/fire.png",
      "quantity": 2,
      "expire_at": "2025-01-16T00:00:00Z"
    },
    {
      "id": "boost_warmup_10",
      "name": "Làm nóng 10 phút",
      "duration_minutes": 10,
      "icon": "/icons/fire_big.png",
      "quantity": 1,
      "expire_at": "2025-02-01T00:00:00Z"
    }
  ]
}
```

### 13.3. GET danh sách gói BOOST Siêu cấp
**GET /rooms/{room_id}/boost/super-packages**

Response:
```json
{
  "packages": [
    {
      "id": "super_5",
      "name": "Tăng tốc 5 phút",
      "duration_minutes": 5,
      "price": 20,
      "currency": "coin"
    },
    {
      "id": "super_15",
      "name": "Tăng tốc 15 phút",
      "duration_minutes": 15,
      "price": 45,
      "currency": "coin"
    },
    {
      "id": "super_30",
      "name": "Tăng tốc 30 phút",
      "duration_minutes": 30,
      "price": 80,
      "currency": "coin"
    }
  ]
}
```

### 13.4. POST sử dụng 1 thẻ booster (Cao cấp)
**POST /rooms/{room_id}/boost/use-item**

Request:
```json
{
  "item_id": "boost_warmup_4"
}
```

Response:
```json
{
  "room_id": "123",
  "item_id": "boost_warmup_4",
  "duration_minutes": 4,
  "status": "activated",
  "boost_end_at": "2025-01-16T00:04:00Z"
}
```

### 13.5. POST mua gói boost (Siêu cấp)
**POST /rooms/{room_id}/boost/purchase**

Request:
```json
{
  "package_id": "super_15"
}
```

Response:
```json
{
  "room_id": "123",
  "package_id": "super_15",
  "duration_minutes": 15,
  "payment": {
    "total": 45,
    "currency": "coin"
  },
  "status": "activated",
  "boost_end_at": "2025-01-16T00:15:00Z"
}
```

### 13.6. Lịch sử nhận thẻ hàng ngày
**GET /rooms/{room_id}/boost/rewards**

Response:
```json
{
  "daily_rewards": [
    {
      "id": "boost_warmup_4",
      "received_at": "2025-01-15T00:00:00Z"
    }
  ]
}
```

### 13.7. Mock UI state khi nhấn "Sử dụng 1 thẻ"
```json
{
  "boosting": true,
  "remaining_seconds": 240
}
```

---

## 14. MOCK API THIẾT LẬP PHÒNG

| Component | Type | API Endpoint | Notes |
|-----------|------|--------------|-------|
| Bìa phòng (Room Cover) | POST (upload) | /room/{roomId}/cover | Upload / cập nhật ảnh bìa phòng |
| Lấy bìa phòng | GET | /room/{roomId}/cover | Lấy ảnh bìa hiện tại |
| Tên phòng (Room Name) | PATCH | /room/{roomId} | Body: { name: string } |
| Thông báo phòng (Room Notice) | PATCH | /room/{roomId} | Body: { notice: string } |
| Lấy thông tin phòng | GET | /room/{roomId} | Trả về toàn bộ thông tin phòng |
| Chế độ phòng (Room Mode) | PATCH | /room/{roomId}/mode | Body: { mode: "party" } |
| Nền phòng (Room Background) | PATCH | /room/{roomId}/background | Body: { backgroundId: number } |
| Chọn ghế (Seat Mode) | PATCH | /room/{roomId}/seat-mode | Body: { type: 1 } |
| Vô hiệu hóa tin nhắn | PATCH | /room/{roomId}/settings | Body: { disableMessage: boolean } |
| Vô hiệu hóa lì xì | PATCH | /room/{roomId}/settings | Body: { disableLuckyMoney: boolean } |
| Vô hiệu hóa gửi ảnh | PATCH | /room/{roomId}/settings | Body: { disableImage: boolean } |
| Bật/tắt mật khẩu | PATCH | /room/{roomId}/password | Body: { enabled: boolean, password?: string } |
| Danh sách đen | GET | /room/{roomId}/blacklist | Lấy danh sách bị chặn |
| Thêm vào danh sách đen | POST | /room/{roomId}/blacklist | Body: { userId: string } |
| Xóa khỏi danh sách đen | DELETE | /room/{roomId}/blacklist/{userId} | — |
| Danh sách quản trị viên | GET | /room/{roomId}/managers | — |
| Thêm quản trị viên | POST | /room/{roomId}/managers | Body: { userId: string } |
| Xóa quản trị viên | DELETE | /room/{roomId}/managers/{userId} | — |
| Lấy số phòng | GET | /room/{roomId}/code | Trả về mã phòng (VC599381…) |

Mock Response – settings:
```json
{
  "room_id": "123",
  "name": "Party Room",
  "description": "Chill & Connect",
  "private": false,
  "age_limit": 18
}
```

---

## 15. MOCK API CHAT ROOM

| Component (UI) | Type (Backend) | API | Notes (Backend) |
|----------------|----------------|-----|-----------------|
| Room Info (Tên phòng, ảnh host, ID) | Object | GET /rooms/{room_id} | Trả về thông tin phòng: tên, host, ID, avatar host, trạng thái phòng. |
| Điểm (120 ⭐, 110 💎) | Object | GET /rooms/{room_id}/stats | Tổng điểm, tổng quà, tổng xu… cập nhật real-time bằng WebSocket. |
| Danh sách Host / Speaker (hàng trên) | Array<User> | GET /rooms/{room_id}/speakers | Danh sách người đang nói, có mic on/off. |
| Danh sách Listener (hàng dưới) | Array<User> | GET /rooms/{room_id}/listeners | Danh sách người chỉ nghe. |
| Button Mic On/Off | Action | POST /rooms/{room_id}/mic-toggle | Yêu cầu backend kiểm tra quyền host/speaker. |
| Button Raise Hand ✋ | Action | POST /rooms/{room_id}/raise-hand | Gửi yêu cầu xin phát biểu; host cần API approve. |
| Button Gift 🎁 | Action | POST /rooms/{room_id}/send-gift | Body: {sender_id, target_id, gift_id}. Cập nhật điểm + animation cho UI. |
| Button Invite ➕ | Action | POST /rooms/{room_id}/invite | Gửi lời mời vào room cho user khác. |
| Button Setting ⚙️ | None | Không gọi API | Chỉ mở popup cấu hình, không cần backend. |
| System Message (khung nền xám) | Message<System> | GET /rooms/{room_id}/system-messages | Tin nhắn dạng thông báo nội quy, cảnh báo, bot text. |
| Chat Box (tin nhắn) | Array<ChatMessage> | GET /rooms/{room_id}/messages | Lấy lịch sử chat room. Phân trang theo ?cursor= hoặc ?last_id=. |
| Gửi tin nhắn | Message<User> | POST /rooms/{room_id}/messages | Body: {user_id, content, type: 'text'}. Đẩy real-time qua WebSocket. |
| Gửi emoji nhanh (❤️ 😂 👍) | Reaction | POST /rooms/{room_id}/reactions | Không lưu DB → chỉ push vào WebSocket để hiển thị nổi lên UI. |
| Gửi ảnh trong chat | Message<Image> | POST /rooms/{room_id}/messages | Type: "image" + link CDN. |
| Hiệu ứng hình ảnh gửi lên (ảnh vuốt lên từ dưới) | Event | POST /rooms/{room_id}/media-event | Gửi metadata: {image_url, user_id} backend broadcast cho room. |
| Thanh nhập (Say something...) | Input | — | Không gọi API cho đến khi "Send". |
| Người dùng join room | Event | POST /rooms/{room_id}/join | Backend add user vào room + gửi event join. |
| Người dùng rời room | Event | POST /rooms/{room_id}/leave | Backend xoá user khỏi danh sách room. |
| WebSocket – stream sự kiện room | Stream | WS /rooms/{room_id}/ws | Gửi: message, gift, join/leave, mic state, reaction, event image… |

### Mock Response Examples:

**1. GET /rooms/{room_id}**
```json
{
  "room_id": "123",
  "name": "Darlene Bears",
  "host": {
    "id": "u001",
    "name": "Darlene",
    "avatar": "url"
  },
  "status": "active"
}
```

**2. GET /rooms/{room_id}/messages**
```json
[
  {
    "id": "m001",
    "user": { "id": "u001", "name": "Gustavo", "avatar": "url" },
    "content": "Lorem ipsum",
    "type": "text",
    "created_at": "2025-01-02T10:00:00Z"
  }
]
```

**3. POST /rooms/{room_id}/messages**
```json
{
  "user_id": "u001",
  "content": "Hello!",
  "type": "text"
}
```

---


## 16. MOCK API CHỌN CHẾ ĐỘ PHÒNG & GHẾ

### Bảng tổng hợp

| UI Component | Type | API | Backend Notes |
|--------------|------|-----|---------------|
| Mở bottom sheet chế độ phòng | List | GET /rooms/{room_id}/modes | Room mode list |
| Chọn room mode | Action | POST /rooms/{room_id}/set-mode | Broadcast event |
| Mở popup chế độ ghế | List | GET /rooms/{room_id}/seat-layouts | 4 layout |
| Chọn layout | Action | POST /rooms/{room_id}/set-seat-layout | Host only |
| Render ghế trên UI | List | GET /rooms/{room_id}/seats | Trả danh sách ghế + user |
| Join ghế | Action | POST /rooms/{room_id}/seats/join | — |
| Host assign ghế | Action | POST /rooms/{room_id}/seats/assign | — |
| Khóa ghế | Action | POST /rooms/{room_id}/seats/{seat_id}/lock | — |
| Open ghế | Action | DELETE /rooms/{room_id}/seats/{seat_id}/lock | — |
| Rời ghế | Action | POST /rooms/{room_id}/seats/leave | — |

### 16.1. Danh sách chế độ phòng
**GET /rooms/{room_id}/modes**

Response:
```json
{
  "room_id": "123",
  "current_mode": "party",
  "modes": [
    { "id": "party", "title": "Party", "icon": "🎉" },
    { "id": "friend", "title": "Kết bạn", "icon": "🤝" },
    { "id": "chat", "title": "Trò chuyện", "icon": "💬" },
    { "id": "game", "title": "Game", "icon": "🎮" },
    { "id": "entertain", "title": "Giải trí", "icon": "⭐" },
    { "id": "music", "title": "Âm nhạc", "icon": "🎵" }
  ]
}
```

### 16.2. Chọn chế độ phòng
**POST /rooms/{room_id}/set-mode**

Request:
```json
{
  "mode": "music"
}
```

Response:
```json
{
  "success": true,
  "room_id": "123",
  "mode": "music"
}
```

WebSocket broadcast:
```json
{
  "event": "room_mode_changed",
  "mode": "music"
}
```

### 16.3. Lấy danh sách layout ghế
**GET /rooms/{room_id}/seat-layouts**

Response:
```json
{
  "room_id": "123",
  "current_layout_id": "layout_1",
  "layouts": [
    {
      "id": "layout_1",
      "name": "Chế độ 1",
      "seats": 12,
      "preview": [1,1,1,1,1,1,1,1,1,1,1,1]
    },
    {
      "id": "layout_2",
      "name": "Chế độ 2",
      "seats": 8,
      "preview": [1,1,1,1,1,1,1,1]
    },
    {
      "id": "layout_3",
      "name": "Chế độ 3",
      "seats": 9,
      "preview": [1,1,1,1,1,1,1,1,1]
    },
    {
      "id": "layout_4",
      "name": "Chế độ 4",
      "seats": 10,
      "preview": [1,1,1,1,1,1,1,1,1,1]
    }
  ]
}
```

### 16.4. Chọn 1 layout ghế
**POST /rooms/{room_id}/set-seat-layout**

Request:
```json
{
  "layout_id": "layout_3"
}
```

Response:
```json
{
  "success": true,
  "room_id": "123",
  "layout_id": "layout_3"
}
```

WebSocket broadcast:
```json
{
  "event": "seat_layout_changed",
  "layout_id": "layout_3"
}
```

### 16.5. Danh sách ghế theo layout đã chọn
**GET /rooms/{room_id}/seats**

Response:
```json
{
  "room_id": "123",
  "layout_id": "layout_3",
  "seats": [
    { "seat_id": 1, "user": { "id": "u01", "name": "Darlene" }, "locked": false },
    { "seat_id": 2, "user": null, "locked": false },
    { "seat_id": 3, "user": null, "locked": false }
  ]
}
```

---

## 17. MOCK API MỜI BẠN BÈ

| Component | Type | API | Notes |
|-----------|------|-----|-------|
| Danh sách bạn bè | GET | /rooms/{room_id}/friends | Dùng để hiển thị list "Mời bạn bè" |
| Tìm kiếm bạn | GET | /rooms/{room_id}/friends?search= | Search real-time |
| Gửi lời mời | POST | /rooms/{room_id}/invite | Gửi đến nhiều user cùng lúc |
| Trạng thái lời mời | GET | /rooms/{room_id}/invite/status | Optional |

Mock Response – GET friends:
```json
{
  "room_id": "123",
  "friends": [
    {
      "id": "u01",
      "name": "Carter Lipshutz",
      "avatar": "/avatars/a1.png",
      "verified": true,
      "status": "online"
    }
  ]
}
```

---

## 18. MOCK API THỬ THÁCH PHÒNG

### 18.1. Trạng thái thử thách phòng (Challenge Overview)

| Component | Type | API | Notes |
|-----------|------|-----|-------|
| Lấy trạng thái thử thách phòng | GET | /room/{roomId}/challenge | Trả về cấp phòng, tiến độ (0/100000), danh sách phần thưởng |
| Bắt đầu thử thách | POST | /room/{roomId}/challenge/start | Nếu phòng chưa mở challenge |
| Reset thử thách | POST | /room/{roomId}/challenge/reset | Admin phòng được phép reset |

### 18.2. Nâng cấp phòng (Level Progression)

| Component | Type | API | Notes |
|-----------|------|-----|-------|
| Gửi điểm để tăng cấp | POST | /room/{roomId}/challenge/progress | Body: { points: number } |
| Lấy thông tin cấp tiếp theo | GET | /room/{roomId}/challenge/next-level | Trả về yêu cầu để lên level |

### 18.3. Rương phần thưởng (Treasure Chest Rewards)

| Component | Type | API | Notes |
|-----------|------|-----|-------|
| Lấy danh sách rương | GET | /room/{roomId}/challenge/chests | Mỗi rương có id, phần thưởng, điểm cần |
| Mở rương | POST | /room/{roomId}/challenge/chests/{chestId}/open | Trả về phần thưởng (UI bên phải) |
| Lịch sử mở rương | GET | /room/{roomId}/challenge/history | Optional |

### 18.4. Phần thưởng chủ phòng (Host Rewards)

| Component | Type | API | Notes |
|-----------|------|-----|-------|
| Lấy phần thưởng chủ phòng | GET | /room/{roomId}/challenge/host-reward | Ví dụ vòng tay, hiệu ứng… |
| Nhận phần thưởng chủ phòng | POST | /room/{roomId}/challenge/host-reward/claim | Host only |

### 18.5. Danh sách người đóng góp (Top Contributors)

| Component | Type | API | Notes |
|-----------|------|-----|-------|
| Lấy top đóng góp | GET | /room/{roomId}/challenge/contributors | Top 20 user đóng góp nhiều nhất |
| Chi tiết đóng góp 1 user | GET | /room/{roomId}/challenge/contributors/{userId} | Bao nhiêu điểm, số quà tặng… |

### 18.6. Sự kiện chat liên quan thử thách

| Event | Type | API | Notes |
|-------|------|-----|-------|
| Event WebSocket: tăng điểm | WS Push | room.challenge.update | Để realtime cấp → 0/100000 |
| User mở rương | WS Push | room.challenge.reward | Hiện animation rương |

### Mock Response – GET /room/{roomId}/challenge
```json
{
  "level": 2,
  "currentPoints": 10000,
  "requiredPoints": 100000,
  "progressPercent": 10,
  "chests": [
    { "id": 1, "pointsRequired": 5000, "rewardPreview": ["avatar_frame", "gift_box"] },
    { "id": 2, "pointsRequired": 20000, "rewardPreview": ["badge", "coins"] }
  ],
  "hostReward": {
    "id": 1,
    "name": "Vòng ánh sáng tím",
    "pointsRequired": 987
  }
}
```

---

## 19. MOCK API TOP NGƯỜI TẶNG QUÀ

### 19.1. Lấy danh sách top theo ngày / tuần / tháng

| Component | Type | API | Notes |
|-----------|------|-----|-------|
| Danh sách top theo ngày | GET | /room/{roomId}/contributors/daily | Trả danh sách top hôm nay |
| Danh sách top theo tuần | GET | /room/{roomId}/contributors/weekly | — |
| Danh sách top theo tháng | GET | /room/{roomId}/contributors/monthly | — |
| Chi tiết 1 người tặng | GET | /room/{roomId}/contributors/{userId} | Hiển thị tổng điểm + lịch sử quà |
| Reset leaderboard (optional) | POST | /room/{roomId}/contributors/reset | Chỉ admin phòng |

### 19.2. Mock JSON Response (Full UI)
**GET /room/123/contributors/daily**

```json
{
  "type": "daily",
  "serverTime": "2025-11-25T19:02:00Z",
  "list": [
    {
      "rank": 1,
      "userId": "u001",
      "name": "Dulce Baptista",
      "avatar": "https://example.com/avatar1.jpg",
      "badges": ["gift-master", "hot"],
      "points": 1000
    },
    {
      "rank": 2,
      "userId": "u002",
      "name": "Mira Dorwart",
      "avatar": "https://example.com/avatar2.jpg",
      "badges": ["gift-buff"],
      "points": 800
    },
    {
      "rank": 3,
      "userId": "u003",
      "name": "Randy Press",
      "avatar": "https://example.com/avatar3.jpg",
      "badges": ["gift-buff"],
      "points": 200
    },
    {
      "rank": 4,
      "userId": "u004",
      "name": "Kierra Franci",
      "avatar": "https://example.com/avatar4.jpg",
      "badges": [],
      "points": 50
    },
    {
      "rank": 5,
      "userId": "u005",
      "name": "Cheyenne Workman",
      "avatar": "https://example.com/avatar5.jpg",
      "badges": [],
      "points": 10
    },
    {
      "rank": 6,
      "userId": "u006",
      "name": "Randy Aminoff",
      "avatar": "https://example.com/avatar6.jpg",
      "badges": [],
      "points": 10
    },
    {
      "rank": 7,
      "userId": "u001",
      "name": "Dulce Baptista",
      "avatar": "https://example.com/avatar1b.jpg",
      "badges": [],
      "points": 10
    },
    {
      "rank": 10,
      "userId": "u007",
      "name": "Ahmad Dias",
      "avatar": "https://example.com/avatar7.jpg",
      "badges": ["gift-buff"],
      "points": 20
    }
  ],
  "self": {
    "rank": 10,
    "userId": "u007",
    "points": 20
  }
}
```

---

## 20. MOCK API SỐ LƯỢNG NGƯỜI XEM

### 20.1. Bảng Component – Type – API – Notes

| Component | Type | API | Method | Notes |
|-----------|------|-----|--------|-------|
| ViewerListPopup API | API | /api/live/room/{roomId}/viewers | GET | Lấy toàn bộ danh sách người đang xem (kèm top 3 + regular viewers) |
| ViewerListPopup API | API | /api/live/room/{roomId}/viewers/top | GET | (Optional) Lấy riêng top 3 người tặng quà cao nhất |
| ViewerListPopup API | API | /api/live/room/{roomId}/viewers/recent | GET | (Optional) Lấy danh sách người xem thường, hỗ trợ phân trang |
| ViewerListPopup API | API | /api/live/room/{roomId}/viewers/count | GET | API nhẹ, chỉ trả về tổng số người đang xem (update realtime) |
| ViewerKickModal API | API | /api/live/room/{roomId}/kick/{userId} | POST | Host/admin đá người xem khỏi phòng → status chuyển thành left_room |
| ViewerBlockModal API | API | /api/live/room/{roomId}/block/{userId} | POST | Chặn + thêm người dùng vào danh sách đen (blacklisted) |
| ViewerUnblock API | API | /api/live/room/{roomId}/unblock/{userId} | POST | Gỡ người dùng khỏi blacklist |
| ViewerRealtimeUpdate | WebSocket | wss://live.example.com/ws/room/{roomId} | WS | Gửi realtime event: user join/leave, kick, block, update viewer count |
| ViewerSearchPopup API | API | /api/live/room/{roomId}/viewers/search?q=... | GET | Tìm kiếm người xem trong popup theo tên |

### 20.2. JSON Mock API – Viewer List Popup

**GET /api/live/room/:roomId/viewers**

Response:
```json
{
  "code": 0,
  "message": "Success",
  "data": {
    "totalViewers": 110,
    "topContributors": [
      {
        "rank": 1,
        "userId": 1001,
        "username": "Dulce Baptista",
        "avatar": "https://cdn.example.com/avatars/dulce.jpg",
        "level": 73,
        "badge": "crown_gold",
        "status": "in_room",
        "isBlocked": false,
        "isBlacklisted": false
      },
      {
        "rank": 2,
        "userId": 1002,
        "username": "Mira Dorwart",
        "avatar": "https://cdn.example.com/avatars/mira.jpg",
        "level": 72,
        "badge": "crown_silver",
        "status": "in_room",
        "isBlocked": false,
        "isBlacklisted": false
      },
      {
        "rank": 3,
        "userId": 1003,
        "username": "Randy Press",
        "avatar": "https://cdn.example.com/avatars/randy.jpg",
        "level": 73,
        "badge": "crown_bronze",
        "status": "left_room",
        "isBlocked": false,
        "isBlacklisted": false,
        "leftAt": "2025-11-28T18:55:12Z"
      }
    ],
    "regularViewers": [
      {
        "userId": 2001,
        "username": "Kierra Franci",
        "avatar": "https://cdn.example.com/avatars/kierra.jpg",
        "level": 72,
        "status": "left_room",
        "isBlocked": false,
        "isBlacklisted": false
      },
      {
        "userId": 2002,
        "username": "Cheyenne Workman",
        "avatar": "https://cdn.example.com/avatars/cheyenne.jpg",
        "level": 75,
        "status": "left_room",
        "isBlocked": false,
        "isBlacklisted": false
      },
      {
        "userId": 2003,
        "username": "Randy Aminoff",
        "avatar": "https://cdn.example.com/avatars/randy2.jpg",
        "level": 73,
        "status": "in_room",
        "isBlocked": false,
        "isBlacklisted": false
      },
      {
        "userId": 2004,
        "username": "Dulce Baptista",
        "avatar": "https://cdn.example.com/avatars/dulce2.jpg",
        "level": 73,
        "status": "in_room",
        "isBlocked": false,
        "isBlacklisted": false
      },
      {
        "userId": 2005,
        "username": "Nolan Saris",
        "avatar": "https://cdn.example.com/avatars/nolan.jpg",
        "level": 75,
        "status": "blacklisted",
        "isBlocked": true,
        "isBlacklisted": true,
        "blacklistedAt": "2025-11-28T18:30:45Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 50,
      "hasMore": false
    }
  }
}
```

### 20.3. Status Mapping
```json
{
  "statusMapping": {
    "in_room": "Đang xem",
    "left_room": "Đã rời phòng",
    "blacklisted": "Đã vào danh sách đen",
    "blocked": "Đã bị chặn"
  }
}
```

### 20.4. Display Rules
- `topContributors`: luôn hiển thị 3 người góp quà cao nhất (vương miện vàng/bạc/đồng).
- `regularViewers`: danh sách người xem thường, sắp xếp theo thời gian vào phòng (mới → cũ).
- `status = left_room` → hiển thị "Đã rời phòng".
- `isBlacklisted = true` → hiển thị "Đã vào danh sách đen" + icon khóa.
- Nếu vừa rời phòng + bị blacklist → ưu tiên hiển thị trạng thái blacklist.
- `totalViewers` = số người in_room + một số người vừa rời phòng (delay 1–2 phút để cảm giác phòng đông).

---

## ✅ TỔNG KẾT

Tài liệu này bao gồm **CHÍNH XÁC** tất cả các API từ tài liệu gốc bạn gửi:

### Các phần chính:
1. ✅ Bảng Mockup API Room (danh sách phòng, banner, search...)
2. ✅ Bảng Mockup API Create & Enter Chat Room
3. ✅ Mock Response chi tiết (tạo phòng, join, messages...)
4. ✅ Mock API Setting Room - Room Mode
5. ✅ Mock API Setting Room - Chức năng phòng (Music, AI, Game...)
6. ✅ Mock API Setting Room - Quản lý Micro & Slot người nói
7. ✅ Mock API Setting Room - Hiệu ứng Room
8. ✅ Mock API Setting Room - Hệ thống & Thông báo
9. ✅ Mock API Setting Room - Âm thanh quà tặng
10. ✅ Mock API Setting Room - Báo cáo phòng
11. ✅ Mock API Setting Room - Thoát phòng
12. ✅ Mock API Setting Room - Chế độ phòng
13. ✅ Mock API Đẩy phòng (Boost) - Cao cấp & Siêu cấp
14. ✅ Mock API Thiết lập phòng (Cover, Name, Settings...)
15. ✅ Mock API Chat Room (Messages, Speakers, Listeners...)
16. ✅ Mock API Chọn chế độ phòng & ghế (Modes & Seat Layouts)
17. ✅ Mock API Mời bạn bè
18. ✅ Mock API Thử thách phòng (Challenge, Chests, Contributors...)
19. ✅ Mock API Top người tặng quà (Daily/Weekly/Monthly)
20. ✅ Mock API Số lượng người xem (Viewers, Top 3, Blacklist...)

**Không có API nào được thêm vào ngoài tài liệu gốc của bạn!**
