# 📱 Messaging API - Complete Reference Guide

Tài liệu tổng hợp đầy đủ tất cả các API endpoints cho hệ thống Messaging. File này cung cấp quick reference và overview, chi tiết xem các file riêng biệt.

---

## 📚 Tài Liệu Chi Tiết

| File                                                                                           | Mô Tả                               | Endpoints    |
| ---------------------------------------------------------------------------------------------- | ----------------------------------- | ------------ |
| [`MESSAGING_API_DOCUMENTATION.md`](./MESSAGING_API_DOCUMENTATION.md)                           | Core messaging features             | 15 endpoints |
| [`MESSAGING_GIFT_FORWARD_API.md`](./MESSAGING_GIFT_FORWARD_API.md)                             | Gift & Forward message              | 7 endpoints  |
| [`MESSAGING_SETTINGS_GROUP_API.md`](./MESSAGING_SETTINGS_GROUP_API.md)                         | Chat settings, Report, Block, Group | 14 endpoints |
| [`MESSAGING_NEW_CONVERSATION_API.md`](./MESSAGING_NEW_CONVERSATION_API.md)                     | New message & conversation          | 7 endpoints  |
| [`MESSAGING_SEND_MESSAGE_BUSINESS_CARD_API.md`](./MESSAGING_SEND_MESSAGE_BUSINESS_CARD_API.md) | Send message & business card        | 6 endpoints  |
| [`MESSAGING_GROUP_SETTINGS_API.md`](./MESSAGING_GROUP_SETTINGS_API.md)                         | Group chat settings                 | 12 endpoints |
| [`MESSAGING_GROUP_MEMBER_MANAGEMENT_API.md`](./MESSAGING_GROUP_MEMBER_MANAGEMENT_API.md)       | Group member management             | 13 endpoints |

**Tổng cộng:** ~74 endpoints

---

## 🔌 Tất Cả API Endpoints

### 📬 Core Messaging

| Method | Endpoint                                  | Mô Tả                                | File |
| ------ | ----------------------------------------- | ------------------------------------ | ---- |
| GET    | `/messages`                               | Lấy danh sách conversations          | Core |
| GET    | `/messages/categories`                    | Lấy categories                       | Core |
| GET    | `/messages/search?q={query}`              | Tìm kiếm conversations               | Core |
| GET    | `/messages/suggestions`                   | Suggested contacts                   | Core |
| GET    | `/messages/:conversationId`               | Chi tiết conversation                | Core |
| GET    | `/messages/:conversationId/messages`      | Lấy messages trong conversation      | Core |
| POST   | `/messages/:conversationId/messages`      | Gửi message (text/image/video/audio) | Core |
| POST   | `/messages`                               | Tạo conversation mới                 | Core |
| PATCH  | `/messages/:conversationId/read`          | Đánh dấu đã đọc                      | Core |
| PATCH  | `/messages/:conversationId/notifications` | Bật/tắt notifications                | Core |
| DELETE | `/messages/:conversationId`               | Xóa conversation                     | Core |
| POST   | `/upload/media`                           | Upload media files                   | Core |
| GET    | `/messages/:conversationId/media`         | Media gallery                        | Core |
| POST   | `/messages/:conversationId/typing`        | Typing indicator                     | Core |
| GET    | `/users/:userId/status`                   | User status                          | Core |

### 🎁 Gift & Forward

| Method | Endpoint                                        | Mô Tả                     | File |
| ------ | ----------------------------------------------- | ------------------------- | ---- |
| GET    | `/gifts/items`                                  | Lấy gift catalog          | Gift |
| GET    | `/gifts/items?type={type}`                      | Gift items theo type      | Gift |
| POST   | `/gifts`                                        | Gửi quà tặng              | Gift |
| POST   | `/messages/:conversationId/messages` (gift)     | Gửi gift message          | Gift |
| DELETE | `/messages/:conversationId/messages/:messageId` | Xóa message               | Gift |
| GET    | `/users/forward-recipients`                     | Forward recipients        | Gift |
| GET    | `/users/forward-recipients?q={query}`           | Search forward recipients | Gift |
| POST   | `/messages/forward`                             | Forward messages          | Gift |

### ⚙️ Chat Settings & Actions

