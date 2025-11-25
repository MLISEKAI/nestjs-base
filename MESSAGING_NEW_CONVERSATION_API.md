# 💬➕ New Message & New Conversation API Documentation

Tài liệu API cho tính năng New Message (Tin nhắn mới) và New Conversation (Tạo cuộc trò chuyện mới) trong hệ thống Messaging. Tài liệu này cung cấp các endpoints và JSON response mẫu để frontend và backend sử dụng thống nhất.

---

## 📋 Bảng Components

| Component              | Type    | API Endpoint                                    | Notes                                                  |
| ---------------------- | ------- | ----------------------------------------------- | ------------------------------------------------------ |
| New Message Icon       | Button  | -                                               | Icon trong header để mở new message modal              |
| New Message Modal      | Modal   | `GET /users/suggestions?type=message`           | Modal hiển thị suggested users để tạo conversation mới |
| Search Users           | Search  | `GET /users/suggestions?q={query}&type=message` | Tìm kiếm users trong new message modal                 |
| Suggested Users List   | List    | `GET /users/suggestions?type=message`           | Lấy danh sách suggested users                          |
| User Item              | Item    | -                                               | Component hiển thị user trong suggestions list         |
| Empty Chat Screen      | Screen  | `GET /messages/:conversationId`                 | Hiển thị empty conversation khi chưa có messages       |
| New Group Icon         | Button  | -                                               | Icon trong header để mở new group modal                |
| New Group Modal        | Modal   | `GET /users/suggestions?type=group`             | Modal hiển thị suggested users để tạo group            |
| Selected Users Display | Display | -                                               | Hiển thị selected users với remove button              |
| Start Group Button     | Button  | `POST /groups`                                  | Button để tạo group chat                               |
| Create Conversation    | Action  | `POST /messages`                                | Tạo conversation mới với user                          |

---

## 🔌 API Endpoints

| Method | Endpoint                                    | Response                     | Note                                                |
| ------ | ------------------------------------------- | ---------------------------- | --------------------------------------------------- |
| GET    | `/users/suggestions?type=message`           | `MessageSuggestionsResponse` | Lấy suggested users để tạo conversation mới         |
| GET    | `/users/suggestions?q={query}&type=message` | `MessageSuggestionsResponse` | Tìm kiếm users để tạo conversation                  |
| POST   | `/messages`                                 | `CreateConversationResponse` | Tạo conversation mới với user (auto-create)         |
| GET    | `/messages/:conversationId`                 | `ConversationDetailResponse` | Lấy thông tin conversation (empty hoặc có messages) |
| GET    | `/users/suggestions?type=group`             | `GroupSuggestionsResponse`   | Lấy suggested users để tạo group                    |
| GET    | `/users/suggestions?q={query}&type=group`   | `GroupSuggestionsResponse`   | Tìm kiếm users để tạo group                         |
| POST   | `/groups`                                   | `CreateGroupResponse`        | Tạo group chat mới                                  |
| GET    | `/users/:userId`                            | `UserDetailResponse`         | Lấy thông tin chi tiết user                         |
| GET    | `/users/contacts`                           | `ContactsResponse`           | Lấy danh sách contacts                              |

---

## 📦 JSON Response Examples

### 1. GET /users/suggestions?type=message - Message Suggestions Response

**Response:**

```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "id": "user-1",
        "nickname": "Carter Lipshutz",
        "avatar": "https://example.com/avatar1.jpg",
        "bio": "Striving for excellence, embracing challenges...",
        "isOnline": true,
        "type": "premium",
        "typeIcon": "P",
        "typeIconColor": "pink",
        "mutualFriends": 5,
        "hasConversation": false,
        "lastSeen": "2025-01-15T19:00:00Z"
      },
      {
        "id": "user-2",
        "nickname": "Kierra Curtis",
        "avatar": "https://example.com/avatar2.jpg",
        "bio": "Striving for excellence, embracing challenges...",
        "isOnline": false,
        "type": "premium",
        "typeIcon": "P",
        "typeIconColor": "pink",
        "mutualFriends": 3,
        "hasConversation": true,
        "conversationId": "conv-124",
        "lastSeen": "2025-01-15T18:55:00Z"
      },
      {
        "id": "user-3",
        "nickname": "Emerson Dokidis",
        "avatar": "https://example.com/avatar3.jpg",
        "bio": "Striving for excellence, embracing challenges...",
        "isOnline": true,
        "type": "male",
        "typeIcon": "♂",
        "typeIconColor": "blue",
        "mutualFriends": 2,
        "hasConversation": false,
        "lastSeen": "2025-01-15T19:02:00Z"
      },
      {
        "id": "user-4",
        "nickname": "Ann Botosh",
        "avatar": "https://example.com/avatar4.jpg",
        "bio": "Striving for excellence, embracing challenges...",
        "isOnline": false,
        "type": "premium",
        "typeIcon": "P",
        "typeIconColor": "pink",
        "mutualFriends": 1,
        "hasConversation": false,
        "lastSeen": "2025-01-15T17:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "timestamp": "2025-01-15T19:02:00Z"
}
```

