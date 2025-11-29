# 🎁💬 Gift & Forward Message API Documentation

Tài liệu API cho tính năng Gift (Quà tặng) và Forward Message (Chuyển tiếp tin nhắn) trong hệ thống Messaging. Tài liệu này cung cấp các endpoints và JSON response mẫu để frontend và backend sử dụng thống nhất.

---

## 📋 Bảng Components

| Component              | Type   | API Endpoint                                    | Notes                                                                              |
| ---------------------- | ------ | ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| Gift Popup            | Modal  | `GET /gifts/items?type={type}`                  | Hiển thị danh sách quà với tabs (Hot, Event, Lucky, Friendship, Vip)             |
| Gift Catalog           | List   | `GET /gifts/items`                              | Lấy danh sách tất cả gift items                                                   |
| Gift Item              | Item   | -                                               | Component hiển thị trong grid, không có endpoint riêng                            |
| Send Gift              | Action | `POST /gifts`                                   | Gửi quà tặng cho user trong conversation                                           |
| Gift Message           | Message| `POST /messages/:conversationId/messages`       | Gift message hiển thị trong chat (type: gift)                                      |
| Message Actions Menu   | Menu   | -                                               | Long press message để hiện menu (Delete, Copy, Gift, Forward)                     |
| Copy Message           | Action | -                                               | Copy message text (client-side, không cần API)                                     |
| Delete Message         | Action | `DELETE /messages/:conversationId/messages/:messageId` | Xóa message trong conversation                                                    |
| Forward Modal          | Modal  | `GET /users/forward-recipients`                 | Hiển thị danh sách users để forward message                                      |
| Search Recipients      | Search | `GET /users/forward-recipients?q={query}`       | Tìm kiếm users trong forward recipients list                                      |
| Forward Message        | Action | `POST /messages/forward`                        | Forward message(s) đến selected recipients                                        |
| Gift from Message      | Action | `POST /gifts` (từ message action menu)          | Gửi quà từ message action menu                                                    |

---

## 🔌 API Endpoints

| Method | Endpoint                                    | Response                    | Note                                                      |
| ------ | ------------------------------------------- | ---------------------------- | --------------------------------------------------------- |
| GET    | `/gifts/items`                              | `GiftItemsResponse`          | Lấy danh sách gift items (catalog)                        |
| GET    | `/gifts/items?type={type}`                  | `GiftItemsResponse`          | Lấy gift items theo type (hot/event/lucky/friendship/vip) |
| POST   | `/gifts`                                    | `SendGiftResponse`           | Gửi quà tặng cho user                                     |
| POST   | `/messages/:conversationId/messages` (gift)  | `GiftMessageResponse`        | Gửi gift message trong chat                              |
| DELETE | `/messages/:conversationId/messages/:messageId` | `DeleteMessageResponse` | Xóa message trong conversation                            |
| GET    | `/users/forward-recipients`                | `ForwardRecipientsResponse`  | Lấy danh sách users có thể forward message                |
| GET    | `/users/forward-recipients?q={query}`       | `ForwardRecipientsResponse`  | Tìm kiếm users trong forward recipients                  |
| POST   | `/messages/forward`                         | `ForwardMessageResponse`     | Forward message(s) đến selected recipients               |

---

## 📦 JSON Response Examples

### 1. GET /gifts/items - Gift Items Response