| Method | Endpoint                                 | Mô Tả                   | File     |
| ------ | ---------------------------------------- | ----------------------- | -------- |
| GET    | `/messages/:conversationId/settings`     | Chat settings           | Settings |
| PATCH  | `/messages/:conversationId/display-name` | Đổi display name        | Settings |
| PATCH  | `/messages/:conversationId/gift-sounds`  | Bật/tắt gift sounds     | Settings |
| POST   | `/users/:userId/block`                   | Chặn user               | Settings |
| DELETE | `/users/:userId/block`                   | Bỏ chặn user            | Settings |
| GET    | `/users/blocked`                         | Danh sách blocked users | Settings |
| POST   | `/messages/:conversationId/report`       | Báo cáo conversation    | Settings |

### 💬 New Conversation

| Method | Endpoint                                    | Mô Tả                      | File |
| ------ | ------------------------------------------- | -------------------------- | ---- |
| GET    | `/users/suggestions?type=message`           | Message suggestions        | New  |
| GET    | `/users/suggestions?q={query}&type=message` | Search message suggestions | New  |
| GET    | `/users/suggestions?type=group`             | Group suggestions          | New  |
| GET    | `/users/suggestions?q={query}&type=group`   | Search group suggestions   | New  |
| POST   | `/groups`                                   | Tạo group chat             | New  |
| GET    | `/users/:userId`                            | User detail                | New  |
| GET    | `/users/contacts`                           | Contacts list              | New  |

### 📇 Send Message & Business Card

| Method | Endpoint                                               | Mô Tả                          | File |
| ------ | ------------------------------------------------------ | ------------------------------ | ---- |
| POST   | `/messages/:conversationId/messages` (text/video/card) | Gửi text/video/business card   | Send |
| GET    | `/users/:userId`                                       | User profile cho business card | Send |
| POST   | `/users/:userId/friends`                               | Add friend từ business card    | Send |
| GET    | `/users/:userId/friends/status`                        | Friendship status              | Send |

### 👥 Group Settings

| Method | Endpoint                           | Mô Tả                 | File           |
| ------ | ---------------------------------- | --------------------- | -------------- |
| GET    | `/groups/:group_id/settings`       | Group settings        | Group Settings |
| GET    | `/groups/:group_id`                | Group detail          | Group Settings |
| PATCH  | `/groups/:group_id/introduction`   | Cập nhật introduction | Group Settings |
| PATCH  | `/groups/:group_id/name`           | Đổi tên group         | Group Settings |
| PATCH  | `/groups/:group_id/avatar`         | Đổi avatar group      | Group Settings |
| GET    | `/groups/:group_id/classification` | Group classification  | Group Settings |
| PATCH  | `/groups/:group_id/notifications`  | Mute notifications    | Group Settings |
| PATCH  | `/groups/:group_id/gift-effect`    | Bật/tắt gift effect   | Group Settings |
| POST   | `/groups/:group_id/report`         | Báo cáo group         | Group Settings |
| DELETE | `/groups/:group_id/members/me`     | Rời khỏi group        | Group Settings |

### 👤 Group Member Management

| Method | Endpoint                                                | Mô Tả                     | File        |
| ------ | ------------------------------------------------------- | ------------------------- | ----------- |
| GET    | `/groups/:group_id/members`                             | Danh sách members         | Member Mgmt |
| GET    | `/groups/:group_id/members?role={role}`                 | Filter members theo role  | Member Mgmt |
| POST   | `/groups/:group_id/members`                             | Thêm members              | Member Mgmt |
| DELETE | `/groups/:group_id/members/:userId`                     | Xóa member                | Member Mgmt |
| PATCH  | `/groups/:group_id/members/:userId/role`                | Thay đổi role             | Member Mgmt |
| GET    | `/groups/:group_id/members/summary`                     | Member summary            | Member Mgmt |
| GET    | `/users/suggestions?type=group&excludeGroup={group_id}` | More people suggestions   | Member Mgmt |
| GET    | `/groups/classifications`                               | Danh sách classifications | Member Mgmt |
| PATCH  | `/groups/:group_id/classification`                      | Cập nhật classification   | Member Mgmt |

---

## 📊 Endpoint Summary by Category

### Messages (15 endpoints)

- List conversations
- Search & suggestions
- Conversation detail
- Send messages (text/image/video/audio)
- Media upload & gallery
- Typing indicator
- Mark read
- Delete conversation

### Gifts (4 endpoints)

- Gift catalog
- Send gift
- Gift message

### Forward (3 endpoints)

- Forward recipients
- Forward messages

### Settings (7 endpoints)

- Chat settings
- Display name
- Notifications
- Gift sounds
- Block/Unblock
- Report

### New Conversation (7 endpoints)

