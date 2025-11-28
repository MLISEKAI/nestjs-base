# Room API - Examples & Usage

## 📚 Tổng hợp ví dụ sử dụng API

### 1. Tạo phòng mới

```bash
POST /rooms
Content-Type: application/json

{
  "title": "From Hani With Love",
  "mode": "party",
  "labels": ["entertain", "chat"],
  "is_protected": true,
  "maxParticipants": 10
}
```

**Response:**
```json
{
  "room_id": "r987",
  "title": "From Hani With Love",
  "mode": "party",
  "labels": ["entertain", "chat"],
  "is_protected": true,
  "password_set": false,
  "status": "created",
  "host": {
    "id": "u123",
    "name": "Darlene Bears",
    "avatar": "https://cdn/avatar.png"
  },
  "maxParticipants": 10,
  "currentParticipants": 1,
  "createdAt": "2024-11-28T19:02:00Z"
}
```

---

### 2. Đặt mật khẩu phòng

```bash
POST /rooms/r987/password
Content-Type: application/json

{
  "password": "7777"
}
```

**Response:**
```json
{
  "room_id": "r987",
  "is_protected": true,
  "password_set": true,
  "status": "active"
}
```

---

### 3. Xác thực mật khẩu

```bash
POST /rooms/r987/verify-password
Content-Type: application/json

{
  "password": "7777"
}
```

**Response:**
```json
{
  "verified": true,
  "accessToken": "room_access_token_xyz",
  "expiresAt": "2024-11-28T23:02:00Z"
}
```

---

### 4. Join phòng

```bash
POST /rooms/r987/join
Content-Type: application/json

{
  "password": "7777"
}
```

**Response:**
```json
{
  "room_id": "r987",
  "join_status": "success",
  "slot_assigned": 3,
  "participantId": "participant_456",
  "isMuted": false,
  "isCameraOn": false,
  "webRtcToken": "webrtc_token_xyz",
  "chatWebSocketUrl": "wss://chat.example.com/rooms/r987",
  "voiceWebSocketUrl": "wss://voice.example.com/rooms/r987"
}
```

---

### 5. Lấy thông tin phòng

```bash
GET /rooms/r987
```

**Response:**
```json
{
  "room_id": "r987",
  "title": "From Hani With Love",
  "mode": "party",
  "labels": ["entertain", "chat"],
  "is_protected": true,
  "host": {
    "id": "u123",
    "name": "Darlene Bears",
    "avatar": "https://cdn/avatar.png"
  },
  "members_count": 5,
  "maxParticipants": 10,
  "status": "active",
  "slots": [
    {
      "slot": 1,
      "user": {
        "id": "u123",
        "name": "Darlene Bears",
        "avatar": "https://cdn/avatar.png"
      },
      "locked": false
    },
    { "slot": 2, "user": null, "locked": false },
    { "slot": 3, "user": null, "locked": false }
  ],
  "createdAt": "2024-11-28T19:00:00Z"
}
```

---

### 6. Gửi tin nhắn

```bash
POST /rooms/r987/messages
Content-Type: application/json

{
  "content": "Hello everyone!",
  "type": "text"
}
```

**Response:**
```json
{
  "messageId": "m789",
  "roomId": "r987",
  "userId": "u123",
  "username": "John Doe",
  "content": "Hello everyone!",
  "type": "text",
  "timestamp": "2024-11-28T19:05:00Z"
}
```

---

### 7. Gửi quà tặng

```bash
POST /rooms/r987/gifts
Content-Type: application/json

{
  "giftId": "gift_diamond",
  "recipientId": "u789",
  "quantity": 10
}
```

**Response:**
```json
{
  "giftId": "gift_diamond",
  "quantity": 10,
  "totalCost": 1000,
  "sender": { "userId": "u123" },
  "recipient": { "userId": "u789" },
  "timestamp": "2024-11-28T19:06:00Z"
}
```

---

### 8. Chọn chế độ phòng

```bash
POST /rooms/r987/set-mode
Content-Type: application/json

{
  "mode": "music"
}
```

**Response:**
```json
{
  "success": true,
  "room_id": "r987",
  "mode": "music",
  "updated_at": "2025-01-02T12:00:00Z"
}
```

---

### 9. Lấy danh sách layout ghế

```bash
GET /rooms/r987/seat-layouts
```

**Response:**
```json
{
  "room_id": "r987",
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
    }
  ]
}
```

---

### 10. Join ghế

```bash
POST /rooms/r987/seats/join
```

**Response:**
```json
{
  "success": true,
  "seat_id": 3
}
```

---

### 11. Sử dụng thẻ boost

```bash
POST /rooms/r987/boost/use-item
Content-Type: application/json

{
  "item_id": "boost_warmup_4"
}
```

