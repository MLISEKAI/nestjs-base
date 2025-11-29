# 💬📇 Send Message & Business Card API Documentation

Tài liệu API cho tính năng Send Message (Gửi tin nhắn) và Send Business Card (Gửi danh thiếp) trong hệ thống Messaging. Tài liệu này cung cấp các endpoints và JSON response mẫu để frontend và backend sử dụng thống nhất.

---

## 📋 Bảng Components

| Component             | Type    | API Endpoint                              | Notes                                                           |
| --------------------- | ------- | ----------------------------------------- | --------------------------------------------------------------- |
| Send Message Button   | Button  | -                                         | Button trong input bar để gửi text message                      |
| Send Business Card    | Button  | `POST /messages/:conversationId/messages` | Button "Gửi danh thiếp" để gửi profile card                     |
| Text Message          | Message | `POST /messages/:conversationId/messages` | Gửi text message (type: text)                                   |
| Video Message         | Message | `POST /messages/:conversationId/messages` | Gửi video message (type: video)                                 |
| Business Card Message | Message | `POST /messages/:conversationId/messages` | Gửi business card/profile card (type: business_card)            |
| Profile Card          | Card    | -                                         | Component hiển thị user profile trong chat                      |
| View Profile Button   | Button  | `GET /users/:userId`                      | Button trong profile card để xem profile                        |
| Add Friend Button     | Button  | `POST /users/:userId/friends`             | Button trong profile card để add friend                         |
| Message Input Bar     | Input   | -                                         | Input field với icons: camera, gallery, microphone, emoji, gift |
| Send Icon             | Icon    | -                                         | Icon hiển thị khi có text hoặc media selected                   |

---

## 🔌 API Endpoints

| Method | Endpoint                                    | Response                      | Note                                                   |
| ------ | ------------------------------------------- | ----------------------------- | ------------------------------------------------------ |
| POST   | `/messages/:conversationId/messages`        | `MessageResponse`             | Gửi message mới (text/image/video/audio/business_card) |
| POST   | `/messages/:conversationId/messages` (card) | `BusinessCardMessageResponse` | Gửi business card message                              |
| GET    | `/users/:userId`                            | `UserProfileResponse`         | Lấy thông tin user profile để tạo business card        |
| POST   | `/users/:userId/friends`                    | `AddFriendResponse`           | Add friend từ business card                            |
| GET    | `/users/:userId/friends/status`             | `FriendshipStatusResponse`    | Kiểm tra friendship status                             |
| POST   | `/upload/media`                             | `UploadMediaResponse`         | Upload media files trước khi gửi message               |

---

## 📦 JSON Response Examples

### 1. POST /messages/:conversationId/messages - Send Text Message Request & Response

**Request Body:**

```json
{
  "content": "So beautiful",
  "type": "text"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "msg-201",
    "conversationId": "conv-123",
    "senderId": "current-user",
    "senderName": "You",
    "senderAvatar": "https://example.com/my-avatar.jpg",
    "content": "So beautiful",
    "type": "text",
    "mediaUrl": null,
    "mediaThumbnail": null,
    "mediaSize": null,
    "mediaDuration": null,
    "isRead": false,
    "createdAt": "2025-01-15T23:30:00Z",
    "updatedAt": "2025-01-15T23:30:00Z"
  },
  "timestamp": "2025-01-15T23:30:00Z"
}
```

### 2. POST /messages/:conversationId/messages - Send Video Message Request & Response

**Request Body:**

```json
{
  "type": "video",
  "mediaUrl": "https://example.com/video1.mp4",
  "mediaThumbnail": "https://example.com/video-thumb1.jpg",
  "mediaSize": 10485760,
  "mediaDuration": 9
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "msg-202",
    "conversationId": "conv-123",
    "senderId": "current-user",
    "senderName": "You",
    "senderAvatar": "https://example.com/my-avatar.jpg",
    "content": null,
    "type": "video",
    "mediaUrl": "https://example.com/video1.mp4",
    "mediaThumbnail": "https://example.com/video-thumb1.jpg",
    "mediaSize": 10485760,
    "mediaDuration": 9,
    "isRead": false,
    "createdAt": "2025-01-15T23:50:00Z",
    "updatedAt": "2025-01-15T23:50:00Z"
  },
  "timestamp": "2025-01-15T23:50:00Z"
}
```

### 3. POST /messages/:conversationId/messages - Send Business Card Request & Response

**Request Body:**