**Query Parameters:**
- `type` (optional) - Filter by type: `hot`, `event`, `lucky`, `friendship`, `vip`

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 101,
        "name": "Pink Winged Pig",
        "imageUrl": "https://example.com/gifts/pink-pig.png",
        "icon": "pink-hexagonal-pig",
        "price": 100,
        "type": "hot",
        "isEvent": false,
        "eventEndDate": null,
        "description": "Cute pink pig with wings",
        "rarity": "common"
      },
      {
        "id": 102,
        "name": "Treasure Chest",
        "imageUrl": "https://example.com/gifts/treasure-chest.png",
        "icon": "treasure-chest",
        "price": 200,
        "type": "lucky",
        "isEvent": false,
        "eventEndDate": null,
        "description": "Mysterious treasure chest",
        "rarity": "rare"
      },
      {
        "id": 103,
        "name": "Red Heart Box",
        "imageUrl": "https://example.com/gifts/heart-box.png",
        "icon": "red-heart-box",
        "price": 150,
        "type": "friendship",
        "isEvent": true,
        "eventEndDate": "2025-02-14T23:59:59Z",
        "description": "Special Valentine's gift",
        "rarity": "epic"
      },
      {
        "id": 104,
        "name": "Golden Crown",
        "imageUrl": "https://example.com/gifts/crown.png",
        "icon": "golden-crown",
        "price": 500,
        "type": "vip",
        "isEvent": false,
        "eventEndDate": null,
        "description": "Exclusive VIP gift",
        "rarity": "legendary"
      }
    ],
    "categories": [
      {
        "id": "hot",
        "name": "Hot",
        "count": 12,
        "isActive": true
      },
      {
        "id": "event",
        "name": "Event",
        "count": 8,
        "isActive": false
      },
      {
        "id": "lucky",
        "name": "Lucky",
        "count": 15,
        "isActive": false
      },
      {
        "id": "friendship",
        "name": "Friendship",
        "count": 10,
        "isActive": false
      },
      {
        "id": "vip",
        "name": "Vip",
        "count": 5,
        "isActive": false
      }
    ]
  },
  "timestamp": "2025-01-15T19:02:00Z"
}
```

### 2. GET /gifts/items?type=hot - Gift Items by Type Response

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 101,
        "name": "Pink Winged Pig",
        "imageUrl": "https://example.com/gifts/pink-pig.png",
        "icon": "pink-hexagonal-pig",
        "price": 100,
        "type": "hot",
        "isEvent": false,
        "eventEndDate": null,
        "description": "Cute pink pig with wings",
        "rarity": "common"
      }
    ],
    "type": "hot",
    "total": 12
  },
  "timestamp": "2025-01-15T19:02:00Z"
}
```

### 3. POST /gifts - Send Gift Request & Response

**Request Body:**

```json
{
  "receiverId": "user-1",
  "giftItemId": 101,
  "quantity": 1,
  "message": "For you",
  "conversationId": "conv-123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "gift-123",
    "senderId": "current-user",
    "receiverId": "user-1",
    "giftItem": {
      "id": 101,
      "name": "Pink Winged Pig",
      "imageUrl": "https://example.com/gifts/pink-pig.png",
      "icon": "pink-hexagonal-pig",
      "price": 100,
      "type": "hot"
    },
    "quantity": 1,
    "totalPrice": 100,
    "message": "For you",
    "conversationId": "conv-123",
    "createdAt": "2025-01-15T23:40:00Z"
  },
  "message": "Gift sent successfully",
  "timestamp": "2025-01-15T23:40:00Z"
}
```

### 4. POST /messages/:conversationId/messages (Gift Message) - Gift Message Request & Response

**Request Body:**

```json
{
  "type": "gift",
  "giftId": "gift-123",
  "giftItemId": 101,
  "giftName": "Pink Winged Pig",
  "giftImageUrl": "https://example.com/gifts/pink-pig.png",
  "giftIcon": "pink-hexagonal-pig",
  "quantity": 1
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "msg-111",
    "conversationId": "conv-123",
    "senderId": "current-user",
    "senderName": "You",
    "senderAvatar": "https://example.com/my-avatar.jpg",
    "content": "Gửi tặng quà",
    "type": "gift",
    "gift": {
      "id": "gift-123",
      "giftItemId": 101,
      "name": "Pink Winged Pig",
      "imageUrl": "https://example.com/gifts/pink-pig.png",
      "icon": "pink-hexagonal-pig",
      "quantity": 1,
      "price": 100
    },
    "isRead": false,
    "createdAt": "2025-01-15T23:40:00Z",
    "updatedAt": "2025-01-15T23:40:00Z"
  },
  "timestamp": "2025-01-15T23:40:00Z"
}
```