**Response:**
```json
{
  "room_id": "r987",
  "item_id": "boost_warmup_4",
  "duration_minutes": 4,
  "status": "activated",
  "boost_end_at": "2025-01-16T00:04:00Z",
  "boosting": true,
  "remaining_seconds": 240
}
```

---

### 12. Lấy trạng thái thử thách

```bash
GET /rooms/r987/challenge
```

**Response:**
```json
{
  "level": 2,
  "currentPoints": 10000,
  "requiredPoints": 100000,
  "progressPercent": 10,
  "chests": [
    {
      "id": 1,
      "pointsRequired": 5000,
      "rewardPreview": ["avatar_frame", "gift_box"]
    },
    {
      "id": 2,
      "pointsRequired": 20000,
      "rewardPreview": ["badge", "coins"]
    }
  ],
  "hostReward": {
    "id": 1,
    "name": "Vòng ánh sáng tím",
    "pointsRequired": 987
  }
}
```

---

### 13. Top người tặng quà (daily)

```bash
GET /rooms/r987/contributors/daily
```

**Response:**
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

### 14. Danh sách người xem

```bash
GET /rooms/r987/viewers?page=1&pageSize=50
```

**Response:**
```json
{
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
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "hasMore": false
  }
}
```

---

### 15. Kick user

```bash
POST /rooms/r987/kick/u456
```

**Response:**
```json
{
  "success": true,
  "message": "User kicked"
}
```

---

### 16. Block user

```bash
POST /rooms/r987/block/u456
```

**Response:**
```json
{
  "success": true,
  "message": "User blocked"
}
```

---

### 17. Lấy danh sách phòng

```bash
GET /rooms?tab=follow&page=1&limit=20
```

**Response:**
```json
{
  "rooms": [
    {
      "room_id": "r001",
      "title": "Heloo ae",
      "mode": "game",
      "host": {
        "id": "u456",
        "name": "Livia Korsgaard",
        "avatar": "url"
      },
      "viewer_count": 8,
      "status": "active",
      "has_password": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "hasMore": true
  }
}
```

---

## 🔥 Các use case phổ biến

### Use Case 1: Tạo phòng có mật khẩu

1. Tạo phòng với `is_protected: true`
2. Đặt mật khẩu 4 số
3. Phòng chuyển sang trạng thái `active`

### Use Case 2: Join phòng có mật khẩu

1. Gọi `verify-password` để kiểm tra mật khẩu
2. Nhận `accessToken`
3. Gọi `join` với `accessToken` hoặc `password`
4. Nhận WebRTC token và WebSocket URLs

### Use Case 3: Gửi quà trong phòng

1. User join phòng
2. Chọn quà và người nhận
3. Gọi API `send-gift`
4. Hệ thống trừ coin và cập nhật stats

### Use Case 4: Quản lý ghế

1. Host chọn layout ghế (4 layouts)
2. User bấm "Join the mic" → gọi `seats/join`
3. Hoặc host kéo user vào ghế → gọi `seats/assign`
4. Host có thể lock/unlock ghế

### Use Case 5: Boost phòng

1. Lấy danh sách thẻ boost của user
2. Chọn thẻ và sử dụng
3. Phòng được đẩy lên top trong thời gian boost
4. Hết thời gian tự động kết thúc

---

## 🎯 Error Handling

### Common Errors

```json
// 404 - Room not found
{
  "statusCode": 404,
  "message": "Room not found",
  "error": "Not Found"
}

// 403 - Forbidden
{
  "statusCode": 403,
  "message": "Only host can perform this action",
  "error": "Forbidden"
}

// 401 - Wrong password
{
  "statusCode": 401,
  "message": "Incorrect password",
  "error": "Unauthorized"
}

// 400 - Validation error
{
  "statusCode": 400,
  "message": ["title must be longer than or equal to 3 characters"],
  "error": "Bad Request"
}
```

---

## 📊 Swagger UI

Sau khi chạy server, truy cập Swagger UI tại:

```
http://localhost:3000/api
```

Swagger UI cung cấp:
- Danh sách tất cả endpoints
- Ví dụ request/response
- Try it out để test trực tiếp
- Schema definitions

---

## 🔐 Authentication

Hiện tại code dùng mock `user_id = 'user_123'`. 

Để thêm JWT authentication:

1. Thêm `@UseGuards(JwtAuthGuard)` vào controllers
2. Lấy user từ `req.user` thay vì mock
3. Thêm `@ApiBearerAuth()` vào Swagger decorators

Example:
```typescript
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Post()
async createRoom(@Request() req, @Body() dto: CreateRoomDto) {
  const userId = req.user.id; // From JWT
  return this.roomService.createRoom(userId, dto);
}
```
