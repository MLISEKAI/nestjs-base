# ROOM API - COMPLETE REFERENCE

## 📋 TỔNG QUAN DỰ ÁN

Tài liệu này tổng hợp **TẤT CẢ** các API cần thiết để xây dựng hệ thống Room (phòng chat voice/video) hoàn chỉnh.

---

## 🎯 MỤC LỤC

1. [Quản lý phòng cơ bản](#1-quản-lý-phòng-cơ-bản)
2. [Bảo mật & Truy cập](#2-bảo-mật--truy-cập)
3. [Quản lý thành viên](#3-quản-lý-thành-viên)
4. [Chat & Tin nhắn](#4-chat--tin-nhắn)
5. [Chế độ phòng & Layout ghế](#5-chế-độ-phòng--layout-ghế)
6. [Thiết lập phòng](#6-thiết-lập-phòng)
7. [Đẩy phòng (Boost)](#7-đẩy-phòng-boost)
8. [Mời bạn bè](#8-mời-bạn-bè)
9. [Thử thách phòng](#9-thử-thách-phòng)
10. [Top người tặng quà](#10-top-người-tặng-quà)
11. [Danh sách người xem](#11-danh-sách-người-xem)
12. [WebSocket Events](#12-websocket-events)

---

## 📊 BẢNG TỔNG HỢP TẤT CẢ API

### 1. QUẢN LÝ PHÒNG CƠ BẢN

| Component | Type | Method | API Endpoint | Notes |
|-----------|------|--------|--------------|-------|
| Tạo phòng mới | Action | POST | `/api/v1/rooms` | Tạo room với title, mode, password |
| Lấy thông tin phòng | Resource | GET | `/api/v1/rooms/{roomId}` | Chi tiết đầy đủ về phòng |
| Cập nhật phòng | Action | PATCH | `/api/v1/rooms/{roomId}` | Cập nhật thông tin phòng |
| Xóa phòng | Action | DELETE | `/api/v1/rooms/{roomId}` | Chỉ host, xóa vĩnh viễn |
| Danh sách phòng - Follow | Collection | GET | `/api/v1/rooms?tab=follow` | Phòng của idol đang follow |
| Danh sách phòng - Friends | Collection | GET | `/api/v1/rooms?tab=friends` | Phòng bạn bè đang xem |
| Danh sách theo Category | Collection | GET | `/api/v1/rooms?category={name}` | Filter: game, party, auction... |
| Tìm kiếm phòng | Search | GET | `/api/v1/search?keyword={q}` | Tìm phòng + user |
| Banner quảng cáo | Resource | GET | `/api/v1/ads?position=room_banner` | Banner livestream |
| Danh sách Category | Resource | GET | `/api/v1/rooms/categories` | List: game, party, auction... |


### 2. BẢO MẬT & TRUY CẬP

| Component | Type | Method | API Endpoint | Notes |
|-----------|------|--------|--------------|-------|
| Đặt mật khẩu phòng | Action | POST | `/api/v1/rooms/{roomId}/password` | Lưu password 4 số |
| Xác thực mật khẩu | Action | POST | `/api/v1/rooms/{roomId}/verify-password` | Kiểm tra password trước khi join |
| Tham gia phòng | Action | POST | `/api/v1/rooms/{roomId}/join` | Join room, nhận token |
| Rời khỏi phòng | Action | POST | `/api/v1/rooms/{roomId}/leave` | Leave room |
| Đóng phòng | Action | POST | `/api/v1/rooms/{roomId}/close` | Chỉ host, đóng phòng |
| Kick thành viên | Action | POST | `/api/v1/rooms/{roomId}/kick/{userId}` | Đuổi user khỏi phòng |
| Block thành viên | Action | POST | `/api/v1/rooms/{roomId}/block/{userId}` | Chặn + blacklist |
| Unblock thành viên | Action | POST | `/api/v1/rooms/{roomId}/unblock/{userId}` | Gỡ khỏi blacklist |
| Danh sách đen | Resource | GET | `/api/v1/rooms/{roomId}/blacklist` | List user bị chặn |
| Thêm vào blacklist | Action | POST | `/api/v1/rooms/{roomId}/blacklist` | Body: {userId} |
| Xóa khỏi blacklist | Action | DELETE | `/api/v1/rooms/{roomId}/blacklist/{userId}` | Gỡ chặn |

### 3. QUẢN LÝ THÀNH VIÊN

| Component | Type | Method | API Endpoint | Notes |
|-----------|------|--------|--------------|-------|
| Danh sách thành viên | Resource | GET | `/api/v1/rooms/{roomId}/participants` | Tất cả user trong phòng |
| Danh sách speakers | Resource | GET | `/api/v1/rooms/{roomId}/speakers` | User đang có mic |
| Danh sách listeners | Resource | GET | `/api/v1/rooms/{roomId}/listeners` | User chỉ nghe |
| Thông tin host | Resource | GET | `/api/v1/rooms/{roomId}/host` | Chi tiết chủ phòng |
| Bật/tắt mic | Action | PATCH | `/api/v1/rooms/{roomId}/participants/mic` | Toggle mic |
| Bật/tắt camera | Action | PATCH | `/api/v1/rooms/{roomId}/participants/camera` | Toggle camera |
| Giơ tay xin phát biểu | Action | POST | `/api/v1/rooms/{roomId}/raise-hand` | Request speak |
| Danh sách quản trị viên | Resource | GET | `/api/v1/rooms/{roomId}/managers` | List admin phòng |
| Thêm quản trị viên | Action | POST | `/api/v1/rooms/{roomId}/managers` | Body: {userId} |
| Xóa quản trị viên | Action | DELETE | `/api/v1/rooms/{roomId}/managers/{userId}` | Remove admin |

### 4. CHAT & TIN NHẮN

| Component | Type | Method | API Endpoint | Notes |
|-----------|------|--------|--------------|-------|
| Lấy lịch sử chat | Resource | GET | `/api/v1/rooms/{roomId}/messages` | Phân trang với cursor |
| Gửi tin nhắn text | Action | POST | `/api/v1/rooms/{roomId}/messages` | Type: text |
| Gửi tin nhắn hình ảnh | Action | POST | `/api/v1/rooms/{roomId}/messages` | Type: image |
| Tin nhắn hệ thống | Resource | GET | `/api/v1/rooms/{roomId}/system-messages` | System notifications |
| Gửi system message | Action | POST | `/api/v1/rooms/{roomId}/system-messages` | Admin only |
| Gửi emoji/reaction | Action | POST | `/api/v1/rooms/{roomId}/reactions` | Emoji nổi lên UI |
| Gửi quà tặng | Action | POST | `/api/v1/rooms/{roomId}/gifts` | Send gift to user |
| Lịch sử quà tặng | Resource | GET | `/api/v1/rooms/{roomId}/gifts/history` | Gift history |
| Gửi media event | Action | POST | `/api/v1/rooms/{roomId}/media-event` | Ảnh vuốt lên từ dưới |


### 5. CHẾ ĐỘ PHÒNG & LAYOUT GHẾ

| Component | Type | Method | API Endpoint | Notes |
|-----------|------|--------|--------------|-------|
| Danh sách chế độ phòng | Resource | GET | `/api/v1/rooms/{roomId}/modes` | Party, Game, Chat, Friend... |
| Chọn chế độ phòng | Action | POST | `/api/v1/rooms/{roomId}/set-mode` | Body: {mode} |
| Danh sách layout ghế | Resource | GET | `/api/v1/rooms/{roomId}/seat-layouts` | 4 layout khác nhau |
| Chọn layout ghế | Action | POST | `/api/v1/rooms/{roomId}/set-seat-layout` | Body: {layout_id} |
| Danh sách ghế | Resource | GET | `/api/v1/rooms/{roomId}/seats` | Tất cả ghế + user |
| Join ghế | Action | POST | `/api/v1/rooms/{roomId}/seats/join` | User tự join slot trống |
| Host assign ghế | Action | POST | `/api/v1/rooms/{roomId}/seats/assign` | Host kéo user vào ghế |
| Khóa ghế | Action | POST | `/api/v1/rooms/{roomId}/seats/{seatId}/lock` | Ghế không join được |
| Mở khóa ghế | Action | DELETE | `/api/v1/rooms/{roomId}/seats/{seatId}/lock` | Unlock seat |
| Rời ghế | Action | POST | `/api/v1/rooms/{roomId}/seats/leave` | Leave seat |

### 6. THIẾT LẬP PHÒNG

| Component | Type | Method | API Endpoint | Notes |
|-----------|------|--------|--------------|-------|
| Lấy cấu hình phòng | Resource | GET | `/api/v1/rooms/{roomId}/settings` | Tất cả settings |
| Upload bìa phòng | Action | POST | `/api/v1/rooms/{roomId}/cover` | Upload ảnh cover |
| Lấy bìa phòng | Resource | GET | `/api/v1/rooms/{roomId}/cover` | Get cover image |
| Cập nhật tên phòng | Action | PATCH | `/api/v1/rooms/{roomId}/settings/name` | Update name |
| Cập nhật mô tả | Action | PATCH | `/api/v1/rooms/{roomId}/settings/description` | Update description |
| Cập nhật thông báo | Action | PATCH | `/api/v1/rooms/{roomId}` | Body: {notice} |
| Bật/tắt private room | Action | PATCH | `/api/v1/rooms/{roomId}/settings/private` | Body: {private: bool} |
| Giới hạn tuổi | Action | PATCH | `/api/v1/rooms/{roomId}/settings/age-limit` | Body: {age_limit} |
| Đổi background phòng | Action | PATCH | `/api/v1/rooms/{roomId}/background` | Body: {backgroundId} |
| Đổi theme UI | Action | PATCH | `/api/v1/rooms/{roomId}/theme` | Dark/Light/Party |
| Hiệu ứng phòng | Action | POST | `/api/v1/rooms/{roomId}/effects` | Trigger animation |
| Vô hiệu hóa tin nhắn | Action | PATCH | `/api/v1/rooms/{roomId}/settings` | Body: {disableMessage} |
| Vô hiệu hóa lì xì | Action | PATCH | `/api/v1/rooms/{roomId}/settings` | Body: {disableLuckyMoney} |
| Vô hiệu hóa gửi ảnh | Action | PATCH | `/api/v1/rooms/{roomId}/settings` | Body: {disableImage} |
| Bật/tắt mật khẩu | Action | PATCH | `/api/v1/rooms/{roomId}/password` | Body: {enabled, password} |
| Lấy số phòng | Resource | GET | `/api/v1/rooms/{roomId}/code` | Room code (VC599381) |
| Thống kê phòng | Resource | GET | `/api/v1/rooms/{roomId}/stats` | Điểm, quà, xu... |
| Thống kê chất lượng | Resource | GET | `/api/v1/rooms/{roomId}/quality` | Audio/video quality |

### 7. ĐẨY PHÒNG (BOOST)

| Component | Type | Method | API Endpoint | Notes |
|-----------|------|--------|--------------|-------|
| Danh sách thẻ boost (Cao cấp) | Resource | GET | `/api/v1/rooms/{roomId}/boost/items` | Thẻ người dùng đang có |
| Danh sách gói boost (Siêu cấp) | Resource | GET | `/api/v1/rooms/{roomId}/boost/super-packages` | Mua bằng coin |
| Sử dụng thẻ boost | Action | POST | `/api/v1/rooms/{roomId}/boost/use-item` | Body: {item_id} |
| Mua gói boost | Action | POST | `/api/v1/rooms/{roomId}/boost/purchase` | Body: {package_id} |
| Lịch sử nhận thẻ | Resource | GET | `/api/v1/rooms/{roomId}/boost/rewards` | Daily rewards |
| Lịch sử boost | Resource | GET | `/api/v1/rooms/{roomId}/boost/history` | Boost history |


### 8. MỜI BẠN BÈ

| Component | Type | Method | API Endpoint | Notes |
|-----------|------|--------|--------------|-------|
| Danh sách bạn bè | Resource | GET | `/api/v1/rooms/{roomId}/friends` | List để mời |
| Tìm kiếm bạn bè | Search | GET | `/api/v1/rooms/{roomId}/friends?search={q}` | Search real-time |
| Gửi lời mời | Action | POST | `/api/v1/rooms/{roomId}/invite` | Body: {userIds[]} |
| Trạng thái lời mời | Resource | GET | `/api/v1/rooms/{roomId}/invite/status` | Invite status |

### 9. THỬ THÁCH PHÒNG

| Component | Type | Method | API Endpoint | Notes |
|-----------|------|--------|--------------|-------|
| Trạng thái thử thách | Resource | GET | `/api/v1/rooms/{roomId}/challenge` | Level, progress, rewards |
| Bắt đầu thử thách | Action | POST | `/api/v1/rooms/{roomId}/challenge/start` | Start challenge |
| Reset thử thách | Action | POST | `/api/v1/rooms/{roomId}/challenge/reset` | Admin only |
| Gửi điểm tăng cấp | Action | POST | `/api/v1/rooms/{roomId}/challenge/progress` | Body: {points} |
| Thông tin cấp tiếp theo | Resource | GET | `/api/v1/rooms/{roomId}/challenge/next-level` | Next level info |
| Danh sách rương | Resource | GET | `/api/v1/rooms/{roomId}/challenge/chests` | Treasure chests |
| Mở rương | Action | POST | `/api/v1/rooms/{roomId}/challenge/chests/{chestId}/open` | Open chest |
| Lịch sử mở rương | Resource | GET | `/api/v1/rooms/{roomId}/challenge/history` | Chest history |
| Phần thưởng chủ phòng | Resource | GET | `/api/v1/rooms/{roomId}/challenge/host-reward` | Host rewards |
| Nhận phần thưởng host | Action | POST | `/api/v1/rooms/{roomId}/challenge/host-reward/claim` | Claim reward |
| Top đóng góp | Resource | GET | `/api/v1/rooms/{roomId}/challenge/contributors` | Top 20 contributors |
| Chi tiết đóng góp user | Resource | GET | `/api/v1/rooms/{roomId}/challenge/contributors/{userId}` | User contribution |

### 10. TOP NGƯỜI TẶNG QUÀ

| Component | Type | Method | API Endpoint | Notes |
|-----------|------|--------|--------------|-------|
| Top theo ngày | Resource | GET | `/api/v1/rooms/{roomId}/contributors/daily` | Daily leaderboard |
| Top theo tuần | Resource | GET | `/api/v1/rooms/{roomId}/contributors/weekly` | Weekly leaderboard |
| Top theo tháng | Resource | GET | `/api/v1/rooms/{roomId}/contributors/monthly` | Monthly leaderboard |
| Chi tiết người tặng | Resource | GET | `/api/v1/rooms/{roomId}/contributors/{userId}` | User details |
| Reset leaderboard | Action | POST | `/api/v1/rooms/{roomId}/contributors/reset` | Admin only |

### 11. DANH SÁCH NGƯỜI XEM

| Component | Type | Method | API Endpoint | Notes |
|-----------|------|--------|--------------|-------|
| Danh sách người xem | Resource | GET | `/api/v1/rooms/{roomId}/viewers` | Full viewer list |
| Top 3 người tặng quà | Resource | GET | `/api/v1/rooms/{roomId}/viewers/top` | Top 3 contributors |
| Người xem thường | Resource | GET | `/api/v1/rooms/{roomId}/viewers/recent` | Regular viewers |
| Số lượng người xem | Resource | GET | `/api/v1/rooms/{roomId}/viewers/count` | Viewer count only |
| Tìm kiếm người xem | Search | GET | `/api/v1/rooms/{roomId}/viewers/search?q={keyword}` | Search viewers |

### 12. CHỨC NĂNG BỔ SUNG

| Component | Type | Method | API Endpoint | Notes |
|-----------|------|--------|--------------|-------|
| Danh sách âm thanh quà | Resource | GET | `/api/v1/rooms/{roomId}/gift-sounds` | Gift sound effects |
| Phát âm thanh quà | Action | POST | `/api/v1/rooms/{roomId}/gift-sounds/play` | Play sound |
| Lịch sử âm thanh | Resource | GET | `/api/v1/rooms/{roomId}/gift-sounds/history` | Sound history |
| Báo cáo phòng | Action | POST | `/api/v1/rooms/{roomId}/report` | Report room |
| Danh mục báo cáo | Resource | GET | `/api/v1/report/categories` | Report categories |
| Danh sách game | Resource | GET | `/api/v1/rooms/{roomId}/games` | Mini games |
| Bắt đầu game | Action | POST | `/api/v1/rooms/{roomId}/games/start` | Start game |
| Bật/tắt Music Mode | Action | POST | `/api/v1/rooms/{roomId}/music/toggle` | Toggle music |
| Bật/tắt AI Chat | Action | POST | `/api/v1/rooms/{roomId}/ai-mode/toggle` | Toggle AI chat |
| Chọn kiểu chat | Action | POST | `/api/v1/rooms/{roomId}/chat-mode` | Voice/text/mix |
| Bật Friend Mode | Action | POST | `/api/v1/rooms/{roomId}/friend-mode` | Friend mode only |
| Thông tin user hiện tại | Resource | GET | `/api/v1/me` | Current user info |
| Hoạt động bạn bè | Resource | GET | `/api/v1/friends/activity` | Friends watching rooms |

---


## 🔌 WEBSOCKET EVENTS

### Room Chat WebSocket
**URL:** `wss://chat.example.com/rooms/{roomId}?token={auth_token}`

| Event Name | Direction | Payload | Description |
|------------|-----------|---------|-------------|
| `message` | Client → Server | `{text, type}` | Gửi tin nhắn |
| `new_message` | Server → Client | `{messageId, userId, username, text, timestamp}` | Tin nhắn mới |
| `system_message` | Server → Client | `{type, text, timestamp}` | Thông báo hệ thống |
| `gift_sent` | Server → Client | `{giftId, fromUser, toUser, quantity}` | Quà tặng mới |
| `participant_joined` | Server → Client | `{userId, username, avatar, position}` | Người mới vào |
| `participant_left` | Server → Client | `{userId, position}` | Người rời phòng |
| `participant_muted` | Server → Client | `{userId, isMuted}` | Trạng thái mute |
| `participant_camera` | Server → Client | `{userId, isCameraOn}` | Trạng thái camera |
| `room_closed` | Server → Client | `{reason, timestamp}` | Phòng đóng cửa |
| `quality_update` | Server → Client | `{quality, message}` | Cập nhật chất lượng |
| `room_mode_changed` | Server → Client | `{mode}` | Đổi chế độ phòng |
| `seat_layout_changed` | Server → Client | `{layout_id}` | Đổi layout ghế |
| `room_boost_started` | Server → Client | `{duration, end_at}` | Bắt đầu boost |
| `room_boost_ended` | Server → Client | `{timestamp}` | Kết thúc boost |
| `room.challenge.update` | Server → Client | `{level, points, progress}` | Cập nhật thử thách |
| `room.challenge.reward` | Server → Client | `{chestId, rewards}` | Mở rương thành công |

### Voice/Video WebSocket
**URL:** `wss://voice.example.com/rooms/{roomId}?token={webrtc_token}`

| Event Name | Direction | Payload | Description |
|------------|-----------|---------|-------------|
| `offer` | Client → Server | `{sdp, type}` | WebRTC offer |
| `answer` | Server → Client | `{sdp, type}` | WebRTC answer |
| `ice_candidate` | Bidirectional | `{candidate, sdpMid, sdpMLineIndex}` | ICE candidate |
| `mic_toggle` | Client → Server | `{enabled}` | Bật/tắt mic |
| `camera_toggle` | Client → Server | `{enabled}` | Bật/tắt camera |
| `stream_quality` | Server → Client | `{userId, quality, bitrate}` | Chất lượng stream |

---

## 📝 CHI TIẾT REQUEST/RESPONSE

### 1. TẠO PHÒNG

**POST** `/api/v1/rooms`

**Request:**
```json
{
  "title": "From Hani With Love",
  "mode": "party",
  "labels": ["giải trí", "trò chuyện"],
  "is_protected": true,
  "maxParticipants": 10,
  "settings": {
    "allowCamera": true,
    "allowMic": true,
    "autoMuteNewMembers": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
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
      "avatar": "https://cdn/avatar.png",
      "badges": ["verified", "idol"]
    },
    "maxParticipants": 10,
    "currentParticipants": 1,
    "createdAt": "2024-11-28T19:02:00Z",
    "roomUrl": "vortex://room/r987"
  }
}
```

---

### 2. ĐẶT MẬT KHẨU PHÒNG

**POST** `/api/v1/rooms/{roomId}/password`

**Request:**
```json
{
  "password": "7777"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "room_id": "r987",
    "is_protected": true,
    "password_set": true,
    "status": "active"
  }
}
```

---

### 3. LẤY THÔNG TIN PHÒNG

**GET** `/api/v1/rooms/{roomId}`

**Response:**
```json
{
  "success": true,
  "data": {
    "room_id": "r987",
    "title": "From Hani With Love",
    "mode": "party",
    "labels": ["giải trí", "trò chuyện"],
    "is_protected": true,
    "host": {
      "id": "u123",
      "name": "Darlene Bears",
      "avatar": "https://cdn/avatar.png",
      "badges": ["verified", "idol"],
      "vipLevel": 5
    },
    "members_count": 5,
    "maxParticipants": 10,
    "status": "active",
    "stats": {
      "totalGifts": 120,
      "totalViewers": 110,
      "totalPoints": 5000
    },
    "slots": [
      {
        "slot": 1,
        "user": {
          "id": "u123",
          "name": "Darlene Bears",
          "avatar": "https://cdn/avatar.png",
          "isHost": true,
          "isMuted": false,
          "isCameraOn": true
        }
      },
      { "slot": 2, "user": null },
      { "slot": 3, "user": null }
    ],
    "createdAt": "2024-11-28T19:00:00Z"
  }
}
```

---


### 4. XÁC THỰC MẬT KHẨU

**POST** `/api/v1/rooms/{roomId}/verify-password`

**Request:**
```json
{
  "password": "7777"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "verified": true,
    "accessToken": "room_access_token_xyz",
    "expiresAt": "2024-11-28T23:02:00Z"
  }
}
```

---

### 5. THAM GIA PHÒNG

**POST** `/api/v1/rooms/{roomId}/join`

**Request:**
```json
{
  "accessToken": "room_access_token_xyz",
  "password": "7777",
  "deviceInfo": {
    "platform": "ios",
    "hasCamera": true,
    "hasMicrophone": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "room_id": "r987",
    "join_status": "success",
    "slot_assigned": 3,
    "participantId": "participant_456",
    "isMuted": false,
    "isCameraOn": false,
    "webRtcToken": "webrtc_token_xyz",
    "chatWebSocketUrl": "wss://chat.example.com/rooms/r987",
    "voiceWebSocketUrl": "wss://voice.example.com/rooms/r987",
    "webRtcConfig": {
      "iceServers": [
        {
          "urls": "stun:stun.example.com:3478"
        },
        {
          "urls": "turn:turn.example.com:3478",
          "username": "user",
          "credential": "pass"
        }
      ]
    }
  }
}
```

---

### 6. LẤY TIN NHẮN

**GET** `/api/v1/rooms/{roomId}/messages?cursor={cursor}&limit=50`

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "m1",
        "type": "system",
        "text": "Welcome to Darlene Bears' live streaming room! Vortex creates a friendly and harmonious live environment.",
        "created_at": "2025-01-01T10:00:00Z"
      },
      {
        "id": "m2",
        "type": "system",
        "text": "This room is high quality. The sound quality has been improved, and the consumption will simultaneously increase.",
        "created_at": "2025-01-01T10:00:02Z"
      },
      {
        "id": "m3",
        "type": "user",
        "user": {
          "id": "u001",
          "name": "Gustavo",
          "avatar": "https://cdn/avatar1.jpg",
          "level": 73
        },
        "content": "Lorem ipsum dolor sit amet",
        "created_at": "2025-01-01T10:01:00Z"
      }
    ],
    "pagination": {
      "cursor": "next_cursor_token",
      "hasMore": true
    }
  }
}
```

---

### 7. GỬI TIN NHẮN

**POST** `/api/v1/rooms/{roomId}/messages`

**Request:**
```json
{
  "content": "Hello everyone!",
  "type": "text"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "m789",
    "roomId": "r987",
    "userId": "u123",
    "username": "John Doe",
    "content": "Hello everyone!",
    "type": "text",
    "timestamp": "2024-11-28T19:05:00Z"
  }
}
```

---

### 8. GỬI QUÀ TẶNG

**POST** `/api/v1/rooms/{roomId}/gifts`

**Request:**
```json
{
  "giftId": "gift_diamond",
  "quantity": 10,
  "recipientId": "u789"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "giftId": "gift_diamond",
    "quantity": 10,
    "totalCost": 1000,
    "remainingBalance": 3500,
    "sender": {
      "userId": "u123",
      "username": "John Doe"
    },
    "recipient": {
      "userId": "u789",
      "username": "Darlene Bears"
    },
    "timestamp": "2024-11-28T19:06:00Z"
  }
}
```

---

### 9. DANH SÁCH CHẾ ĐỘ PHÒNG

**GET** `/api/v1/rooms/{roomId}/modes`

**Response:**
```json
{
  "success": true,
  "data": {
    "room_id": "r987",
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
}
```

---

### 10. CHỌN CHẾ ĐỘ PHÒNG

**POST** `/api/v1/rooms/{roomId}/set-mode`

**Request:**
```json
{
  "mode": "music"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "room_id": "r987",
    "mode": "music",
    "updated_at": "2025-01-02T12:00:00Z"
  }
}
```

---

### 11. DANH SÁCH LAYOUT GHẾ

**GET** `/api/v1/rooms/{roomId}/seat-layouts`

**Response:**
```json
{
  "success": true,
  "data": {
    "room_id": "r987",
    "current_layout_id": "layout_1",
    "layouts": [
      {
        "id": "layout_1",
        "name": "Chế độ 1",
        "seats": 12,
        "preview": [1,1,1,1,1,1,1,1,1,1,1,1],
        "description": "Nhiều ghế bao quanh + 1 host center"
      },
      {
        "id": "layout_2",
        "name": "Chế độ 2",
        "seats": 8,
        "preview": [1,1,1,1,1,1,1,1],
        "description": "2 hàng"
      },
      {
        "id": "layout_3",
        "name": "Chế độ 3",
        "seats": 9,
        "preview": [1,1,1,1,1,1,1,1,1],
        "description": "3 hàng"
      },
      {
        "id": "layout_4",
        "name": "Chế độ 4",
        "seats": 10,
        "preview": [1,1,1,1,1,1,1,1,1,1],
        "description": "Hỗn hợp"
      }
    ]
  }
}
```

---


### 12. DANH SÁCH GHẾ

**GET** `/api/v1/rooms/{roomId}/seats`

**Response:**
```json
{
  "success": true,
  "data": {
    "room_id": "r987",
    "layout_id": "layout_3",
    "seats": [
      {
        "seat_id": 1,
        "user": {
          "id": "u123",
          "name": "Darlene Bears",
          "avatar": "https://cdn/avatar.png",
          "isHost": true,
          "isMuted": false,
          "isCameraOn": true
        },
        "locked": false
      },
      { "seat_id": 2, "user": null, "locked": false },
      { "seat_id": 3, "user": null, "locked": false },
      { "seat_id": 4, "user": null, "locked": true }
    ]
  }
}
```

---

### 13. DANH SÁCH THẺ BOOST

**GET** `/api/v1/rooms/{roomId}/boost/items`

**Response:**
```json
{
  "success": true,
  "data": {
    "room_id": "r987",
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
}
```

---

### 14. DANH SÁCH GÓI BOOST SIÊU CẤP

**GET** `/api/v1/rooms/{roomId}/boost/super-packages`

**Response:**
```json
{
  "success": true,
  "data": {
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
}
```

---

### 15. SỬ DỤNG THẺ BOOST

**POST** `/api/v1/rooms/{roomId}/boost/use-item`

**Request:**
```json
{
  "item_id": "boost_warmup_4"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "room_id": "r987",
    "item_id": "boost_warmup_4",
    "duration_minutes": 4,
    "status": "activated",
    "boost_end_at": "2025-01-16T00:04:00Z",
    "boosting": true,
    "remaining_seconds": 240
  }
}
```

---

### 16. TRẠNG THÁI THỬ THÁCH PHÒNG

**GET** `/api/v1/rooms/{roomId}/challenge`

**Response:**
```json
{
  "success": true,
  "data": {
    "level": 2,
    "currentPoints": 10000,
    "requiredPoints": 100000,
    "progressPercent": 10,
    "chests": [
      {
        "id": 1,
        "pointsRequired": 5000,
        "rewardPreview": ["avatar_frame", "gift_box"],
        "status": "opened"
      },
      {
        "id": 2,
        "pointsRequired": 20000,
        "rewardPreview": ["badge", "coins"],
        "status": "locked"
      }
    ],
    "hostReward": {
      "id": 1,
      "name": "Vòng ánh sáng tím",
      "pointsRequired": 987,
      "claimed": false
    }
  }
}
```

---

### 17. TOP NGƯỜI TẶNG QUÀ THEO NGÀY

**GET** `/api/v1/rooms/{roomId}/contributors/daily`

**Response:**
```json
{
  "success": true,
  "data": {
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
      }
    ],
    "self": {
      "rank": 10,
      "userId": "u007",
      "points": 20
    }
  }
}
```

---

### 18. DANH SÁCH NGƯỜI XEM

**GET** `/api/v1/rooms/{roomId}/viewers`

**Response:**
```json
{
  "success": true,
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

---


## 🔐 ERROR CODES

| Code | Message | HTTP Status | Description |
|------|---------|-------------|-------------|
| `ROOM_NOT_FOUND` | Room not found | 404 | Phòng không tồn tại |
| `ROOM_FULL` | Room is full | 403 | Phòng đã đầy |
| `WRONG_PASSWORD` | Incorrect password | 401 | Sai mật khẩu |
| `ROOM_CLOSED` | Room has been closed | 410 | Phòng đã đóng |
| `NOT_HOST` | Only host can perform this action | 403 | Chỉ host mới có quyền |
| `ALREADY_IN_ROOM` | Already in another room | 409 | Đang ở phòng khác |
| `INSUFFICIENT_LEVEL` | Insufficient level to join | 403 | Level không đủ |
| `BANNED_FROM_ROOM` | Banned from this room | 403 | Bị cấm vào phòng |
| `WEBRTC_CONNECTION_FAILED` | WebRTC connection failed | 500 | Kết nối WebRTC thất bại |
| `MIC_PERMISSION_DENIED` | Microphone permission denied | 403 | Không có quyền mic |
| `CAMERA_PERMISSION_DENIED` | Camera permission denied | 403 | Không có quyền camera |
| `INSUFFICIENT_BALANCE` | Insufficient balance | 402 | Không đủ số dư |
| `SEAT_OCCUPIED` | Seat is already occupied | 409 | Ghế đã có người |
| `SEAT_LOCKED` | Seat is locked | 403 | Ghế bị khóa |
| `INVALID_GIFT` | Invalid gift | 400 | Gift không hợp lệ |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 | Quá nhiều request |
| `UNAUTHORIZED` | Unauthorized | 401 | Chưa đăng nhập |
| `FORBIDDEN` | Forbidden | 403 | Không có quyền |
| `VALIDATION_ERROR` | Validation error | 422 | Dữ liệu không hợp lệ |

---

## 📐 DATA MODELS

### Room Object
```typescript
interface Room {
  room_id: string;
  title: string;
  mode: RoomMode;
  labels: string[];
  is_protected: boolean;
  password_set: boolean;
  status: RoomStatus;
  host: User;
  members_count: number;
  maxParticipants: number;
  stats: RoomStats;
  slots: Seat[];
  createdAt: string;
  updatedAt: string;
}
```

### User Object
```typescript
interface User {
  id: string;
  name: string;
  avatar: string;
  level?: number;
  badges?: string[];
  vipLevel?: number;
  isHost?: boolean;
  isMuted?: boolean;
  isCameraOn?: boolean;
}
```

### Seat Object
```typescript
interface Seat {
  seat_id: number;
  user: User | null;
  locked: boolean;
}
```

### Message Object
```typescript
interface Message {
  id: string;
  type: 'text' | 'image' | 'system';
  user?: User;
  content?: string;
  text?: string;
  created_at: string;
}
```

### Gift Object
```typescript
interface Gift {
  giftId: string;
  quantity: number;
  totalCost: number;
  sender: User;
  recipient: User;
  timestamp: string;
}
```

### RoomStats Object
```typescript
interface RoomStats {
  totalGifts: number;
  totalViewers: number;
  totalPoints: number;
}
```

### Enums
```typescript
enum RoomMode {
  PARTY = 'party',
  FRIEND = 'friend',
  CHAT = 'chat',
  GAME = 'game',
  ENTERTAIN = 'entertain',
  MUSIC = 'music'
}

enum RoomStatus {
  CREATED = 'created',
  ACTIVE = 'active',
  CLOSED = 'closed'
}

enum ViewerStatus {
  IN_ROOM = 'in_room',
  LEFT_ROOM = 'left_room',
  BLACKLISTED = 'blacklisted',
  BLOCKED = 'blocked'
}

enum BadgeType {
  CROWN_GOLD = 'crown_gold',
  CROWN_SILVER = 'crown_silver',
  CROWN_BRONZE = 'crown_bronze',
  GIFT_MASTER = 'gift-master',
  GIFT_BUFF = 'gift-buff',
  HOT = 'hot',
  VERIFIED = 'verified',
  IDOL = 'idol'
}
```

---

## 🎨 UI COMPONENTS MAPPING

### 1. Room List Screen
- **Banner**: `GET /api/v1/ads?position=room_banner`
- **Tabs**: Filter với query params `?tab=follow|friends`
- **Room Grid**: `GET /api/v1/rooms?category={name}`
- **Search**: `GET /api/v1/search?keyword={q}`

### 2. Create Room Screen
- **Create Form**: `POST /api/v1/rooms`
- **Mode Selection**: Hiển thị 6 modes (party, friend, chat, game, entertain, music)
- **Labels**: Multiple selection
- **Password Toggle**: `is_protected` boolean

### 3. Password Screen
- **4-digit Input**: Numeric keypad
- **Verify**: `POST /api/v1/rooms/{roomId}/verify-password`
- **Submit**: Disabled until 4 digits entered

### 4. Room Screen
- **Header**: Host info, room ID, settings
- **Participant Grid**: `GET /api/v1/rooms/{roomId}/seats`
- **Chat Area**: `GET /api/v1/rooms/{roomId}/messages`
- **Bottom Bar**: Camera, mic, text input, emoji, gift buttons
- **Stats Display**: Points (⭐💎) from `GET /api/v1/rooms/{roomId}/stats`

### 5. Room Settings Screen
- **Cover Upload**: `POST /api/v1/rooms/{roomId}/cover`
- **Name/Description**: `PATCH /api/v1/rooms/{roomId}`
- **Mode Selection**: `POST /api/v1/rooms/{roomId}/set-mode`
- **Seat Layout**: `POST /api/v1/rooms/{roomId}/set-seat-layout`
- **Blacklist**: `GET /api/v1/rooms/{roomId}/blacklist`
- **Managers**: `GET /api/v1/rooms/{roomId}/managers`

### 6. Boost Screen
- **Cao cấp Tab**: `GET /api/v1/rooms/{roomId}/boost/items`
- **Siêu cấp Tab**: `GET /api/v1/rooms/{roomId}/boost/super-packages`
- **Use Item**: `POST /api/v1/rooms/{roomId}/boost/use-item`
- **Purchase**: `POST /api/v1/rooms/{roomId}/boost/purchase`

### 7. Challenge Screen
- **Progress Bar**: `GET /api/v1/rooms/{roomId}/challenge`
- **Chest List**: Display chests with status
- **Open Chest**: `POST /api/v1/rooms/{roomId}/challenge/chests/{chestId}/open`
- **Host Reward**: `POST /api/v1/rooms/{roomId}/challenge/host-reward/claim`

### 8. Contributors Screen
- **Daily/Weekly/Monthly Tabs**: `GET /api/v1/rooms/{roomId}/contributors/{period}`
- **Leaderboard**: Display top contributors with badges
- **Self Position**: Show current user rank

### 9. Viewers Popup
- **Top 3**: Display with crown badges (gold/silver/bronze)
- **Regular List**: Scrollable list with status
- **Search**: `GET /api/v1/rooms/{roomId}/viewers/search?q={keyword}`
- **Kick/Block**: `POST /api/v1/rooms/{roomId}/kick/{userId}`

---


## 🚀 IMPLEMENTATION CHECKLIST

### Phase 1: Core Room Management (Priority: HIGH)
- [ ] **1.1** Tạo phòng (`POST /api/v1/rooms`)
- [ ] **1.2** Lấy thông tin phòng (`GET /api/v1/rooms/{roomId}`)
- [ ] **1.3** Đặt mật khẩu phòng (`POST /api/v1/rooms/{roomId}/password`)
- [ ] **1.4** Xác thực mật khẩu (`POST /api/v1/rooms/{roomId}/verify-password`)
- [ ] **1.5** Tham gia phòng (`POST /api/v1/rooms/{roomId}/join`)
- [ ] **1.6** Rời khỏi phòng (`POST /api/v1/rooms/{roomId}/leave`)
- [ ] **1.7** Đóng phòng (`POST /api/v1/rooms/{roomId}/close`)
- [ ] **1.8** Danh sách phòng (`GET /api/v1/rooms`)

### Phase 2: Chat & Messaging (Priority: HIGH)
- [ ] **2.1** Lấy lịch sử chat (`GET /api/v1/rooms/{roomId}/messages`)
- [ ] **2.2** Gửi tin nhắn text (`POST /api/v1/rooms/{roomId}/messages`)
- [ ] **2.3** Gửi tin nhắn hình ảnh (`POST /api/v1/rooms/{roomId}/messages`)
- [ ] **2.4** Tin nhắn hệ thống (`GET /api/v1/rooms/{roomId}/system-messages`)
- [ ] **2.5** WebSocket chat (`wss://chat.example.com/rooms/{roomId}`)
- [ ] **2.6** Gửi emoji/reaction (`POST /api/v1/rooms/{roomId}/reactions`)

### Phase 3: Members & Participants (Priority: HIGH)
- [ ] **3.1** Danh sách thành viên (`GET /api/v1/rooms/{roomId}/participants`)
- [ ] **3.2** Danh sách speakers (`GET /api/v1/rooms/{roomId}/speakers`)
- [ ] **3.3** Danh sách listeners (`GET /api/v1/rooms/{roomId}/listeners`)
- [ ] **3.4** Bật/tắt mic (`PATCH /api/v1/rooms/{roomId}/participants/mic`)
- [ ] **3.5** Bật/tắt camera (`PATCH /api/v1/rooms/{roomId}/participants/camera`)
- [ ] **3.6** Kick thành viên (`POST /api/v1/rooms/{roomId}/kick/{userId}`)
- [ ] **3.7** Block thành viên (`POST /api/v1/rooms/{roomId}/block/{userId}`)

### Phase 4: WebRTC Voice/Video (Priority: HIGH)
- [ ] **4.1** WebRTC configuration trong join response
- [ ] **4.2** WebSocket voice/video (`wss://voice.example.com/rooms/{roomId}`)
- [ ] **4.3** ICE candidate exchange
- [ ] **4.4** Stream quality monitoring
- [ ] **4.5** Mic toggle event
- [ ] **4.6** Camera toggle event

### Phase 5: Room Modes & Seats (Priority: MEDIUM)
- [ ] **5.1** Danh sách chế độ phòng (`GET /api/v1/rooms/{roomId}/modes`)
- [ ] **5.2** Chọn chế độ phòng (`POST /api/v1/rooms/{roomId}/set-mode`)
- [ ] **5.3** Danh sách layout ghế (`GET /api/v1/rooms/{roomId}/seat-layouts`)
- [ ] **5.4** Chọn layout ghế (`POST /api/v1/rooms/{roomId}/set-seat-layout`)
- [ ] **5.5** Danh sách ghế (`GET /api/v1/rooms/{roomId}/seats`)
- [ ] **5.6** Join ghế (`POST /api/v1/rooms/{roomId}/seats/join`)
- [ ] **5.7** Host assign ghế (`POST /api/v1/rooms/{roomId}/seats/assign`)
- [ ] **5.8** Khóa/mở ghế (`POST/DELETE /api/v1/rooms/{roomId}/seats/{seatId}/lock`)

### Phase 6: Gifts & Points (Priority: MEDIUM)
- [ ] **6.1** Gửi quà tặng (`POST /api/v1/rooms/{roomId}/gifts`)
- [ ] **6.2** Lịch sử quà tặng (`GET /api/v1/rooms/{roomId}/gifts/history`)
- [ ] **6.3** Thống kê phòng (`GET /api/v1/rooms/{roomId}/stats`)
- [ ] **6.4** Danh sách âm thanh quà (`GET /api/v1/rooms/{roomId}/gift-sounds`)
- [ ] **6.5** Phát âm thanh quà (`POST /api/v1/rooms/{roomId}/gift-sounds/play`)

### Phase 7: Room Settings (Priority: MEDIUM)
- [ ] **7.1** Lấy cấu hình phòng (`GET /api/v1/rooms/{roomId}/settings`)
- [ ] **7.2** Upload bìa phòng (`POST /api/v1/rooms/{roomId}/cover`)
- [ ] **7.3** Cập nhật tên/mô tả (`PATCH /api/v1/rooms/{roomId}`)
- [ ] **7.4** Đổi background (`PATCH /api/v1/rooms/{roomId}/background`)
- [ ] **7.5** Đổi theme (`PATCH /api/v1/rooms/{roomId}/theme`)
- [ ] **7.6** Hiệu ứng phòng (`POST /api/v1/rooms/{roomId}/effects`)
- [ ] **7.7** Danh sách đen (`GET /api/v1/rooms/{roomId}/blacklist`)
- [ ] **7.8** Quản trị viên (`GET/POST/DELETE /api/v1/rooms/{roomId}/managers`)

### Phase 8: Boost System (Priority: LOW)
- [ ] **8.1** Danh sách thẻ boost (`GET /api/v1/rooms/{roomId}/boost/items`)
- [ ] **8.2** Danh sách gói boost (`GET /api/v1/rooms/{roomId}/boost/super-packages`)
- [ ] **8.3** Sử dụng thẻ boost (`POST /api/v1/rooms/{roomId}/boost/use-item`)
- [ ] **8.4** Mua gói boost (`POST /api/v1/rooms/{roomId}/boost/purchase`)
- [ ] **8.5** Lịch sử boost (`GET /api/v1/rooms/{roomId}/boost/history`)

### Phase 9: Challenge System (Priority: LOW)
- [ ] **9.1** Trạng thái thử thách (`GET /api/v1/rooms/{roomId}/challenge`)
- [ ] **9.2** Bắt đầu thử thách (`POST /api/v1/rooms/{roomId}/challenge/start`)
- [ ] **9.3** Gửi điểm (`POST /api/v1/rooms/{roomId}/challenge/progress`)
- [ ] **9.4** Danh sách rương (`GET /api/v1/rooms/{roomId}/challenge/chests`)
- [ ] **9.5** Mở rương (`POST /api/v1/rooms/{roomId}/challenge/chests/{chestId}/open`)
- [ ] **9.6** Phần thưởng host (`GET/POST /api/v1/rooms/{roomId}/challenge/host-reward`)
- [ ] **9.7** Top đóng góp (`GET /api/v1/rooms/{roomId}/challenge/contributors`)

### Phase 10: Leaderboard & Viewers (Priority: LOW)
- [ ] **10.1** Top theo ngày/tuần/tháng (`GET /api/v1/rooms/{roomId}/contributors/{period}`)
- [ ] **10.2** Danh sách người xem (`GET /api/v1/rooms/{roomId}/viewers`)
- [ ] **10.3** Top 3 người tặng quà (`GET /api/v1/rooms/{roomId}/viewers/top`)
- [ ] **10.4** Số lượng người xem (`GET /api/v1/rooms/{roomId}/viewers/count`)
- [ ] **10.5** Tìm kiếm người xem (`GET /api/v1/rooms/{roomId}/viewers/search`)

### Phase 11: Additional Features (Priority: LOW)
- [ ] **11.1** Mời bạn bè (`POST /api/v1/rooms/{roomId}/invite`)
- [ ] **11.2** Danh sách game (`GET /api/v1/rooms/{roomId}/games`)
- [ ] **11.3** Bắt đầu game (`POST /api/v1/rooms/{roomId}/games/start`)
- [ ] **11.4** Báo cáo phòng (`POST /api/v1/rooms/{roomId}/report`)
- [ ] **11.5** Music mode (`POST /api/v1/rooms/{roomId}/music/toggle`)
- [ ] **11.6** AI chat mode (`POST /api/v1/rooms/{roomId}/ai-mode/toggle`)
- [ ] **11.7** Banner quảng cáo (`GET /api/v1/ads?position=room_banner`)
- [ ] **11.8** Tìm kiếm phòng (`GET /api/v1/search?keyword={q}`)

---

## 📊 DATABASE SCHEMA SUGGESTIONS

### Table: rooms
```sql
CREATE TABLE rooms (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  mode VARCHAR(50) NOT NULL,
  labels JSON,
  is_protected BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  host_id VARCHAR(50) NOT NULL,
  max_participants INT DEFAULT 10,
  current_participants INT DEFAULT 0,
  layout_id VARCHAR(50) DEFAULT 'layout_1',
  background_id VARCHAR(50),
  theme VARCHAR(50) DEFAULT 'default',
  cover_url VARCHAR(500),
  description TEXT,
  notice TEXT,
  settings JSON,
  stats JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL,
  INDEX idx_host_id (host_id),
  INDEX idx_status (status),
  INDEX idx_mode (mode),
  INDEX idx_created_at (created_at)
);
```

### Table: room_participants
```sql
CREATE TABLE room_participants (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  room_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  seat_id INT,
  role VARCHAR(50) DEFAULT 'listener',
  is_muted BOOLEAN DEFAULT FALSE,
  is_camera_on BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP NULL,
  UNIQUE KEY unique_room_user (room_id, user_id),
  INDEX idx_room_id (room_id),
  INDEX idx_user_id (user_id),
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);
```

### Table: room_messages
```sql
CREATE TABLE room_messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  room_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(50),
  type VARCHAR(50) NOT NULL,
  content TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_room_id (room_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);
```

### Table: room_gifts
```sql
CREATE TABLE room_gifts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  room_id VARCHAR(50) NOT NULL,
  sender_id VARCHAR(50) NOT NULL,
  recipient_id VARCHAR(50) NOT NULL,
  gift_id VARCHAR(50) NOT NULL,
  quantity INT DEFAULT 1,
  total_cost INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_room_id (room_id),
  INDEX idx_sender_id (sender_id),
  INDEX idx_recipient_id (recipient_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);
```

### Table: room_seats
```sql
CREATE TABLE room_seats (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  room_id VARCHAR(50) NOT NULL,
  seat_id INT NOT NULL,
  user_id VARCHAR(50),
  locked BOOLEAN DEFAULT FALSE,
  UNIQUE KEY unique_room_seat (room_id, seat_id),
  INDEX idx_room_id (room_id),
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);
```

### Table: room_blacklist
```sql
CREATE TABLE room_blacklist (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  room_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_room_user (room_id, user_id),
  INDEX idx_room_id (room_id),
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);
```

### Table: room_managers
```sql
CREATE TABLE room_managers (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  room_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_room_user (room_id, user_id),
  INDEX idx_room_id (room_id),
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);
```

### Table: room_challenges
```sql
CREATE TABLE room_challenges (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  room_id VARCHAR(50) NOT NULL UNIQUE,
  level INT DEFAULT 1,
  current_points INT DEFAULT 0,
  required_points INT DEFAULT 100000,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);
```

### Table: room_boost_items
```sql
CREATE TABLE room_boost_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  item_id VARCHAR(50) NOT NULL,
  quantity INT DEFAULT 1,
  expire_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id)
);
```

### Table: room_boost_history
```sql
CREATE TABLE room_boost_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  room_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  boost_type VARCHAR(50) NOT NULL,
  duration_minutes INT NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  INDEX idx_room_id (room_id),
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);
```

---


## 🔧 TECHNICAL NOTES

### Authentication
- Tất cả API yêu cầu Bearer token trong header: `Authorization: Bearer {token}`
- Token được lấy từ hệ thống authentication hiện có
- WebSocket connections cũng yêu cầu token trong query string

### Rate Limiting
- API calls: **100 requests/minute** per user
- WebSocket messages: **10 messages/second** per user
- Gift sending: **5 gifts/minute** per user
- Room creation: **3 rooms/hour** per user

### Pagination
- Sử dụng cursor-based pagination cho messages
- Sử dụng offset-based pagination cho lists
- Default page size: 20 items
- Max page size: 100 items

### Real-time Updates
- Sử dụng WebSocket cho tất cả real-time events
- Fallback to polling nếu WebSocket không khả dụng
- Heartbeat interval: 30 seconds
- Auto-reconnect on disconnect

### Media Handling
- Tất cả media URLs là signed URLs với thời hạn 24 giờ
- Upload images: Max 5MB, formats: JPG, PNG, GIF
- Upload cover: Max 10MB, formats: JPG, PNG
- CDN caching: 1 hour for images, 24 hours for covers

### WebRTC Configuration
- STUN servers: `stun:stun.example.com:3478`
- TURN servers: `turn:turn.example.com:3478`
- Codec preference: Opus for audio, VP8/VP9 for video
- Bitrate: 32kbps for audio, 500kbps-2Mbps for video

### Password Security
- Room passwords: 4 digits (0000-9999)
- Hashed using bcrypt with salt rounds: 10
- Password attempts: Max 5 attempts per 5 minutes
- Lockout duration: 15 minutes after 5 failed attempts

### Data Retention
- Messages: 30 days
- Gift history: 90 days
- Room history: 180 days for active rooms, 30 days for closed rooms
- Viewer logs: 7 days
- Boost history: 365 days

### Performance Optimization
- Cache room info: 5 minutes
- Cache viewer count: 10 seconds
- Cache leaderboard: 1 minute
- Database indexes on: room_id, user_id, created_at
- Use Redis for real-time counters

### Error Handling
- Tất cả errors trả về format chuẩn:
```json
{
  "success": false,
  "error": {
    "code": "ROOM_NOT_FOUND",
    "message": "Room not found",
    "details": {}
  }
}
```

### Monitoring & Logging
- Log tất cả room creation/deletion
- Log tất cả gift transactions
- Log tất cả kick/block actions
- Monitor WebSocket connection count
- Monitor WebRTC connection quality
- Alert on high error rates

---

## 🎯 BUSINESS RULES

### Room Creation
- User phải có level >= 10 để tạo phòng
- Mỗi user chỉ được tạo tối đa 3 phòng active cùng lúc
- Room title: 3-50 ký tự
- Room password: 4 chữ số hoặc không có

### Room Participation
- Tối đa 10 người/phòng (1 host + 9 guests)
- User không thể join 2 phòng cùng lúc
- User bị blacklist không thể join lại phòng
- Auto-kick sau 5 phút không hoạt động (optional)

### Seats & Speaking
- Vị trí 1 luôn là host
- Host có thể assign/lock/unlock bất kỳ ghế nào
- User có thể tự join ghế trống nếu không bị lock
- Chỉ người ngồi ghế mới được bật mic
- Host có thể mute bất kỳ ai

### Gifts & Points
- Mỗi gift có giá trị coin khác nhau
- Host nhận 50% giá trị gift
- Platform nhận 50% giá trị gift
- Gift animation hiển thị trong 3 giây
- Top contributors được tính theo tổng giá trị gift

### Boost System
- Boost đẩy phòng lên top trong thời gian nhất định
- Có thể stack nhiều boost (cộng dồn thời gian)
- Boost items có thời hạn sử dụng
- Daily reward: 1 boost item 4 phút mỗi ngày

### Challenge System
- Mỗi phòng có 1 challenge riêng
- Points tăng khi nhận gift
- Mở rương khi đạt đủ points
- Host reward khi hoàn thành challenge
- Reset challenge khi đóng phòng (optional)

### Blacklist & Moderation
- Host có thể kick/block bất kỳ user nào
- Managers có thể kick nhưng không block
- Blacklist áp dụng vĩnh viễn cho phòng đó
- User có thể report phòng vi phạm

### Room Closure
- Host có thể đóng phòng bất kỳ lúc nào
- Phòng tự động đóng khi host leave
- Phòng tự động đóng sau 24 giờ không hoạt động
- Tất cả users bị kick out khi phòng đóng

---

## 📱 MOBILE APP CONSIDERATIONS

### iOS Specific
- Request microphone permission: `NSMicrophoneUsageDescription`
- Request camera permission: `NSCameraUsageDescription`
- Background audio: Enable "Audio, AirPlay, and Picture in Picture"
- CallKit integration for better UX

### Android Specific
- Request permissions: `RECORD_AUDIO`, `CAMERA`
- Foreground service for audio streaming
- Wake lock để giữ màn hình sáng
- Notification cho room đang active

### Network Handling
- Detect network changes và reconnect WebSocket
- Buffer messages khi offline
- Show network quality indicator
- Reduce quality khi network yếu

### Battery Optimization
- Reduce frame rate khi battery thấp
- Disable camera khi battery < 20%
- Optimize WebSocket heartbeat interval

---

## 🧪 TESTING CHECKLIST

### Unit Tests
- [ ] Room creation validation
- [ ] Password hashing/verification
- [ ] Seat assignment logic
- [ ] Gift calculation
- [ ] Challenge progress calculation
- [ ] Boost duration calculation

### Integration Tests
- [ ] Room lifecycle (create → join → leave → close)
- [ ] Message sending/receiving
- [ ] Gift sending/receiving
- [ ] WebSocket connection/disconnection
- [ ] WebRTC connection establishment

### Load Tests
- [ ] 100 concurrent rooms
- [ ] 1000 concurrent users
- [ ] 10,000 messages/second
- [ ] 1,000 gifts/second
- [ ] WebSocket connection stability

### Security Tests
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limiting effectiveness
- [ ] Password brute force protection
- [ ] Authorization checks

### UI/UX Tests
- [ ] Room creation flow
- [ ] Password entry flow
- [ ] Join room flow
- [ ] Chat functionality
- [ ] Gift sending animation
- [ ] Seat selection
- [ ] Settings modification

---

## 📚 ADDITIONAL RESOURCES

### Related Documentation
- [LIVESTREAM_API_DOCUMENTATION.md](./LIVESTREAM_API_DOCUMENTATION.md) - Livestream features
- [CHAT_ROOM_API_DOCUMENTATION.md](./CHAT_ROOM_API_DOCUMENTATION.md) - Chat room details

### External References
- WebRTC API: https://webrtc.org/
- Socket.IO: https://socket.io/docs/
- Redis: https://redis.io/documentation
- Opus Codec: https://opus-codec.org/

### Support Contacts
- Backend Team: backend@example.com
- DevOps Team: devops@example.com
- Product Team: product@example.com

---

## 📝 CHANGELOG

### Version 1.0.0 (2024-11-28)
- Initial API documentation
- Complete endpoint definitions
- WebSocket event specifications
- Database schema suggestions
- Implementation checklist

---

## ✅ SUMMARY

Tài liệu này bao gồm **TẤT CẢ** các API cần thiết để xây dựng hệ thống Room hoàn chỉnh:

### Tổng số API Endpoints: **100+**

**Phân loại theo chức năng:**
- Quản lý phòng cơ bản: 10 APIs
- Bảo mật & Truy cập: 11 APIs
- Quản lý thành viên: 10 APIs
- Chat & Tin nhắn: 9 APIs
- Chế độ phòng & Layout ghế: 10 APIs
- Thiết lập phòng: 18 APIs
- Đẩy phòng (Boost): 6 APIs
- Mời bạn bè: 4 APIs
- Thử thách phòng: 10 APIs
- Top người tặng quà: 5 APIs
- Danh sách người xem: 5 APIs
- Chức năng bổ sung: 12 APIs

**WebSocket Events:** 20+ events

**Database Tables:** 10 tables

**Implementation Phases:** 11 phases (từ HIGH đến LOW priority)

---

**🎉 Bạn có thể bắt đầu implement từ Phase 1 (Core Room Management) và tiến dần đến các phase khác!**