### 5. DELETE /messages/:conversationId/messages/:messageId - Delete Message Response

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "msg-104",
    "conversationId": "conv-123",
    "deletedAt": "2025-01-15T23:41:00Z"
  },
  "message": "Message deleted successfully",
  "timestamp": "2025-01-15T23:41:00Z"
}
```

### 6. GET /users/forward-recipients - Forward Recipients Response

**Query Parameters:**
- `q` (optional) - Search query
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20)

**Response:**

```json
{
  "success": true,
  "data": {
    "recipients": [
      {
        "id": "user-2",
        "nickname": "Carter Lipshutz",
        "avatar": "https://example.com/avatar2.jpg",
        "bio": "Striving for excellence, embracing challenges...",
        "isOnline": true,
        "type": "premium",
        "typeIcon": "P",
        "hasConversation": true,
        "conversationId": "conv-124"
      },
      {
        "id": "user-3",
        "nickname": "Kierra Curtis",
        "avatar": "https://example.com/avatar3.jpg",
        "bio": "Striving for excellence, embracing challenges...",
        "isOnline": false,
        "type": "male",
        "typeIcon": "♂",
        "hasConversation": false
      },
      {
        "id": "user-4",
        "nickname": "Emerson Dokidis",
        "avatar": "https://example.com/avatar4.jpg",
        "bio": "Striving for excellence, embracing challenges...",
        "isOnline": true,
        "type": "male",
        "typeIcon": "♂",
        "hasConversation": true,
        "conversationId": "conv-125"
      },
      {
        "id": "user-5",
        "nickname": "Ann Botosh",
        "avatar": "https://example.com/avatar5.jpg",
        "bio": "Striving for excellence, embracing challenges...",
        "isOnline": false,
        "type": "premium",
        "typeIcon": "P",
        "hasConversation": false
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

### 7. GET /users/forward-recipients?q=carter - Search Forward Recipients Response

**Response:**

```json
{
  "success": true,
  "data": {
    "recipients": [
      {
        "id": "user-2",
        "nickname": "Carter Lipshutz",
        "avatar": "https://example.com/avatar2.jpg",
        "bio": "Striving for excellence, embracing challenges...",
        "isOnline": true,
        "type": "premium",
        "typeIcon": "P",
        "hasConversation": true,
        "conversationId": "conv-124"
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

### 8. POST /messages/forward - Forward Message Request & Response

**Request Body:**

```json
{
  "messageIds": ["msg-103", "msg-104"],
  "recipientIds": ["user-2"],
  "conversationId": "conv-123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "forwardedMessages": [
      {
        "originalMessageId": "msg-103",
        "newMessageId": "msg-112",
        "conversationId": "conv-124",
        "recipientId": "user-2",
        "content": "So beautiful",
        "type": "text",
        "forwardedAt": "2025-01-15T23:42:00Z"
      },
      {
        "originalMessageId": "msg-104",
        "newMessageId": "msg-113",
        "conversationId": "conv-124",
        "recipientId": "user-2",
        "content": "Thank you! You are great too",
        "type": "text",
        "forwardedAt": "2025-01-15T23:42:00Z"
      }
    ],
    "totalForwarded": 2,
    "totalRecipients": 1
  },
  "message": "Messages forwarded successfully",
  "timestamp": "2025-01-15T23:42:00Z"
}
```

**Forward Multiple Messages to Multiple Recipients:**

**Request Body:**

```json
{
  "messageIds": ["msg-103", "msg-104"],
  "recipientIds": ["user-2", "user-3"],
  "conversationId": "conv-123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "forwardedMessages": [
      {
        "originalMessageId": "msg-103",
        "newMessageId": "msg-112",
        "conversationId": "conv-124",
        "recipientId": "user-2",
        "content": "So beautiful",
        "type": "text",
        "forwardedAt": "2025-01-15T23:42:00Z"
      },
      {
        "originalMessageId": "msg-103",
        "newMessageId": "msg-114",
        "conversationId": "conv-125",
        "recipientId": "user-3",
        "content": "So beautiful",
        "type": "text",
        "forwardedAt": "2025-01-15T23:42:00Z"
      },
      {
        "originalMessageId": "msg-104",
        "newMessageId": "msg-115",
        "conversationId": "conv-124",
        "recipientId": "user-2",
        "content": "Thank you! You are great too",
        "type": "text",
        "forwardedAt": "2025-01-15T23:42:00Z"
      },
      {
        "originalMessageId": "msg-104",
        "newMessageId": "msg-116",
        "conversationId": "conv-125",
        "recipientId": "user-3",
        "content": "Thank you! You are great too",
        "type": "text",
        "forwardedAt": "2025-01-15T23:42:00Z"
      }
    ],
    "totalForwarded": 4,
    "totalRecipients": 2
  },
  "message": "Messages forwarded successfully",
  "timestamp": "2025-01-15T23:42:00Z"
}
```

---

## 🔄 WebSocket Events

### Gift Sent Event

**Event:** `gift_sent`

**Payload:**

```json
{
  "id": "gift-123",
  "conversationId": "conv-123",
  "senderId": "current-user",
  "receiverId": "user-1",
  "giftItem": {
    "id": 101,
    "name": "Pink Winged Pig",
    "imageUrl": "https://example.com/gifts/pink-pig.png",
    "icon": "pink-hexagonal-pig",
    "price": 100
  },
  "quantity": 1,
  "message": "For you",
  "createdAt": "2025-01-15T23:40:00Z"
}
```

### Message Forwarded Event

**Event:** `message_forwarded`

**Payload:**

```json
{
  "originalMessageId": "msg-103",
  "newMessageId": "msg-112",
  "conversationId": "conv-124",
  "recipientId": "user-2",
  "forwarderId": "current-user",
  "content": "So beautiful",
  "type": "text",
  "forwardedAt": "2025-01-15T23:42:00Z"
}
```

### Message Deleted Event

**Event:** `message_deleted`

**Payload:**

```json
{
  "messageId": "msg-104",
  "conversationId": "conv-123",
  "deletedBy": "current-user",
  "deletedAt": "2025-01-15T23:41:00Z"
}
```

---

## 📝 Request/Response Types

### Gift Types

- `hot` - Hot/Trending gifts
- `event` - Event gifts (limited time)
- `lucky` - Lucky gifts
- `friendship` - Friendship gifts
- `vip` - VIP exclusive gifts
- `normal` - Normal gifts

### Gift Rarity

- `common` - Common gift
- `rare` - Rare gift
- `epic` - Epic gift
- `legendary` - Legendary gift

### Message Types (for Forward)

- `text` - Text message
- `image` - Image message
- `video` - Video message
- `audio` - Audio message
- `gift` - Gift message
- `file` - File attachment

### User Type Icons

- `P` - Premium user
- `♂` - Male user
- `♀` - Female user
- `👑` - VIP user

---

## 🔐 Authentication

Tất cả các endpoints yêu cầu authentication token trong header:

```
Authorization: Bearer {jwt_token}
```

**Exception:**
- `GET /gifts/items` - Có thể public hoặc authenticated (tùy implementation)

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
- `NOT_FOUND` - Resource not found (gift item, message, user)
- `VALIDATION_ERROR` - Request validation failed
- `INSUFFICIENT_BALANCE` - Not enough balance to send gift
- `GIFT_ITEM_NOT_AVAILABLE` - Gift item is not available
- `EVENT_GIFT_EXPIRED` - Event gift has expired
- `CANNOT_FORWARD_TO_SELF` - Cannot forward message to yourself
- `MESSAGE_NOT_FOUND` - Message not found or already deleted
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_SERVER_ERROR` - Server error

