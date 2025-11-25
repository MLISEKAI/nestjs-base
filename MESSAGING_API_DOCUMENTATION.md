# 📱 Messaging API Documentation

Tài liệu API cho hệ thống Messaging dựa trên UI design. Tài liệu này cung cấp các endpoints và JSON response mẫu để frontend và backend sử dụng thống nhất.

---

## 📋 Bảng Components

| Component          | Type   | API Endpoint                                                                          | Notes                                                                                 |
| ------------------ | ------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Messages List      | Screen | `GET /messages`                                                                       | Hiển thị danh sách cuộc trò chuyện với categories, unread count, last message preview |
| Message Categories | Filter | `GET /messages/categories`                                                            | Lấy danh sách categories (Family, Wedding, Favourite, Matching)                       |
| Conversation Item  | Item   | -                                                                                     | Component hiển thị trong list, không có endpoint riêng                                |
| Swipe Actions      | Action | `PATCH /messages/:conversationId/notifications`<br>`DELETE /messages/:conversationId` | Turn off notifications hoặc Delete conversation                                       |
| Search Messages    | Screen | `GET /messages/search`                                                                | Tìm kiếm trong messenger với suggestions                                              |
| Chat Screen        | Screen | `GET /messages/:conversationId`                                                       | Hiển thị chi tiết cuộc trò chuyện với messages                                        |
| Message List       | List   | `GET /messages/:conversationId/messages`                                              | Lấy danh sách messages trong conversation (pagination)                                |
| Send Message       | Action | `POST /messages/:conversationId/messages`                                             | Gửi message (text, image, video, audio)                                               |
| Upload Media       | Action | `POST /upload/media`                                                                  | Upload media files (image, video) trước khi gửi message                               |
| Media Gallery      | Screen | `GET /messages/:conversationId/media?type={image\|video}`                             | Lấy danh sách media trong conversation (grid view)                                    |
| Voice Recorder     | Action | `POST /messages/:conversationId/messages` (type: audio)                               | Gửi voice message với waveform data                                                   |
| Typing Indicator   | Action | `POST /messages/:conversationId/typing`                                               | Gửi typing indicator khi user đang gõ                                                 |
| User Status        | Info   | `GET /users/:userId/status`                                                           | Lấy trạng thái online/offline của user                                                |
| Suggested Contacts | List   | `GET /messages/suggestions`                                                           | Lấy danh sách suggested contacts cho search                                           |

---

## 🔌 API Endpoints

| Method | Endpoint                                  | Response                     | Note                                                   |
| ------ | ----------------------------------------- | ---------------------------- | ------------------------------------------------------ |
| GET    | `/messages`                               | `MessagesListResponse`       | Lấy danh sách conversations với filters và pagination  |
| GET    | `/messages/categories`                    | `CategoriesResponse`         | Lấy danh sách categories để filter                     |
| GET    | `/messages/search?q={query}`              | `SearchResponse`             | Tìm kiếm conversations và contacts                     |
| GET    | `/messages/suggestions`                   | `SuggestionsResponse`        | Lấy suggested contacts cho search screen               |
| GET    | `/messages/:conversationId`               | `ConversationDetailResponse` | Lấy thông tin chi tiết conversation                    |
| GET    | `/messages/:conversationId/messages`      | `MessagesResponse`           | Lấy danh sách messages trong conversation (pagination) |
| POST   | `/messages/:conversationId/messages`      | `MessageResponse`            | Gửi message mới (text/image/video/audio)               |
| POST   | `/upload/media`                           | `UploadMediaResponse`        | Upload media files (image/video)                       |
| GET    | `/messages/:conversationId/media`         | `MediaGalleryResponse`       | Lấy danh sách media trong conversation                 |
| POST   | `/messages/:conversationId/typing`        | `TypingIndicatorResponse`    | Gửi typing indicator                                   |
| PATCH  | `/messages/:conversationId/notifications` | `UpdateNotificationResponse` | Bật/tắt notifications cho conversation                 |
| DELETE | `/messages/:conversationId`               | `DeleteConversationResponse` | Xóa conversation                                       |
| PATCH  | `/messages/:conversationId/read`          | `MarkReadResponse`           | Đánh dấu đã đọc messages                               |
| GET    | `/users/:userId/status`                   | `UserStatusResponse`         | Lấy trạng thái online/offline của user                 |
| POST   | `/messages`                               | `CreateConversationResponse` | Tạo conversation mới với user khác                     |