- Message suggestions
- Group suggestions
- Create conversation
- Create group
- User detail
- Contacts

### Business Card (4 endpoints)

- Send business card
- User profile
- Add friend
- Friendship status

### Group Settings (10 endpoints)

- Group settings
- Introduction
- Name & avatar
- Classification
- Notifications
- Gift effect
- Report
- Leave group

### Member Management (9 endpoints)

- Member list
- Add/Remove members
- Role management
- Member summary
- More people
- Classification

---

## 🔄 WebSocket Events

### Core Messaging Events

- `new_message` - New message received
- `user_status_update` - User online/offline status
- `typing` - Typing indicator
- `voice_recording` - Voice recording status
- `media_upload_progress` - Media upload progress

### Gift & Forward Events

- `gift_sent` - Gift sent
- `message_forwarded` - Message forwarded
- `message_deleted` - Message deleted

### Settings Events

- `user_blocked` - User blocked
- `user_unblocked` - User unblocked
- `conversation_settings_updated` - Settings updated

### Group Events

- `group_created` - Group created
- `group_settings_updated` - Group settings updated
- `group_name_changed` - Group name changed
- `group_avatar_changed` - Group avatar changed
- `group_introduction_updated` - Introduction updated
- `group_classification_updated` - Classification updated

### Member Management Events

- `group_member_added` - Member added
- `group_member_removed` - Member removed
- `group_member_role_updated` - Role updated
- `member_left_group` - Member left group

### New Conversation Events

- `conversation_created` - Conversation created

### Business Card Events

- `friend_request_sent` - Friend request sent

---

## 📝 Common Request/Response Types

### Message Types

- `text` - Text message
- `image` - Image message
- `video` - Video message
- `audio` - Audio/voice message
- `gift` - Gift message
- `business_card` - Business card message
- `file` - File attachment
- `system` - System message

### Conversation Types

- `direct` - Direct message between two users
- `group` - Group conversation

### User Status

- `Active` - User is currently active
- `Online` - User is online but not active
- `Offline` - User is offline

### Member Roles

- `owner` - Group owner
- `admin` - Group administrator
- `member` - Regular member

### Gift Types

- `hot` - Hot/Trending gifts
- `event` - Event gifts
- `lucky` - Lucky gifts
- `friendship` - Friendship gifts
- `vip` - VIP exclusive gifts

### Friendship Status

- `none` - Not friends
- `pending` - Friend request pending
- `requested` - Friend request received
- `accepted` - Friends
- `blocked` - User is blocked

### User Types

- `premium` - Premium user (P icon, pink)
- `male` - Male user (♂ icon, blue)
- `female` - Female user (♀ icon, pink)
- `vip` - VIP user (👑 icon, gold)

### Report Reasons

- `violent_offensive_language` - Violent/offensive language
- `distorted_provocative_content` - Distorted/provocative content
- `irrelevant_content` - Irrelevant content
- `inappropriate_content` - Inappropriate content
- `spam` - Spam
- `harassment` - Harassment
- `other` - Other

### Group Classifications

- `games` - Games
- `making_friends` - Making friends
- `enjoyment` - Enjoyment
- `entertainment` - Entertainment
- `learning` - Learning
- `networking` - Networking
- `others` - Others

---

## 🔐 Authentication

Tất cả các endpoints yêu cầu authentication token trong header:

```
Authorization: Bearer {jwt_token}
```

**Exceptions:**

- `GET /gifts/items` - Có thể public hoặc authenticated (tùy implementation)

---

## ⚠️ Common Error Responses

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

| Code                       | Mô Tả                             |
| -------------------------- | --------------------------------- |
| `UNAUTHORIZED`             | Missing or invalid token          |
| `FORBIDDEN`                | User doesn't have permission      |
| `NOT_FOUND`                | Resource not found                |
| `VALIDATION_ERROR`         | Request validation failed         |
| `RATE_LIMIT_EXCEEDED`      | Too many requests                 |
| `INTERNAL_SERVER_ERROR`    | Server error                      |
| `USER_BLOCKED`             | User is blocked                   |
| `NOT_GROUP_MEMBER`         | User is not a member of the group |
| `INSUFFICIENT_PERMISSIONS` | User doesn't have permission      |
| `MAX_MEMBERS_REACHED`      | Group has reached maximum members |
| `ALREADY_FRIENDS`          | Users are already friends         |
| `MEDIA_UPLOAD_FAILED`      | Media upload failed               |
| `INVALID_MEDIA_TYPE`       | Invalid media type                |
| `MEDIA_SIZE_EXCEEDED`      | Media file size exceeds limit     |