```json
{
  "type": "business_card",
  "userId": "user-2",
  "cardData": {
    "nickname": "Mira Lipshutz",
    "avatar": "https://example.com/avatar2.jpg",
    "friendCount": 120,
    "bio": "Striving for excellence, embracing challenges...",
    "isOnline": true,
    "status": "Active"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "msg-203",
    "conversationId": "conv-123",
    "senderId": "current-user",
    "senderName": "You",
    "senderAvatar": "https://example.com/my-avatar.jpg",
    "content": null,
    "type": "business_card",
    "businessCard": {
      "userId": "user-2",
      "nickname": "Mira Lipshutz",
      "avatar": "https://example.com/avatar2.jpg",
      "friendCount": 120,
      "bio": "Striving for excellence, embracing challenges...",
      "isOnline": true,
      "status": "Active",
      "type": "premium",
      "typeIcon": "P",
      "mutualFriends": 5,
      "friendshipStatus": "none",
      "canAddFriend": true,
      "canViewProfile": true
    },
    "isRead": false,
    "createdAt": "2025-01-16T00:00:00Z",
    "updatedAt": "2025-01-16T00:00:00Z"
  },
  "timestamp": "2025-01-16T00:00:00Z"
}
```

### 4. GET /users/:userId - User Profile for Business Card Response

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "user-2",
    "nickname": "Mira Lipshutz",
    "avatar": "https://example.com/avatar2.jpg",
    "bio": "Striving for excellence, embracing challenges and opportunities with determination.",
    "isOnline": true,
    "status": "Active",
    "type": "premium",
    "typeIcon": "P",
    "typeIconColor": "pink",
    "friendCount": 120,
    "mutualFriends": 5,
    "lastSeen": "2025-01-16T00:00:00Z",
    "friendshipStatus": "none",
    "canAddFriend": true,
    "canViewProfile": true,
    "isBlocked": false,
    "isBlockedBy": false
  },
  "timestamp": "2025-01-16T00:00:00Z"
}
```

### 5. POST /users/:userId/friends - Add Friend from Business Card Request & Response

**Request Body:**

```json
{
  "source": "business_card",
  "messageId": "msg-203"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "friendshipId": "friendship-123",
    "userId": "user-2",
    "userName": "Mira Lipshutz",
    "status": "pending",
    "requestedAt": "2025-01-16T00:01:00Z"
  },
  "message": "Friend request sent successfully",
  "timestamp": "2025-01-16T00:01:00Z"
}
```

**Note:** Nếu user đã là friend, status sẽ là "accepted" và không cần request.

### 6. GET /users/:userId/friends/status - Friendship Status Response

**Response:**

```json
{
  "success": true,
  "data": {
    "userId": "user-2",
    "userName": "Mira Lipshutz",
    "friendshipStatus": "none",
    "canAddFriend": true,
    "canViewProfile": true,
    "mutualFriends": 5
  },
  "timestamp": "2025-01-16T00:00:00Z"
}
```

**Friendship Status Values:**

- `none` - Not friends, can send request
- `pending` - Friend request pending (sent by current user)
- `requested` - Friend request received (from other user)
- `accepted` - Friends
- `blocked` - User is blocked

### 7. GET /messages/:conversationId/messages - Messages with Business Card Response

**Response:**

```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg-101",
        "conversationId": "conv-123",
        "senderId": "user-1",
        "senderName": "Abram Mango",
        "senderAvatar": "https://example.com/avatar1.jpg",
        "content": "So beautiful",
        "type": "text",
        "isRead": true,
        "createdAt": "2025-01-15T23:30:00Z"
      },
      {
        "id": "msg-102",
        "conversationId": "conv-123",
        "senderId": "user-1",
        "senderName": "Abram Mango",
        "senderAvatar": "https://example.com/avatar1.jpg",
        "content": "Thank you! You are great too",
        "type": "text",
        "isRead": true,
        "createdAt": "2025-01-15T23:30:15Z"
      },
      {
        "id": "msg-103",
        "conversationId": "conv-123",
        "senderId": "current-user",
        "senderName": "You",
        "senderAvatar": "https://example.com/my-avatar.jpg",
        "content": "So beautiful",
        "type": "text",
        "isRead": true,
        "createdAt": "2025-01-15T23:30:30Z"
      },
      {
        "id": "msg-104",
        "conversationId": "conv-123",
        "senderId": "current-user",
        "senderName": "You",
        "senderAvatar": "https://example.com/my-avatar.jpg",
        "content": "Thank you! You are great too",
        "type": "text",
        "isRead": true,
        "createdAt": "2025-01-15T23:30:45Z"
      },
      {
        "id": "msg-105",
        "conversationId": "conv-123",
        "senderId": "current-user",
        "senderName": "You",
        "senderAvatar": "https://example.com/my-avatar.jpg",
        "content": "Wonderful",
        "type": "text",
        "isRead": true,
        "createdAt": "2025-01-15T23:31:00Z"
      },
      {
        "id": "msg-106",
        "conversationId": "conv-123",
        "senderId": "current-user",
        "senderName": "You",
        "senderAvatar": "https://example.com/my-avatar.jpg",
        "content": null,
        "type": "business_card",
        "businessCard": {
          "userId": "user-2",
          "nickname": "Mira Lipshutz",
          "avatar": "https://example.com/avatar2.jpg",
          "friendCount": 120,
          "bio": "Striving for excellence, embracing challenges...",
          "isOnline": true,
          "status": "Active",
          "type": "premium",
          "typeIcon": "P",
          "mutualFriends": 5,
          "friendshipStatus": "none",
          "canAddFriend": true,
          "canViewProfile": true
        },
        "isRead": true,
        "createdAt": "2025-01-16T00:00:00Z"
      },
      {
        "id": "msg-107",
        "conversationId": "conv-123",
        "senderId": "current-user",
        "senderName": "You",
        "senderAvatar": "https://example.com/my-avatar.jpg",
        "content": "You're great",
        "type": "text",
        "isRead": true,
        "createdAt": "2025-01-16T00:00:15Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 107,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "timestamp": "2025-01-15T19:02:00Z"
}
```

### 8. POST /upload/media - Upload Video for Message Request & Response

**Request:** `multipart/form-data`

**Form Data:**

- `file` - Video file
- `type` - `video`
- `conversationId` (optional) - Pre-associate with conversation

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "media-201",
    "url": "https://example.com/uploads/video1.mp4",
    "thumbnail": "https://example.com/uploads/thumb_video1.jpg",
    "type": "video",
    "size": 10485760,
    "width": 1920,
    "height": 1080,
    "duration": 9,
    "createdAt": "2025-01-15T23:49:00Z"
  },
  "message": "Media uploaded successfully",
  "timestamp": "2025-01-15T23:49:00Z"
}
```