---

## 📦 JSON Response Examples

### 1. GET /messages - Messages List Response

```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "conv-123",
        "type": "direct",
        "participants": [
          {
            "id": "user-1",
            "nickname": "Family",
            "avatar": "https://example.com/avatar1.jpg",
            "isOnline": true,
            "lastSeen": "2025-01-15T10:30:00Z"
          }
        ],
        "lastMessage": {
          "id": "msg-456",
          "content": "Lorem Ipsum has been",
          "type": "text",
          "senderId": "user-1",
          "senderName": "Family",
          "createdAt": "2025-01-15T19:00:00Z",
          "isRead": false
        },
        "unreadCount": 2,
        "updatedAt": "2025-01-15T19:00:00Z",
        "category": "family",
        "isMuted": false,
        "isPinned": false
      },
      {
        "id": "conv-124",
        "type": "direct",
        "participants": [
          {
            "id": "user-2",
            "nickname": "Lindsey Herwitz",
            "avatar": "https://example.com/avatar2.jpg",
            "isOnline": false,
            "lastSeen": "2025-01-15T18:55:00Z"
          }
        ],
        "lastMessage": {
          "id": "msg-457",
          "content": "Lorem Ipsum has",
          "type": "text",
          "senderId": "user-2",
          "senderName": "Lindsey Herwitz",
          "createdAt": "2025-01-15T18:55:00Z",
          "isRead": false
        },
        "unreadCount": 1,
        "updatedAt": "2025-01-15T18:55:00Z",
        "category": null,
        "isMuted": false,
        "isPinned": false
      },
      {
        "id": "conv-125",
        "type": "direct",
        "participants": [
          {
            "id": "user-3",
            "nickname": "Roof",
            "avatar": "https://example.com/avatar3.jpg",
            "isOnline": true,
            "lastSeen": "2025-01-15T17:00:00Z"
          }
        ],
        "lastMessage": {
          "id": "msg-458",
          "content": "Roof đã gửi cho bạn 1 ảnh",
          "type": "image",
          "senderId": "user-3",
          "senderName": "Roof",
          "createdAt": "2025-01-15T17:00:00Z",
          "isRead": true,
          "mediaUrl": "https://example.com/image.jpg"
        },
        "unreadCount": 0,
        "updatedAt": "2025-01-15T17:00:00Z",
        "category": null,
        "isMuted": false,
        "isPinned": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    },
    "unreadTotal": 3
  },
  "timestamp": "2025-01-15T19:02:00Z"
}
```

### 2. GET /messages/categories - Categories Response

```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "family",
        "name": "Family",
        "icon": "gift-box",
        "color": "#FF69B4",
        "count": 5,
        "isActive": true
      },
      {
        "id": "wedding",
        "name": "Wedding",
        "icon": "ring-box",
        "color": "#FFD700",
        "count": 3,
        "isActive": false
      },
      {
        "id": "favourite",
        "name": "Favourite",
        "icon": "game-controller",
        "color": "#9370DB",
        "count": 8,
        "isActive": false
      },
      {
        "id": "matching",
        "name": "Matching",
        "icon": "heart",
        "color": "#FF1493",
        "count": 12,
        "isActive": false
      }
    ]
  },
  "timestamp": "2025-01-15T19:02:00Z"
}
```

### 3. GET /messages/search?q=search_term - Search Response