### 2. GET /users/suggestions?q=carter&type=message - Search Message Suggestions Response

**Response:**

```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "id": "user-1",
        "nickname": "Carter Lipshutz",
        "avatar": "https://example.com/avatar1.jpg",
        "bio": "Striving for excellence, embracing challenges...",
        "isOnline": true,
        "type": "premium",
        "typeIcon": "P",
        "typeIconColor": "pink",
        "mutualFriends": 5,
        "hasConversation": false,
        "lastSeen": "2025-01-15T19:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    },
    "query": "carter"
  },
  "timestamp": "2025-01-15T19:02:00Z"
}
```

### 3. POST /messages - Create Conversation Request & Response

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
        "id": "current-user",
        "nickname": "You",
        "avatar": "https://example.com/my-avatar.jpg",
        "isOnline": true,
        "status": "Active"
      },
      {
        "id": "user-1",
        "nickname": "Carter Lipshutz",
        "avatar": "https://example.com/avatar1.jpg",
        "isOnline": true,
        "status": "Active",
        "type": "premium",
        "typeIcon": "P"
      }
    ],
    "createdAt": "2025-01-15T23:55:00Z",
    "updatedAt": "2025-01-15T23:55:00Z",
    "isMuted": false,
    "isPinned": false,
    "unreadCount": 0,
    "lastMessage": null,
    "messageCount": 0
  },
  "message": "Conversation created successfully",
  "timestamp": "2025-01-15T23:55:00Z"
}
```

**Note:** Nếu conversation đã tồn tại, API sẽ trả về conversation hiện có thay vì tạo mới.

### 4. GET /messages/:conversationId (Empty Conversation) - Empty Conversation Response

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
        "nickname": "Carter Lipshutz",
        "avatar": "https://example.com/avatar1.jpg",
        "isOnline": true,
        "status": "Active",
        "type": "premium",
        "typeIcon": "P",
        "lastSeen": "2025-01-15T19:00:00Z"
      }
    ],
    "createdAt": "2025-01-15T23:55:00Z",
    "updatedAt": "2025-01-15T23:55:00Z",
    "isMuted": false,
    "isPinned": false,
    "unreadCount": 0,
    "settings": {
      "notificationsEnabled": true,
      "giftSoundsEnabled": true
    },
    "messageCount": 0,
    "lastMessage": null,
    "isEmpty": true
  },
  "timestamp": "2025-01-15T19:02:00Z"
}
```

### 5. GET /users/suggestions?type=group - Group Suggestions Response

**Response:**

```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "id": "user-1",
        "nickname": "Abram Mango",
        "avatar": "https://example.com/avatar1.jpg",
        "bio": "Striving for excellence, embracing challenges...",
        "isOnline": true,
        "type": "premium",
        "typeIcon": "P",
        "typeIconColor": "pink",
        "mutualFriends": 5,
        "hasConversation": true,
        "conversationId": "conv-123"
      },
      {
        "id": "user-2",
        "nickname": "Kierra Curtis",
        "avatar": "https://example.com/avatar2.jpg",
        "bio": "Striving for excellence, embracing challenges...",
        "isOnline": false,
        "type": "male",
        "typeIcon": "♂",
        "typeIconColor": "blue",
        "mutualFriends": 3,
        "hasConversation": false
      },
      {
        "id": "user-3",
        "nickname": "Emerson Dokidis",
        "avatar": "https://example.com/avatar3.jpg",
        "bio": "Striving for excellence, embracing challenges...",
        "isOnline": true,
        "type": "male",
        "typeIcon": "♂",
        "typeIconColor": "blue",
        "mutualFriends": 2,
        "hasConversation": true,
        "conversationId": "conv-124"
      },
      {
        "id": "user-4",
        "nickname": "Ann Botosh",
        "avatar": "https://example.com/avatar4.jpg",
        "bio": "Striving for excellence, embracing challenges...",
        "isOnline": false,
        "type": "premium",
        "typeIcon": "P",
        "typeIconColor": "pink",
        "mutualFriends": 1,
        "hasConversation": false
      },
      {
        "id": "user-5",
        "nickname": "Carter Lipshutz",
        "avatar": "https://example.com/avatar5.jpg",
        "bio": "Striving for excellence, embracing challenges...",
        "isOnline": true,
        "type": "premium",
        "typeIcon": "P",
        "typeIconColor": "pink",
        "mutualFriends": 4,
        "hasConversation": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "timestamp": "2025-01-15T19:02:00Z"
}
```