---

## 🔄 WebSocket Events

### New Message Event

**Event:** `new_message`

**Payload:**

```json
{
  "id": "msg-201",
  "conversationId": "conv-123",
  "senderId": "current-user",
  "senderName": "You",
  "senderAvatar": "https://example.com/my-avatar.jpg",
  "content": "So beautiful",
  "type": "text",
  "isRead": false,
  "createdAt": "2025-01-15T23:30:00Z"
}
```

### Business Card Message Event

**Event:** `new_message`

**Payload:**

```json
{
  "id": "msg-203",
  "conversationId": "conv-123",
  "senderId": "current-user",
  "senderName": "You",
  "senderAvatar": "https://example.com/my-avatar.jpg",
  "content": null,
  "type": "business_card",
  "businessCard": {
    "userId": "user-2",
    "nickname": "Mira Lipshutz",
    "avatar": "https://example.com/avatar2.jpg",
    "friendCount": 120,
    "isOnline": true,
    "status": "Active",
    "friendshipStatus": "none",
    "canAddFriend": true
  },
  "isRead": false,
  "createdAt": "2025-01-16T00:00:00Z"
}
```

### Friend Request Sent Event

**Event:** `friend_request_sent`

**Payload:**

```json
{
  "friendshipId": "friendship-123",
  "fromUserId": "current-user",
  "toUserId": "user-2",
  "toUserName": "Mira Lipshutz",
  "status": "pending",
  "sentAt": "2025-01-16T00:01:00Z"
}
```

---

## 📝 Request/Response Types

### Message Types

- `text` - Text message
- `image` - Image message
- `video` - Video message
- `audio` - Audio message
- `business_card` - Business card/profile card message
- `gift` - Gift message
- `file` - File attachment

### Friendship Status

- `none` - Not friends, can send request
- `pending` - Friend request pending (sent by current user)
- `requested` - Friend request received (from other user)
- `accepted` - Friends
- `blocked` - User is blocked

### User Types

- `premium` - Premium user (P icon, pink)
- `male` - Male user (♂ icon, blue)
- `female` - Female user (♀ icon, pink)
- `vip` - VIP user (👑 icon, gold)

---

## 🔐 Authentication

Tất cả các endpoints yêu cầu authentication token trong header:

```
Authorization: Bearer {jwt_token}
```

---

## ⚠️ Error Responses