```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "conv-123",
        "type": "direct",
        "participants": [
          {
            "id": "user-1",
            "nickname": "Leo Herwitz",
            "avatar": "https://example.com/avatar1.jpg",
            "isOnline": true
          }
        ],
        "lastMessage": {
          "id": "msg-456",
          "content": "Striving for excellence, embracing...",
          "type": "text",
          "createdAt": "2025-01-15T18:00:00Z"
        },
        "isLocked": true,
        "updatedAt": "2025-01-15T18:00:00Z"
      }
    ],
    "contacts": [
      {
        "id": "user-2",
        "nickname": "Marley Schleifer",
        "avatar": "https://example.com/avatar2.jpg",
        "bio": "Striving for excellence, embracing challenges...",
        "isOnline": false,
        "isFavourite": true,
        "hasConversation": false
      },
      {
        "id": "user-3",
        "nickname": "Leo Herwitz",
        "avatar": "https://example.com/avatar3.jpg",
        "bio": "Striving for excellence, embracing challenges...",
        "isOnline": true,
        "isFavourite": false,
        "hasConversation": true,
        "conversationId": "conv-124"
      }
    ],
    "messages": [
      {
        "id": "msg-789",
        "conversationId": "conv-123",
        "content": "Search term found in message",
        "type": "text",
        "senderId": "user-1",
        "senderName": "Leo Herwitz",
        "createdAt": "2025-01-15T17:00:00Z",
        "highlight": "Search term"
      }
    ]
  },
  "timestamp": "2025-01-15T19:02:00Z"
}
```

### 4. GET /messages/suggestions - Suggestions Response

```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "id": "user-1",
        "nickname": "Leo Herwitz",
        "avatar": "https://example.com/avatar1.jpg",
        "bio": "Striving for excellence, embracing challenges...",
        "isOnline": true,
        "isLocked": true,
        "mutualFriends": 5,
        "hasConversation": false
      },
      {
        "id": "user-2",
        "nickname": "Marley Schleifer",
        "avatar": "https://example.com/avatar2.jpg",
        "bio": "Striving for excellence, embracing challenges...",
        "isOnline": false,
        "isFavourite": true,
        "mutualFriends": 3,
        "hasConversation": true,
        "conversationId": "conv-125"
      }
    ]
  },
  "timestamp": "2025-01-15T19:02:00Z"
}
```

### 5. GET /messages/:conversationId - Conversation Detail Response

```json
{
  "success": true,
  "data": {
    "id": "conv-123",
    "type": "direct",
    "participants": [
      {
        "id": "user-1",
        "nickname": "Abram Mango",
        "avatar": "https://example.com/avatar1.jpg",
        "isOnline": true,
        "status": "Active",
        "lastSeen": "2025-01-15T19:02:00Z"
      }
    ],
    "createdAt": "2025-01-10T10:00:00Z",
    "updatedAt": "2025-01-15T23:30:00Z",
    "isMuted": false,
    "isPinned": false,
    "unreadCount": 0,
    "settings": {
      "notificationsEnabled": true,
      "autoDelete": false
    }
  },
  "timestamp": "2025-01-15T19:02:00Z"
}
```