### 6. GET /users/suggestions?q=abram&type=group - Search Group Suggestions Response

**Response:**

```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "id": "user-1",
        "nickname": "Abram Mango",
        "avatar": "https://example.com/avatar1.jpg",
        "bio": "Striving for excellence, embracing challenges...",
        "isOnline": true,
        "type": "premium",
        "typeIcon": "P",
        "typeIconColor": "pink",
        "mutualFriends": 5,
        "hasConversation": true,
        "conversationId": "conv-123"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    },
    "query": "abram"
  },
  "timestamp": "2025-01-15T19:02:00Z"
}
```

### 7. POST /groups - Create Group Chat Request & Response

**Request Body:**

```json
{
  "name": "My Group Chat",
  "memberIds": ["user-1", "user-2"],
  "avatar": null
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "group-123",
    "name": "My Group Chat",
    "avatar": null,
    "type": "group",
    "createdBy": "current-user",
    "createdAt": "2025-01-15T23:56:00Z",
    "updatedAt": "2025-01-15T23:56:00Z",
    "members": [
      {
        "id": "current-user",
        "nickname": "You",
        "avatar": "https://example.com/my-avatar.jpg",
        "role": "admin",
        "joinedAt": "2025-01-15T23:56:00Z"
      },
      {
        "id": "user-1",
        "nickname": "Abram Mango",
        "avatar": "https://example.com/avatar1.jpg",
        "role": "member",
        "joinedAt": "2025-01-15T23:56:00Z"
      },
      {
        "id": "user-2",
        "nickname": "Kierra Curtis",
        "avatar": "https://example.com/avatar2.jpg",
        "role": "member",
        "joinedAt": "2025-01-15T23:56:00Z"
      }
    ],
    "memberCount": 3,
    "settings": {
      "notificationsEnabled": true,
      "isMuted": false
    }
  },
  "message": "Group created successfully",
  "timestamp": "2025-01-15T23:56:00Z"
}
```