### Standard Error Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message description",
    "details": {}
  },
  "timestamp": "2025-01-15T19:02:00Z"
}
```

### Common Error Codes

- `UNAUTHORIZED` - Missing or invalid token
- `FORBIDDEN` - User doesn't have permission
- `NOT_FOUND` - Resource not found (conversation, user)
- `VALIDATION_ERROR` - Request validation failed
- `USER_BLOCKED` - User is blocked or has blocked you
- `ALREADY_FRIENDS` - Users are already friends
- `FRIEND_REQUEST_EXISTS` - Friend request already exists
- `CANNOT_ADD_SELF` - Cannot add yourself as friend
- `MEDIA_UPLOAD_FAILED` - Media upload failed
- `INVALID_MEDIA_TYPE` - Invalid media type
- `MEDIA_SIZE_EXCEEDED` - Media file size exceeds limit
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_SERVER_ERROR` - Server error

---

## 📊 Pagination

Các list endpoints hỗ trợ pagination với query parameters:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 100)
- `sort` - Sort field (default: `createdAt`)
- `order` - Sort order: `asc` or `desc` (default: `desc`)

**Example:**

```
GET /messages/:conversationId/messages?page=1&limit=50&sort=createdAt&order=desc
```

---

## 🎯 Notes

1. **Business Card**: Business card message chứa thông tin user profile để share trong chat
2. **Friend Count**: Friend count được hiển thị trong business card (e.g., "120 friend")
3. **Add Friend**: User có thể add friend trực tiếp từ business card
4. **View Profile**: User có thể view profile từ business card
5. **Friendship Status**: Business card hiển thị friendship status và enable/disable buttons accordingly
6. **Video Messages**: Video messages có thumbnail và duration
7. **Message Ordering**: Messages được sắp xếp theo `createdAt` descending (newest first)
8. **Timestamps**: Messages được group theo timestamps (e.g., "23:30", "23:50", "Today")
9. **Read Status**: Message read status được update khi user xem conversation
10. **Media Upload**: Media files phải upload trước khi gửi message

---

## 🎨 UI Flow Documentation

### Send Text Message Flow

1. **Type Message**
   - User type trong input field
   - Send icon hiển thị khi có text

2. **Send Message**
   - User click send icon hoặc press Enter
   - Frontend gọi `POST /messages/:conversationId/messages` với `type: "text"`
   - Message hiển thị trong chat với pink bubble (right-aligned)
   - WebSocket emit `new_message` event

### Send Video Message Flow

1. **Select Video**
   - User click gallery icon
   - Frontend mở video picker
   - User select video

2. **Upload Video**
   - Frontend upload video qua `POST /upload/media`
   - Backend trả về `mediaUrl`, `thumbnail`, và `duration`

3. **Send Video**
   - Frontend gọi `POST /messages/:conversationId/messages` với video data
   - Video message hiển thị với thumbnail và play button
   - Duration hiển thị ở bottom-right corner

### Send Business Card Flow

1. **Open Business Card**
   - User click "Gửi danh thiếp" button trong header hoặc menu
   - Frontend có thể hiển thị user picker hoặc suggest recent contacts

2. **Select User**
   - User select user để share
   - Frontend gọi `GET /users/:userId` để lấy profile data

3. **Send Business Card**
   - Frontend gọi `POST /messages/:conversationId/messages` với `type: "business_card"`
   - Business card hiển thị trong chat với:
     - User avatar
     - User name
     - Friend count (e.g., "120 friend")
     - "View profile" button
     - "Add friend" button (nếu chưa là friend)

4. **Interact with Business Card**
   - User click "View profile" → Navigate to user profile
   - User click "Add friend" → Frontend gọi `POST /users/:userId/friends`
   - Button state update dựa trên friendship status

### Business Card Interaction Flow

1. **View Profile**
   - User click "View profile" trong business card
   - Frontend navigate đến user profile screen
   - Hoặc mở profile modal

2. **Add Friend**
   - User click "Add friend" trong business card
   - Frontend gọi `POST /users/:userId/friends`
   - Button text change thành "Requested" hoặc "Friends"
   - WebSocket emit `friend_request_sent` event

---

## 🔄 Integration with Main Messaging API

### Message Types Integration

Business card message được xử lý như một message type đặc biệt:

```json
{
  "type": "business_card",
  "businessCard": {
    "userId": "user-2",
    "nickname": "Mira Lipshutz",
    "avatar": "https://example.com/avatar2.jpg",
    "friendCount": 120
  }
}
```

### Friendship Status in Business Card

Business card hiển thị friendship status và enable/disable buttons:

- `none` → Show "Add friend" button
- `pending` → Show "Requested" (disabled)
- `requested` → Show "Accept" button
- `accepted` → Show "Friends" (disabled)
- `blocked` → Hide buttons

### Video Message Display

Video messages hiển thị với:

- Thumbnail image
- Play button overlay
- Duration badge (bottom-right)
- Loading state khi đang upload

---

**Version:** 1.0  
**Last Updated:** 2025-01-16  
**Status:** ✅ Ready for Implementation