---

## 📊 Pagination

Tất cả các list endpoints hỗ trợ pagination với query parameters:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `sort` - Sort field (default: `updatedAt` hoặc `createdAt`)
- `order` - Sort order: `asc` or `desc` (default: `desc`)

**Example:**

```
GET /messages?page=1&limit=20&sort=updatedAt&order=desc
```

---

## 🎯 Common Patterns

### Standard Response Format

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Optional success message",
  "timestamp": "2025-01-15T19:02:00Z"
}
```

### Pagination Response Format

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "timestamp": "2025-01-15T19:02:00Z"
}
```

### Timestamps

- Tất cả timestamps sử dụng ISO 8601 format (UTC)
- Format: `YYYY-MM-DDTHH:mm:ssZ`
- Example: `2025-01-15T19:02:00Z`

---

## 🔗 Cross-Reference Endpoints

### `/users/suggestions` - Multi-purpose Endpoint

Endpoint này được dùng cho nhiều mục đích khác nhau:

| Query Parameter                      | Purpose                        | File                       |
| ------------------------------------ | ------------------------------ | -------------------------- |
| `type=message`                       | New message suggestions        | New Conversation           |
| `type=group`                         | Group creation suggestions     | New Conversation, Settings |
| `type=group&excludeGroup={group_id}` | More people (exclude existing) | Member Management          |
| `type=forward`                       | Forward recipients             | Gift & Forward             |

### `/messages/:conversationId/messages` - Multi-type Endpoint

Endpoint này hỗ trợ nhiều message types:

| Type            | Purpose       | File               |
| --------------- | ------------- | ------------------ |
| `text`          | Text message  | Core, Send Message |
| `image`         | Image message | Core               |
| `video`         | Video message | Core, Send Message |
| `audio`         | Voice message | Core               |
| `gift`          | Gift message  | Gift & Forward     |
| `business_card` | Business card | Send Message       |

### `/groups/:group_id/members` - Multi-purpose Endpoint

| Query Parameter | Purpose              | File                        |
| --------------- | -------------------- | --------------------------- |
| (none)          | All members          | Group Settings, Member Mgmt |
| `role=admin`    | Filter by role       | Member Mgmt                 |
| `role=member`   | Regular members only | Member Mgmt                 |

---

## 📋 Quick Reference by Feature

### 💬 Send Message

1. Upload media (nếu cần): `POST /upload/media`
2. Send message: `POST /messages/:conversationId/messages`
3. WebSocket: `new_message` event

### 🎁 Send Gift

1. Get gift items: `GET /gifts/items?type={type}`
2. Send gift: `POST /gifts`
3. Create gift message: `POST /messages/:conversationId/messages` (type: gift)
4. WebSocket: `gift_sent` event

### 📤 Forward Message

1. Get recipients: `GET /users/forward-recipients`
2. Forward: `POST /messages/forward`
3. WebSocket: `message_forwarded` event

### 👥 Create Group

1. Get suggestions: `GET /users/suggestions?type=group`
2. Create group: `POST /groups`
3. WebSocket: `group_created` event

### ⚙️ Group Settings

1. Get settings: `GET /groups/:group_id/settings`
2. Update: `PATCH /groups/:group_id/{field}`
3. WebSocket: `group_settings_updated` event

### 👤 Manage Members

1. Get members: `GET /groups/:group_id/members`
2. Add: `POST /groups/:group_id/members`
3. Remove: `DELETE /groups/:group_id/members/:userId`
4. Change role: `PATCH /groups/:group_id/members/:userId/role`
5. WebSocket: `group_member_added`, `group_member_removed`, `group_member_role_updated`

### 🚫 Block User

1. Block: `POST /users/:userId/block`
2. Unblock: `DELETE /users/:userId/block`
3. List blocked: `GET /users/blocked`
4. WebSocket: `user_blocked`, `user_unblocked`

### 📇 Send Business Card

1. Get user profile: `GET /users/:userId`
2. Send card: `POST /messages/:conversationId/messages` (type: business_card)
3. Add friend: `POST /users/:userId/friends`
4. WebSocket: `friend_request_sent`

---

## 🎨 UI Flow Quick Reference

### New Message Flow

1. `GET /users/suggestions?type=message`
2. `POST /messages` (create conversation)
3. `GET /messages/:conversationId` (empty conversation)
4. `POST /messages/:conversationId/messages` (send first message)