### 6. GET /messages/:conversationId/messages - Messages Response

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
        "content": null,
        "type": "image",
        "mediaUrl": "https://example.com/image1.jpg",
        "mediaThumbnail": "https://example.com/thumb1.jpg",
        "mediaSize": 1024000,
        "mediaDuration": null,
        "isRead": true,
        "createdAt": "2025-01-15T23:30:00Z",
        "updatedAt": "2025-01-15T23:30:00Z"
      },
      {
        "id": "msg-102",
        "conversationId": "conv-123",
        "senderId": "user-1",
        "senderName": "Abram Mango",
        "senderAvatar": "https://example.com/avatar1.jpg",
        "content": null,
        "type": "image",
        "mediaUrl": "https://example.com/image2.jpg",
        "mediaThumbnail": "https://example.com/thumb2.jpg",
        "mediaSize": 2048000,
        "mediaDuration": null,
        "isRead": true,
        "createdAt": "2025-01-15T23:30:15Z",
        "updatedAt": "2025-01-15T23:30:15Z"
      },
      {
        "id": "msg-103",
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
        "isRead": true,
        "createdAt": "2025-01-15T23:30:30Z",
        "updatedAt": "2025-01-15T23:30:30Z"
      },
      {
        "id": "msg-104",
        "conversationId": "conv-123",
        "senderId": "user-1",
        "senderName": "Abram Mango",
        "senderAvatar": "https://example.com/avatar1.jpg",
        "content": "Thank you! You are great too",
        "type": "text",
        "mediaUrl": null,
        "mediaThumbnail": null,
        "mediaSize": null,
        "mediaDuration": null,
        "isRead": true,
        "createdAt": "2025-01-15T23:30:45Z",
        "updatedAt": "2025-01-15T23:30:45Z"
      },
      {
        "id": "msg-105",
        "conversationId": "conv-123",
        "senderId": "user-1",
        "senderName": "Abram Mango",
        "senderAvatar": "https://example.com/avatar1.jpg",
        "content": null,
        "type": "video",
        "mediaUrl": "https://example.com/video1.mp4",
        "mediaThumbnail": "https://example.com/video-thumb1.jpg",
        "mediaSize": 10485760,
        "mediaDuration": 8,
        "isRead": true,
        "createdAt": "2025-01-15T23:31:00Z",
        "updatedAt": "2025-01-15T23:31:00Z"
      },
      {
        "id": "msg-106",
        "conversationId": "conv-123",
        "senderId": "current-user",
        "senderName": "You",
        "senderAvatar": "https://example.com/my-avatar.jpg",
        "content": "Wonderful",
        "type": "text",
        "mediaUrl": null,
        "mediaThumbnail": null,
        "mediaSize": null,
        "mediaDuration": null,
        "isRead": true,
        "createdAt": "2025-01-15T23:31:15Z",
        "updatedAt": "2025-01-15T23:31:15Z"
      },
      {
        "id": "msg-107",
        "conversationId": "conv-123",
        "senderId": "current-user",
        "senderName": "You",
        "senderAvatar": "https://example.com/my-avatar.jpg",
        "content": "You're great",
        "type": "text",
        "mediaUrl": null,
        "mediaThumbnail": null,
        "mediaSize": null,
        "mediaDuration": null,
        "isRead": true,
        "createdAt": "2025-01-15T23:31:30Z",
        "updatedAt": "2025-01-15T23:31:30Z"
      },
      {
        "id": "msg-108",
        "conversationId": "conv-123",
        "senderId": "user-1",
        "senderName": "Abram Mango",
        "senderAvatar": "https://example.com/avatar1.jpg",
        "content": null,
        "type": "audio",
        "mediaUrl": "https://example.com/audio1.mp3",
        "mediaThumbnail": null,
        "mediaSize": 512000,
        "mediaDuration": 8,
        "isRead": true,
        "createdAt": "2025-01-15T23:31:45Z",
        "updatedAt": "2025-01-15T23:31:45Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 108,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "timestamp": "2025-01-15T19:02:00Z"
}
```

### 7. POST /messages/:conversationId/messages - Send Message Request & Response

**Request Body:**

```json
{
  "content": "So beautiful",
  "type": "text"
}
```

**Hoặc cho media:**

```json
{
  "type": "image",
  "mediaUrl": "https://example.com/image.jpg",
  "mediaThumbnail": "https://example.com/thumb.jpg",
  "mediaSize": 1024000
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "msg-109",
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
    "createdAt": "2025-01-15T23:32:00Z",
    "updatedAt": "2025-01-15T23:32:00Z"
  },
  "timestamp": "2025-01-15T23:32:00Z"
}
```

### 8. PATCH /messages/:conversationId/notifications - Update Notification Response

**Request Body:**

```json
{
  "enabled": false
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "conv-123",
    "notificationsEnabled": false,
    "updatedAt": "2025-01-15T19:02:00Z"
  },
  "message": "Notifications turned off",
  "timestamp": "2025-01-15T19:02:00Z"
}
```

### 9. DELETE /messages/:conversationId - Delete Conversation Response

```json
{
  "success": true,
  "data": {
    "id": "conv-123",
    "deletedAt": "2025-01-15T19:02:00Z"
  },
  "message": "Conversation deleted successfully",
  "timestamp": "2025-01-15T19:02:00Z"
}
```

### 10. PATCH /messages/:conversationId/read - Mark Read Response

**Request Body:**

```json
{
  "messageIds": ["msg-101", "msg-102"]
}
```

**Hoặc đánh dấu tất cả:**

```json
{}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "conversationId": "conv-123",
    "readCount": 2,
    "readAt": "2025-01-15T19:02:00Z"
  },
  "message": "Messages marked as read",
  "timestamp": "2025-01-15T19:02:00Z"
}
```

### 11. GET /users/:userId/status - User Status Response

```json
{
  "success": true,
  "data": {
    "userId": "user-1",
    "nickname": "Abram Mango",
    "isOnline": true,
    "status": "Active",
    "lastSeen": "2025-01-15T19:02:00Z",
    "statusMessage": null
  },
  "timestamp": "2025-01-15T19:02:00Z"
}
```

### 12. POST /messages - Create Conversation Response

**Request Body:**

```json
{
  "participantId": "user-1",
  "type": "direct"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "conv-126",
    "type": "direct",
    "participants": [
      {
        "id": "user-1",
        "nickname": "Abram Mango",
        "avatar": "https://example.com/avatar1.jpg",
        "isOnline": true,
        "status": "Active"
      }
    ],
    "createdAt": "2025-01-15T19:02:00Z",
    "updatedAt": "2025-01-15T19:02:00Z",
    "isMuted": false,
    "isPinned": false,
    "unreadCount": 0
  },
  "message": "Conversation created successfully",
  "timestamp": "2025-01-15T19:02:00Z"
}
```

### 13. POST /upload/media - Upload Media Response

**Request:** `multipart/form-data`

**Form Data:**

- `file` - Media file (image or video)
- `type` - `image` or `video`
- `conversationId` (optional) - Pre-associate with conversation

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "media-123",
    "url": "https://example.com/uploads/image1.jpg",
    "thumbnail": "https://example.com/uploads/thumb_image1.jpg",
    "type": "image",
    "size": 1024000,
    "width": 1920,
    "height": 1080,
    "duration": null,
    "createdAt": "2025-01-15T23:35:00Z"
  },
  "message": "Media uploaded successfully",
  "timestamp": "2025-01-15T23:35:00Z"
}
```