---

## 📊 Pagination

Các list endpoints hỗ trợ pagination với query parameters:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `sort` - Sort field (default: `createdAt`)
- `order` - Sort order: `asc` or `desc` (default: `desc`)

**Example:**

```
GET /users/forward-recipients?page=1&limit=20&sort=createdAt&order=desc
```

---

## 🎯 Notes

1. **Gift Catalog**: Gift items được cache để tối ưu performance
2. **Event Gifts**: Event gifts có `eventEndDate`, sau ngày này không thể gửi
3. **Gift Price**: Giá quà tính bằng points/coins của user
4. **Balance Check**: Backend tự động check balance trước khi gửi quà
5. **Forward Messages**: Có thể forward multiple messages đến multiple recipients
6. **Message Deletion**: Chỉ sender hoặc conversation owner mới có thể xóa message
7. **Copy Message**: Copy action xử lý client-side, không cần API call
8. **Toast Notifications**: Frontend hiển thị toast sau khi copy/delete thành công
9. **Gift Message**: Gift message tự động tạo conversation nếu chưa có
10. **Forward Recipients**: Chỉ hiển thị users có thể nhận message (không block, active)

---

## 🎨 UI Flow Documentation

### Gift Flow

1. **Open Gift Popup**
   - User click gift box icon trong input bar
   - Frontend gọi `GET /gifts/items` để lấy tất cả categories
   - Hiển thị modal với tabs: Hot, Event, Lucky, Friendship, Vip