### Group Creation Flow

1. `GET /users/suggestions?type=group`
2. Select members
3. `POST /groups` (create group)
4. Navigate to group chat

### Gift Flow

1. `GET /gifts/items` (catalog)
2. `GET /gifts/items?type={type}` (filter by type)
3. `POST /gifts` (send gift)
4. `POST /messages/:conversationId/messages` (gift message)

### Forward Flow

1. Long press message → Actions menu
2. `GET /users/forward-recipients`
3. Select recipients
4. `POST /messages/forward`

### Member Management Flow

1. `GET /groups/:group_id/members`
2. Click "+" → `GET /users/suggestions?type=group&excludeGroup={group_id}`
3. Select members → `POST /groups/:group_id/members`
4. Click member → Actions menu → `PATCH /groups/:group_id/members/:userId/role`

---

## 📝 Notes & Best Practices

### 1. Media Upload

- Upload media trước khi gửi message
- Use `POST /upload/media` với `type` parameter
- Backend trả về `mediaUrl` và `thumbnail`
- Gửi message với `mediaUrl`

### 2. Real-time Updates

- Sử dụng WebSocket cho real-time updates
- Subscribe to conversation/group events
- Handle offline/online status updates

### 3. Pagination

- Always implement pagination cho list endpoints
- Default limit: 20 items
- Max limit: 100 items
- Use `hasNext` và `hasPrev` để control pagination UI

### 4. Error Handling

- Always check `success` field trong response
- Handle common error codes
- Show user-friendly error messages

### 5. Caching

- Cache conversation list và messages
- Cache gift catalog
- Cache user suggestions (with TTL)

### 6. Rate Limiting

- Implement rate limiting cho send message
- Debounce search requests (300-500ms)
- Throttle typing indicator (max 1 request/3s)

### 7. Permissions

- Check permissions trước khi show actions
- Hide disabled actions
- Show appropriate error messages

### 8. System Messages

- System messages có `type: "system"`
- Display differently from user messages
- Don't allow actions (delete, forward, etc.)

---

## 🔄 Integration Checklist

### Frontend Implementation

- [ ] Authentication token handling
- [ ] WebSocket connection & events
- [ ] Error handling & retry logic
- [ ] Pagination implementation
- [ ] Media upload with progress
- [ ] Real-time message updates
- [ ] Typing indicator
- [ ] Online/offline status
- [ ] Permission checks
- [ ] Toast notifications
- [ ] Loading states
- [ ] Empty states

### Backend Implementation

- [ ] Authentication middleware
- [ ] WebSocket server
- [ ] Rate limiting
- [ ] Input validation
- [ ] Error handling
- [ ] Database queries optimization
- [ ] Media storage (S3/Cloudinary)
- [ ] Caching layer
- [ ] Permission checks
- [ ] System message generation
- [ ] Event emission

---

## 📚 Additional Resources

### Related Documentation

- [API Documentation](./MESSAGING_API_DOCUMENTATION.md) - Core messaging features
- [Gift & Forward API](./MESSAGING_GIFT_FORWARD_API.md) - Gift and forward features
- [Settings & Group API](./MESSAGING_SETTINGS_GROUP_API.md) - Settings and group creation
- [New Conversation API](./MESSAGING_NEW_CONVERSATION_API.md) - New message and conversation
- [Send Message API](./MESSAGING_SEND_MESSAGE_BUSINESS_CARD_API.md) - Send message and business card
- [Group Settings API](./MESSAGING_GROUP_SETTINGS_API.md) - Group chat settings
- [Member Management API](./MESSAGING_GROUP_MEMBER_MANAGEMENT_API.md) - Group member management

### API Summary

- [API Summary](./MESSAGING_API_SUMMARY.md) - Summary by image sections

---

## 📊 Statistics

- **Total Endpoints:** ~74
- **WebSocket Events:** 20+
- **Message Types:** 8
- **User Roles:** 3 (owner, admin, member)
- **Gift Types:** 5
- **Group Classifications:** 7
- **Report Reasons:** 7

---

## 🔄 Version History

| Version | Date       | Changes                          |
| ------- | ---------- | -------------------------------- |
| 1.0     | 2025-01-16 | Initial complete reference guide |

---

## 📞 Support

Nếu có câu hỏi hoặc cần hỗ trợ, vui lòng tham khảo các file documentation chi tiết hoặc liên hệ development team.

---

**Version:** 1.0  
**Last Updated:** 2025-01-16  
**Status:** ✅ Complete Reference Guide