### 8. GET /users/:userId - User Detail Response

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "user-1",
    "nickname": "Carter Lipshutz",
    "avatar": "https://example.com/avatar1.jpg",
    "bio": "Striving for excellence, embracing challenges and opportunities with determination.",
    "isOnline": true,
    "status": "Active",
    "type": "premium",
    "typeIcon": "P",
    "typeIconColor": "pink",
    "lastSeen": "2025-01-15T19:00:00Z",
    "mutualFriends": 5,
    "hasConversation": false,
    "isBlocked": false,
    "isBlockedBy": false,
    "canMessage": true
  },
  "timestamp": "2025-01-15T19:02:00Z"
}
```

### 9. GET /users/contacts - Contacts Response

**Response:**

```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "id": "user-1",
        "nickname": "Carter Lipshutz",
        "avatar": "https://example.com/avatar1.jpg",
        "isOnline": true,
        "hasConversation": true,
        "conversationId": "conv-124",
        "lastMessage": {
          "content": "Hello!",
          "createdAt": "2025-01-15T18:00:00Z"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "totalPages": 2,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "timestamp": "2025-01-15T19:02:00Z"
}
```

---

## 🔄 WebSocket Events

### Conversation Created Event

**Event:** `conversation_created`

**Payload:**

```json
{
  "id": "conv-126",
  "type": "direct",
  "participants": [
    {
      "id": "current-user",
      "nickname": "You"
    },
    {
      "id": "user-1",
      "nickname": "Carter Lipshutz"
    }
  ],
  "createdAt": "2025-01-15T23:55:00Z"
}
```

### Group Created Event

**Event:** `group_created`

**Payload:**

```json
{
  "id": "group-123",
  "name": "My Group Chat",
  "createdBy": "current-user",
  "members": ["current-user", "user-1", "user-2"],
  "createdAt": "2025-01-15T23:56:00Z"
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

---

## 📝 Request/Response Types

### Suggestion Types

- `message` - Suggestions for new message/conversation
- `group` - Suggestions for group creation
- `forward` - Suggestions for forwarding messages

### User Types

- `premium` - Premium user (P icon, pink)
- `male` - Male user (♂ icon, blue)
- `female` - Female user (♀ icon, pink)
- `vip` - VIP user (👑 icon, gold)

### Conversation Types

- `direct` - Direct message between two users
- `group` - Group conversation

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
- `NOT_FOUND` - Resource not found (user, conversation)
- `VALIDATION_ERROR` - Request validation failed
- `USER_BLOCKED` - User is blocked or has blocked you
- `CANNOT_MESSAGE_SELF` - Cannot create conversation with yourself
- `CONVERSATION_EXISTS` - Conversation already exists (returns existing conversation)
- `MIN_MEMBERS_REQUIRED` - Group must have at least 2 members
- `MAX_MEMBERS_REACHED` - Group has reached maximum members
- `USER_ALREADY_IN_GROUP` - User is already a member of the group
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_SERVER_ERROR` - Server error

---

## 📊 Pagination

Các list endpoints hỗ trợ pagination với query parameters:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `sort` - Sort field (default: `mutualFriends` hoặc `createdAt`)
- `order` - Sort order: `asc` or `desc` (default: `desc`)

**Example:**

```
GET /users/suggestions?type=message&page=1&limit=20&sort=mutualFriends&order=desc
```

---

## 🎯 Notes

1. **Auto-create Conversation**: Khi user click vào suggested user, conversation tự động được tạo nếu chưa tồn tại
2. **Existing Conversation**: Nếu conversation đã tồn tại, API trả về conversation hiện có thay vì tạo mới
3. **Empty Conversation**: Conversation mới có `messageCount: 0` và `lastMessage: null`
4. **Suggested Users**: Suggestions dựa trên mutual friends, recent interactions, và user preferences
5. **Blocked Users**: Blocked users không xuất hiện trong suggestions
6. **Online Status**: User status (Active/Online/Offline) được update real-time qua WebSocket
7. **Type Icons**: Type icons (P, ♂, ♀) có màu sắc tương ứng (pink, blue)
8. **Group Creation**: Group phải có ít nhất 2 members (creator + 1 member)
9. **Search Debounce**: Frontend nên debounce search requests để tránh quá nhiều API calls
10. **Caching**: Suggestions có thể được cache để tối ưu performance

---

## 🎨 UI Flow Documentation

### New Message Flow

1. **Open New Message Modal**
   - User click "new message" icon trong messages header
   - Frontend gọi `GET /users/suggestions?type=message`
   - Hiển thị modal với search bar và suggested users list

2. **Search Users**
   - User type trong search bar
   - Frontend debounce (300-500ms) và gọi `GET /users/suggestions?q={query}&type=message`
   - Filter và hiển thị matching users

3. **Select User**
   - User click vào user trong suggestions list
   - Frontend gọi `POST /messages` với `participantId`
   - Backend tạo conversation (hoặc trả về existing)
   - Frontend navigate đến conversation screen

4. **Empty Chat Screen**
   - Conversation screen hiển thị empty state
   - Header hiển thị user info (avatar, name, status)
   - Input bar sẵn sàng để gửi message đầu tiên

### New Group Chat Flow

1. **Open New Group Modal**
   - User click "new group" icon trong messages header
   - Frontend gọi `GET /users/suggestions?type=group`
   - Hiển thị modal với search bar và suggested users list

2. **Search Users**
   - User type trong search bar
   - Frontend debounce và gọi `GET /users/suggestions?q={query}&type=group`
   - Filter và hiển thị matching users

3. **Select Members**
   - User click checkbox để select/deselect users
   - Selected users hiển thị ở top với 'x' để remove
   - "Start a group chat" button enable khi có ít nhất 1 member selected

4. **Create Group**
   - User click "Start a group chat" button
   - Frontend có thể hiển thị dialog để đặt tên group (optional, có thể để default)
   - Frontend gọi `POST /groups` với `memberIds`
   - Backend tạo group và add members
   - WebSocket emit `group_created` event
   - Frontend navigate đến group chat screen

### Empty Conversation Screen

1. **Display Empty State**
   - Conversation screen hiển thị empty (no messages)
   - Header hiển thị participant info
   - Input bar với icons: image, microphone, emoji, gift

2. **Send First Message**
   - User có thể gửi text, image, video, audio, hoặc gift
   - Sau khi gửi, conversation được update với `messageCount: 1` và `lastMessage`

---

## 🔄 Integration with Main Messaging API

### Conversation Auto-creation

Khi user click vào suggested user, conversation tự động được tạo:

```javascript
// Frontend flow
1. User clicks suggested user
2. POST /messages { participantId: "user-1" }
3. Backend checks if conversation exists
4. If exists → return existing conversation
5. If not → create new conversation
6. Return conversation with isEmpty: true
```

### Suggested Users Algorithm

Suggestions được tính toán dựa trên:

- Mutual friends count
- Recent interactions
- User preferences
- Block status (excluded)
- Online status (prioritized)

### Empty Conversation Handling

Empty conversations có:

- `messageCount: 0`
- `lastMessage: null`
- `isEmpty: true`
- `updatedAt: createdAt` (same timestamp)

---

**Version:** 1.0  
**Last Updated:** 2025-01-15  
**Status:** ✅ Ready for Implementation