2. **Select Gift Category**
   - User click tab (e.g., "Hot")
   - Frontend gọi `GET /gifts/items?type=hot`
   - Hiển thị grid of gifts với icons, names, và prices

3. **Select Gift**
   - User click gift item
   - Hiển thị quantity selector (default: 1)
   - Hiển thị total price

4. **Send Gift**
   - User click "Gửi" button
   - Frontend gọi `POST /gifts` với receiverId, giftItemId, quantity
   - Backend check balance và deduct points
   - Backend tạo gift record
   - Frontend gọi `POST /messages/:conversationId/messages` với type: "gift"
   - Gift message hiển thị trong chat với icon và "Gửi tặng quà" text

### Message Actions Flow

1. **Long Press Message**
   - User long press message bubble
   - Frontend hiển thị action menu: Delete, Copy, Gift, Forward

2. **Copy Message**
   - User click "Copy"
   - Frontend copy message text to clipboard
   - Hiển thị toast: "Copied message text"
   - Không cần API call

3. **Delete Message**
   - User click "Delete"
   - Frontend confirm dialog
   - Frontend gọi `DELETE /messages/:conversationId/messages/:messageId`
   - Message bị xóa khỏi conversation
   - Hiển thị toast: "Message deleted successfully"
   - WebSocket emit `message_deleted` event

4. **Gift from Message**
   - User click "Gift"
   - Frontend mở gift popup (same flow như Gift Flow)
   - Sau khi gửi gift, gift message hiển thị trong chat

5. **Forward Message**
   - User click "Forward"
   - Frontend mở forward modal
   - Frontend gọi `GET /users/forward-recipients`
   - Hiển thị list recipients với search bar
   - User search hoặc scroll để tìm recipient
   - User select recipient(s) bằng radio buttons
   - "Send" button enable khi có selection
   - User click "Send"
   - Frontend gọi `POST /messages/forward` với messageIds và recipientIds
   - Messages được forward đến selected recipients
   - Modal đóng, hiển thị success message

### Forward Modal Flow

1. **Open Forward Modal**
   - Modal slide up từ bottom
   - Header: "Send to" với "Cancel" button
   - Search bar với placeholder "Search users"
   - List recipients với avatars, names, bios, type icons

2. **Search Recipients**
   - User type trong search bar
   - Frontend debounce và gọi `GET /users/forward-recipients?q={query}`
   - Filter và hiển thị matching recipients

3. **Select Recipients**
   - User click radio button để select/deselect
   - Multiple selection allowed
   - "Send" button enable khi có ít nhất 1 selection

4. **Send Forward**
   - User click "Send" button
   - Frontend gọi `POST /messages/forward`
   - Backend tạo messages trong conversations của recipients
   - WebSocket emit `message_forwarded` events
   - Modal đóng
   - Success notification

---

## 🔄 Integration with Main Messaging API

### Gift Message in Chat

Gift message được xử lý như một message type đặc biệt trong conversation:

```json
{
  "id": "msg-111",
  "type": "gift",
  "gift": {
    "id": "gift-123",
    "giftItemId": 101,
    "name": "Pink Winged Pig",
    "imageUrl": "https://example.com/gifts/pink-pig.png",
    "icon": "pink-hexagonal-pig"
  }
}
```

### Forwarded Message Indicator

Forwarded messages có thể có indicator trong message object:

```json
{
  "id": "msg-112",
  "type": "text",
  "content": "So beautiful",
  "isForwarded": true,
  "originalMessageId": "msg-103",
  "forwarderId": "current-user",
  "forwarderName": "You"
}
```

---

**Version:** 1.0  
**Last Updated:** 2025-01-15  
**Status:** ✅ Ready for Implementation