**Video Response:**

```json
{
  "success": true,
  "data": {
    "id": "media-124",
    "url": "https://example.com/uploads/video1.mp4",
    "thumbnail": "https://example.com/uploads/thumb_video1.jpg",
    "type": "video",
    "size": 10485760,
    "width": 1920,
    "height": 1080,
    "duration": 9,
    "createdAt": "2025-01-15T23:35:30Z"
  },
  "message": "Media uploaded successfully",
  "timestamp": "2025-01-15T23:35:30Z"
}
```

### 14. GET /messages/:conversationId/media - Media Gallery Response

**Query Parameters:**

- `type` - Filter by type: `image` or `video` (optional)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:**

```json
{
  "success": true,
  "data": {
    "media": [
      {
        "id": "media-101",
        "messageId": "msg-101",
        "url": "https://example.com/image1.jpg",
        "thumbnail": "https://example.com/thumb1.jpg",
        "type": "image",
        "size": 1024000,
        "width": 1920,
        "height": 1080,
        "duration": null,
        "createdAt": "2025-01-15T23:30:00Z"
      },
      {
        "id": "media-102",
        "messageId": "msg-102",
        "url": "https://example.com/image2.jpg",
        "thumbnail": "https://example.com/thumb2.jpg",
        "type": "image",
        "size": 2048000,
        "width": 1920,
        "height": 1080,
        "duration": null,
        "createdAt": "2025-01-15T23:30:15Z"
      },
      {
        "id": "media-103",
        "messageId": "msg-105",
        "url": "https://example.com/video1.mp4",
        "thumbnail": "https://example.com/video-thumb1.jpg",
        "type": "video",
        "size": 10485760,
        "width": 1920,
        "height": 1080,
        "duration": 8,
        "createdAt": "2025-01-15T23:31:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    },
    "summary": {
      "totalImages": 10,
      "totalVideos": 5,
      "totalSize": 52428800
    }
  },
  "timestamp": "2025-01-15T19:02:00Z"
}
```

### 15. POST /messages/:conversationId/messages (Voice Message) - Voice Message Request & Response

**Request Body:**

```json
{
  "type": "audio",
  "mediaUrl": "https://example.com/audio1.mp3",
  "mediaSize": 512000,
  "mediaDuration": 8,
  "waveform": [0.2, 0.5, 0.8, 0.6, 0.4, 0.7, 0.9, 0.3, 0.5, 0.6]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "msg-110",
    "conversationId": "conv-123",
    "senderId": "current-user",
    "senderName": "You",
    "senderAvatar": "https://example.com/my-avatar.jpg",
    "content": null,
    "type": "audio",
    "mediaUrl": "https://example.com/audio1.mp3",
    "mediaThumbnail": null,
    "mediaSize": 512000,
    "mediaDuration": 8,
    "waveform": [0.2, 0.5, 0.8, 0.6, 0.4, 0.7, 0.9, 0.3, 0.5, 0.6],
    "isRead": false,
    "createdAt": "2025-01-15T23:36:00Z",
    "updatedAt": "2025-01-15T23:36:00Z"
  },
  "timestamp": "2025-01-15T23:36:00Z"
}
```

### 16. POST /messages/:conversationId/typing - Typing Indicator Request & Response

**Request Body:**

```json
{
  "isTyping": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "conversationId": "conv-123",
    "userId": "current-user",
    "userName": "You",
    "isTyping": true,
    "timestamp": "2025-01-15T23:37:00Z"
  },
  "message": "Typing indicator sent",
  "timestamp": "2025-01-15T23:37:00Z"
}
```

**Note:** Typing indicator tự động tắt sau 3 giây nếu không có request mới. Gửi `{"isTyping": false}` để tắt ngay lập tức.

---

## 🔄 WebSocket Events

### Real-time Message Event

**Event:** `new_message`

**Payload:**

```json
{
  "id": "msg-110",
  "conversationId": "conv-123",
  "senderId": "user-1",
  "senderName": "Abram Mango",
  "senderAvatar": "https://example.com/avatar1.jpg",
  "content": "New message content",
  "type": "text",
  "mediaUrl": null,
  "isRead": false,
  "createdAt": "2025-01-15T23:33:00Z"
}
```

### User Status Update Event

**Event:** `user_status_update`

**Payload:**

```json
{
  "userId": "user-1",
  "isOnline": true,
  "status": "Active",
  "lastSeen": "2025-01-15T19:02:00Z"
}
```

### Typing Indicator Event

**Event:** `typing`

**Payload:**

```json
{
  "conversationId": "conv-123",
  "userId": "user-1",
  "userName": "Abram Mango",
  "isTyping": true,
  "timestamp": "2025-01-15T23:37:00Z"
}
```

### Voice Message Recording Event

**Event:** `voice_recording`

**Payload:**

```json
{
  "conversationId": "conv-123",
  "userId": "user-1",
  "userName": "Abram Mango",
  "isRecording": true,
  "duration": 1,
  "timestamp": "2025-01-15T23:38:00Z"
}
```

### Media Upload Progress Event

**Event:** `media_upload_progress`

**Payload:**

```json
{
  "uploadId": "upload-123",
  "progress": 75,
  "uploaded": 768000,
  "total": 1024000,
  "status": "uploading"
}
```

---

## 📝 Request/Response Types

### Message Types

- `text` - Text message
- `image` - Image message
- `video` - Video message
- `audio` - Audio message
- `file` - File attachment

### Conversation Types

- `direct` - Direct message between two users
- `group` - Group conversation

### Status Types

- `Active` - User is currently active
- `Online` - User is online but not active
- `Offline` - User is offline

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
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Request validation failed
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_SERVER_ERROR` - Server error

---

## 📊 Pagination

Tất cả các list endpoints hỗ trợ pagination với query parameters:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `sort` - Sort field (default: `updatedAt`)
- `order` - Sort order: `asc` or `desc` (default: `desc`)

**Example:**

```
GET /messages?page=1&limit=20&sort=updatedAt&order=desc
```

---

## 🎯 Notes

1. **Timestamps**: Tất cả timestamps sử dụng ISO 8601 format (UTC)
2. **Media URLs**: Media files được lưu trữ trên cloud storage (Cloudinary/S3)
3. **Real-time**: Sử dụng WebSocket cho real-time updates
4. **Caching**: Conversation list và messages có thể được cache
5. **Rate Limiting**: Có rate limiting cho send message endpoint
6. **File Upload**: Media files upload qua separate endpoint trước khi gửi message
7. **Voice Messages**: Waveform data là array các giá trị từ 0-1, biểu diễn amplitude của audio
8. **Typing Indicator**: Tự động tắt sau 3 giây nếu không có update mới
9. **Media Gallery**: Hỗ trợ filter theo type (image/video) và pagination
10. **Camera Capture**: Sử dụng upload endpoint với file từ camera
11. **Media Thumbnails**: Tự động generate cho images và videos
12. **Audio Duration**: Được tính bằng giây (seconds)

---

**Version:** 1.1  
**Last Updated:** 2025-01-15  
**Status:** ✅ Ready for Implementation

---

## 📸 Media Upload Flow

### Image Upload Flow

1. User chọn image từ gallery hoặc camera
2. Frontend upload file qua `POST /upload/media` với `type: "image"`
3. Backend trả về `mediaUrl` và `thumbnail`
4. Frontend gửi message với `mediaUrl` qua `POST /messages/:conversationId/messages`

### Video Upload Flow

1. User chọn video từ gallery hoặc camera
2. Frontend upload file qua `POST /upload/media` với `type: "video"`
3. Backend trả về `mediaUrl`, `thumbnail`, và `duration`
4. Frontend gửi message với `mediaUrl` qua `POST /messages/:conversationId/messages`

### Voice Message Flow

1. User bấm và giữ microphone icon
2. Frontend bắt đầu recording và hiển thị waveform
3. User thả tay để kết thúc recording
4. Frontend upload audio file qua `POST /upload/media` với `type: "audio"`
5. Frontend generate waveform data từ audio
6. Frontend gửi message với `mediaUrl`, `mediaDuration`, và `waveform` qua `POST /messages/:conversationId/messages`

---

## ⌨️ Typing Indicator Flow

1. User bắt đầu gõ trong input field
2. Frontend gửi `POST /messages/:conversationId/typing` với `isTyping: true`
3. Backend emit WebSocket event `typing` đến các participants khác
4. Frontend hiển thị "Abram Mango is typing..." cho user khác
5. Sau 3 giây không có typing activity, tự động gửi `isTyping: false`
6. User dừng gõ hoặc gửi message → gửi `isTyping: false`

---

## 🎨 UI Components Mapping

### Input Bar Icons

- **Camera Icon** → Mở camera để capture image/video
- **Gallery Icon** → Mở media gallery để chọn image/video
- **Microphone Icon** → Bắt đầu recording voice message
- **Gift Box Icon** → Mở gift selection (nếu có)
- **Send Arrow** → Gửi message (hiển thị khi có text hoặc media selected)

### Media Gallery View

- **Grid Layout** → Hiển thị thumbnails của images/videos
- **Duration Overlay** → Hiển thị trên video thumbnails (e.g., "0:09")
- **Selection** → User có thể chọn multiple media để gửi

### Voice Recorder View

- **Waveform** → Hiển thị real-time audio waveform
- **Timer** → Hiển thị recording duration (e.g., "0:01")
- **Delete Icon** → Xóa recording hiện tại
- **Play/Pause Button** → Preview recording
- **Send Arrow** → Gửi voice message
