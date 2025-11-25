# ⚙️💬 Chat Settings & Group Chat API Documentation

Tài liệu API cho tính năng Chat Settings (Cài đặt chat), Report (Báo cáo), Block (Chặn), và Group Chat (Tạo nhóm chat) trong hệ thống Messaging. Tài liệu này cung cấp các endpoints và JSON response mẫu để frontend và backend sử dụng thống nhất.

---

## 📋 Bảng Components

| Component              | Type   | API Endpoint                                    | Notes                                                                              |
| ---------------------- | ------ | ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| Chat Settings Screen  | Screen | `GET /messages/:conversationId/settings`        | Hiển thị cài đặt chat với profile, options, và toggles                           |
| Change Name           | Action | `PATCH /messages/:conversationId/display-name`  | Đổi tên hiển thị trong conversation                                               |
| Create Group Chat     | Action | `POST /groups`                                  | Tạo group chat mới                                                                |
| Mute Notifications    | Toggle | `PATCH /messages/:conversationId/notifications`  | Bật/tắt thông báo cho conversation                                                |
| Gift Sounds           | Toggle | `PATCH /messages/:conversationId/gift-sounds`    | Bật/tắt âm thanh khi nhận quà                                                      |
| Block User            | Action | `POST /users/:userId/block`                     | Chặn user trong conversation                                                      |
| Unblock User          | Action | `DELETE /users/:userId/block`                  | Bỏ chặn user                                                                      |
| Report Chat           | Action | `POST /messages/:conversationId/report`         | Báo cáo conversation                                                              |
| New Group Screen      | Screen | `GET /users/suggestions?type=group`             | Lấy danh sách suggested users để tạo group                                        |
| Search Users for Group| Search | `GET /users/suggestions?q={query}&type=group`   | Tìm kiếm users để thêm vào group                                                  |
| Group Members         | List   | `GET /groups/:groupId/members`                  | Lấy danh sách members trong group                                                 |

---

## 🔌 API Endpoints

| Method | Endpoint                                    | Response                    | Note                                                      |
| ------ | ------------------------------------------- | ---------------------------- | --------------------------------------------------------- |
| GET    | `/messages/:conversationId/settings`         | `ChatSettingsResponse`       | Lấy cài đặt chat của conversation                         |
| PATCH  | `/messages/:conversationId/display-name`    | `ChangeDisplayNameResponse`  | Đổi tên hiển thị trong conversation                      |
| POST   | `/groups`                                    | `CreateGroupResponse`        | Tạo group chat mới                                        |
| PATCH  | `/messages/:conversationId/notifications`    | `MuteNotificationsResponse` | Bật/tắt thông báo (mute/unmute)                          |
| PATCH  | `/messages/:conversationId/gift-sounds`      | `GiftSoundsResponse`         | Bật/tắt âm thanh quà tặng                                 |
| POST   | `/users/:userId/block`                       | `BlockUserResponse`          | Chặn user                                                 |
| DELETE | `/users/:userId/block`                       | `UnblockUserResponse`       | Bỏ chặn user                                              |
| GET    | `/users/blocked`                             | `BlockedUsersResponse`       | Lấy danh sách users đã chặn                              |
| POST   | `/messages/:conversationId/report`           | `ReportChatResponse`         | Báo cáo conversation                                       |
| GET    | `/users/suggestions?type=group`              | `GroupSuggestionsResponse`   | Lấy suggested users để tạo group                          |
| GET    | `/users/suggestions?q={query}&type=group`    | `GroupSuggestionsResponse`   | Tìm kiếm users để thêm vào group                          |
| GET    | `/groups/:groupId`                           | `GroupDetailResponse`        | Lấy thông tin chi tiết group                              |
| GET    | `/groups/:groupId/members`                    | `GroupMembersResponse`       | Lấy danh sách members trong group                         |
| POST   | `/groups/:groupId/members`                   | `AddGroupMembersResponse`    | Thêm members vào group                                    |
| DELETE | `/groups/:groupId/members/:userId`          | `RemoveGroupMemberResponse`  | Xóa member khỏi group                                     |

---

## 📦 JSON Response Examples

### 1. GET /messages/:conversationId/settings - Chat Settings Response

**Response:**

```json
{
  "success": true,
  "data": {
    "conversationId": "conv-123",
    "participant": {
      "id": "user-1",
      "nickname": "Abram Mango",
      "avatar": "https://example.com/avatar1.jpg",
      "bio": "Lorem ipsum is simply dummy text of the printing and typesetting industry",
      "isOnline": true,
      "status": "Active"
    },
    "displayName": "Abram Mango",
    "settings": {
      "notificationsEnabled": false,
      "isMuted": true,
      "giftSoundsEnabled": false,
      "isBlocked": false
    },
    "canChangeName": true,
    "canCreateGroup": true,
    "canReport": true,
    "canBlock": true
  },
  "timestamp": "2025-01-15T19:02:00Z"
}
```

### 2. PATCH /messages/:conversationId/display-name - Change Display Name Request & Response

**Request Body:**

```json
{
  "displayName": "Abram Mango Updated"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "conversationId": "conv-123",
    "displayName": "Abram Mango Updated",
    "updatedAt": "2025-01-15T23:45:00Z"
  },
  "message": "Display name updated successfully",
  "timestamp": "2025-01-15T23:45:00Z"
}
```

**Note:** Display name chỉ áp dụng cho conversation này, không thay đổi nickname của user.

### 3. POST /groups - Create Group Chat Request & Response

**Request Body:**

```json
{
  "name": "My Group Chat",
  "memberIds": ["user-1", "user-2"],
  "avatar": "https://example.com/group-avatar.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "group-123",
    "name": "My Group Chat",
    "avatar": "https://example.com/group-avatar.jpg",
    "type": "group",
    "createdBy": "current-user",
    "createdAt": "2025-01-15T23:46:00Z",
    "updatedAt": "2025-01-15T23:46:00Z",
    "members": [
      {
        "id": "current-user",
        "nickname": "You",
        "avatar": "https://example.com/my-avatar.jpg",
        "role": "admin",
        "joinedAt": "2025-01-15T23:46:00Z"
      },
      {
        "id": "user-1",
        "nickname": "Abram Mango",
        "avatar": "https://example.com/avatar1.jpg",
        "role": "member",
        "joinedAt": "2025-01-15T23:46:00Z"
      },
      {
        "id": "user-2",
        "nickname": "Kierra Curtis",
        "avatar": "https://example.com/avatar2.jpg",
        "role": "member",
        "joinedAt": "2025-01-15T23:46:00Z"
      }
    ],
    "memberCount": 3,
    "settings": {
      "notificationsEnabled": true,
      "isMuted": false
    }
  },
  "message": "Group created successfully",
  "timestamp": "2025-01-15T23:46:00Z"
}
```

### 4. PATCH /messages/:conversationId/notifications - Mute Notifications Request & Response

**Request Body:**

```json
{
  "enabled": false
}
```

**Hoặc:**

```json
{
  "isMuted": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "conversationId": "conv-123",
    "notificationsEnabled": false,
    "isMuted": true,
    "updatedAt": "2025-01-15T23:47:00Z"
  },
  "message": "Notifications muted",
  "timestamp": "2025-01-15T23:47:00Z"
}
```

### 5. PATCH /messages/:conversationId/gift-sounds - Gift Sounds Request & Response

**Request Body:**

```json
{
  "enabled": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "conversationId": "conv-123",
    "giftSoundsEnabled": true,
    "updatedAt": "2025-01-15T23:48:00Z"
  },
  "message": "Gift sounds enabled",
  "timestamp": "2025-01-15T23:48:00Z"
}
```

### 6. POST /users/:userId/block - Block User Request & Response

**Request Body:**

```json
{
  "conversationId": "conv-123",
  "reason": "Harassment"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "blockedUserId": "user-1",
    "blockedUserName": "Abram Mango",
    "conversationId": "conv-123",
    "blockedAt": "2025-01-15T23:49:00Z"
  },
  "message": "User blocked successfully. They will not be able to send you messages, see your posts, or find your profile.",
  "timestamp": "2025-01-15T23:49:00Z"
}
```

### 7. DELETE /users/:userId/block - Unblock User Response

**Response:**

```json
{
  "success": true,
  "data": {
    "unblockedUserId": "user-1",
    "unblockedUserName": "Abram Mango",
    "unblockedAt": "2025-01-15T23:50:00Z"
  },
  "message": "User unblocked successfully",
  "timestamp": "2025-01-15T23:50:00Z"
}
```

### 8. GET /users/blocked - Blocked Users Response

**Response:**

```json
{
  "success": true,
  "data": {
    "blockedUsers": [
      {
        "id": "user-1",
        "nickname": "Abram Mango",
        "avatar": "https://example.com/avatar1.jpg",
        "blockedAt": "2025-01-15T23:49:00Z",
        "reason": "Harassment"
      },
      {
        "id": "user-3",
        "nickname": "Craig Curtis",
        "avatar": "https://example.com/avatar3.jpg",
        "blockedAt": "2025-01-14T10:30:00Z",
        "reason": null
      }
    ],
    "total": 2
  },
  "timestamp": "2025-01-15T19:02:00Z"
}
```

### 9. POST /messages/:conversationId/report - Report Chat Request & Response

**Request Body:**

```json
{
  "reason": "violent_offensive_language",
  "description": "User used offensive language"
}
```

**Available Reasons:**
- `violent_offensive_language` - Violent / offensive language
- `distorted_provocative_content` - Distorted / provocative content
- `irrelevant_content` - Irrelevant content
- `inappropriate_content` - Inappropriate content
- `spam` - Spam
- `harassment` - Harassment
- `other` - Other (requires description)

**Response:**

```json
{
  "success": true,
  "data": {
    "reportId": "report-123",
    "conversationId": "conv-123",
    "reportedUserId": "user-1",
    "reason": "violent_offensive_language",
    "description": "User used offensive language",
    "reportedAt": "2025-01-15T23:51:00Z",
    "status": "pending"
  },
  "message": "Thank you! The post has been reported. We will review and handle it according to regulations.",
  "timestamp": "2025-01-15T23:51:00Z"
}
```

### 10. GET /users/suggestions?type=group - Group Suggestions Response

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
        "mutualFriends": 1,
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

### 11. GET /users/suggestions?q=kierra&type=group - Search Group Suggestions Response

**Response:**

```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "id": "user-2",
        "nickname": "Kierra Curtis",
        "avatar": "https://example.com/avatar2.jpg",
        "bio": "Striving for excellence, embracing challenges...",
        "isOnline": false,
        "type": "male",
        "typeIcon": "♂",
        "mutualFriends": 3,
        "hasConversation": false
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
    "query": "kierra"
  },
  "timestamp": "2025-01-15T19:02:00Z"
}
```

### 12. GET /groups/:groupId - Group Detail Response

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "group-123",
    "name": "My Group Chat",
    "avatar": "https://example.com/group-avatar.jpg",
    "type": "group",
    "description": "A group for friends",
    "createdBy": "current-user",
    "createdAt": "2025-01-15T23:46:00Z",
    "updatedAt": "2025-01-15T23:46:00Z",
    "memberCount": 3,
    "maxMembers": 100,
    "settings": {
      "notificationsEnabled": true,
      "isMuted": false,
      "onlyAdminsCanPost": false,
      "onlyAdminsCanAddMembers": false
    },
    "currentUserRole": "admin",
    "isMember": true
  },
  "timestamp": "2025-01-15T19:02:00Z"
}
```

### 13. GET /groups/:groupId/members - Group Members Response

**Response:**

```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "current-user",
        "nickname": "You",
        "avatar": "https://example.com/my-avatar.jpg",
        "role": "admin",
        "joinedAt": "2025-01-15T23:46:00Z",
        "isOnline": true
      },
      {
        "id": "user-1",
        "nickname": "Abram Mango",
        "avatar": "https://example.com/avatar1.jpg",
        "role": "member",
        "joinedAt": "2025-01-15T23:46:00Z",
        "isOnline": true
      },
      {
        "id": "user-2",
        "nickname": "Kierra Curtis",
        "avatar": "https://example.com/avatar2.jpg",
        "role": "member",
        "joinedAt": "2025-01-15T23:46:00Z",
        "isOnline": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 3,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  },
  "timestamp": "2025-01-15T19:02:00Z"
}
```

### 14. POST /groups/:groupId/members - Add Group Members Request & Response

**Request Body:**

```json
{
  "memberIds": ["user-3", "user-4"]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "groupId": "group-123",
    "addedMembers": [
      {
        "id": "user-3",
        "nickname": "Emerson Dokidis",
        "avatar": "https://example.com/avatar3.jpg",
        "role": "member",
        "joinedAt": "2025-01-15T23:52:00Z"
      },
      {
        "id": "user-4",
        "nickname": "Ann Botosh",
        "avatar": "https://example.com/avatar4.jpg",
        "role": "member",
        "joinedAt": "2025-01-15T23:52:00Z"
      }
    ],
    "totalAdded": 2,
    "newMemberCount": 5
  },
  "message": "Members added successfully",
  "timestamp": "2025-01-15T23:52:00Z"
}
```

### 15. DELETE /groups/:groupId/members/:userId - Remove Group Member Response

**Response:**

```json
{
  "success": true,
  "data": {
    "groupId": "group-123",
    "removedUserId": "user-2",
    "removedUserName": "Kierra Curtis",
    "removedAt": "2025-01-15T23:53:00Z",
    "newMemberCount": 4
  },
  "message": "Member removed successfully",
  "timestamp": "2025-01-15T23:53:00Z"
}
```

---

## 🔄 WebSocket Events

### User Blocked Event

**Event:** `user_blocked`

**Payload:**

```json
{
  "blockedUserId": "user-1",
  "blockedUserName": "Abram Mango",
  "blockedBy": "current-user",
  "conversationId": "conv-123",
  "blockedAt": "2025-01-15T23:49:00Z"
}
```

### User Unblocked Event

**Event:** `user_unblocked`

**Payload:**

```json
{
  "unblockedUserId": "user-1",
  "unblockedUserName": "Abram Mango",
  "unblockedBy": "current-user",
  "unblockedAt": "2025-01-15T23:50:00Z"
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
  "createdAt": "2025-01-15T23:46:00Z"
}
```

### Group Member Added Event

**Event:** `group_member_added`

**Payload:**

```json
{
  "groupId": "group-123",
  "addedUserId": "user-3",
  "addedUserName": "Emerson Dokidis",
  "addedBy": "current-user",
  "addedAt": "2025-01-15T23:52:00Z"
}
```

### Group Member Removed Event

**Event:** `group_member_removed`

**Payload:**

```json
{
  "groupId": "group-123",
  "removedUserId": "user-2",
  "removedUserName": "Kierra Curtis",
  "removedBy": "current-user",
  "removedAt": "2025-01-15T23:53:00Z"
}
```

### Conversation Settings Updated Event

**Event:** `conversation_settings_updated`

**Payload:**

```json
{
  "conversationId": "conv-123",
  "settings": {
    "notificationsEnabled": false,
    "isMuted": true,
    "giftSoundsEnabled": false,
    "displayName": "Abram Mango Updated"
  },
  "updatedBy": "current-user",
  "updatedAt": "2025-01-15T23:45:00Z"
}
```

---

## 📝 Request/Response Types

### Report Reasons

- `violent_offensive_language` - Violent / offensive language
- `distorted_provocative_content` - Distorted / provocative content
- `irrelevant_content` - Irrelevant content
- `inappropriate_content` - Inappropriate content
- `spam` - Spam
- `harassment` - Harassment
- `other` - Other (requires description)

### Group Member Roles

- `admin` - Group administrator
- `member` - Regular member
- `moderator` - Group moderator (optional)

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
- `NOT_FOUND` - Resource not found (conversation, group, user)
- `VALIDATION_ERROR` - Request validation failed
- `ALREADY_BLOCKED` - User is already blocked
- `NOT_BLOCKED` - User is not blocked
- `CANNOT_BLOCK_SELF` - Cannot block yourself
- `ALREADY_REPORTED` - Conversation already reported
- `GROUP_NOT_FOUND` - Group not found
- `NOT_GROUP_MEMBER` - User is not a member of the group
- `INSUFFICIENT_PERMISSIONS` - User doesn't have permission (e.g., not admin)
- `MAX_MEMBERS_REACHED` - Group has reached maximum members
- `USER_ALREADY_IN_GROUP` - User is already a member of the group
- `MIN_MEMBERS_REQUIRED` - Group must have at least 2 members
- `CANNOT_REMOVE_LAST_ADMIN` - Cannot remove the last admin from group
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
GET /users/suggestions?type=group&page=1&limit=20&sort=createdAt&order=desc
```

---

## 🎯 Notes

1. **Display Name**: Display name chỉ áp dụng cho conversation này, không thay đổi nickname của user
2. **Block User**: Khi block user, họ không thể gửi message, xem posts, hoặc tìm profile của bạn
3. **Block Notification**: User bị block sẽ không nhận được thông báo
4. **Report Chat**: Reports được review bởi admin team
5. **Group Creation**: Group phải có ít nhất 2 members (creator + 1 member)
6. **Group Roles**: Creator tự động là admin, có thể assign roles cho members
7. **Group Settings**: Admin có thể thay đổi group settings
8. **Mute Notifications**: Mute chỉ áp dụng cho conversation/group này
9. **Gift Sounds**: Gift sounds chỉ áp dụng cho conversation này
10. **Blocked Users**: Blocked users không xuất hiện trong suggestions
11. **Group Members**: Admin có thể add/remove members, members có thể leave group
12. **Group Name**: Group name có thể được thay đổi bởi admin

---

## 🎨 UI Flow Documentation

### Chat Settings Flow

1. **Open Chat Settings**
   - User click 3 dots (ellipsis) trong chat header
   - Frontend gọi `GET /messages/:conversationId/settings`
   - Hiển thị settings screen với profile, options, và toggles

2. **Change Display Name**
   - User click "Change name"
   - Frontend hiển thị input với current display name
   - User edit và click checkmark
   - Frontend gọi `PATCH /messages/:conversationId/display-name`
   - Display name được update trong conversation

3. **Mute Notifications**
   - User toggle "Mute notifications" switch
   - Frontend gọi `PATCH /messages/:conversationId/notifications` với `enabled: false`
   - Notifications bị tắt cho conversation này

4. **Gift Sounds**
   - User toggle "Gift sounds" switch
   - Frontend gọi `PATCH /messages/:conversationId/gift-sounds` với `enabled: true/false`
   - Gift sounds được bật/tắt

5. **Block User**
   - User toggle "Block" switch
   - Frontend hiển thị confirmation modal với user info
   - User confirm
   - Frontend gọi `POST /users/:userId/block`
   - User bị block, conversation bị ẩn hoặc disabled

6. **Report Chat**
   - User click "Report chat"
   - Frontend hiển thị report modal với reasons
   - User select reason và optional description
   - Frontend gọi `POST /messages/:conversationId/report`
   - Hiển thị confirmation message: "Thank you! The post has been reported..."

### Create Group Chat Flow

1. **Open New Group Screen**
   - User click "Create a group chat" trong chat settings hoặc main menu
   - Frontend gọi `GET /users/suggestions?type=group`
   - Hiển thị new group screen với search bar và suggested users

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
   - Frontend có thể hiển thị dialog để đặt tên group (optional)
   - Frontend gọi `POST /groups` với memberIds
   - Backend tạo group và add members
   - WebSocket emit `group_created` event
   - Frontend navigate đến group chat screen

### Block User Flow

1. **Block Confirmation**
   - User toggle block switch trong chat settings
   - Frontend hiển thị confirmation modal:
     - User avatar và name
     - Explanation: "They will not be able to send you messages, see your posts, or find your profile. They will not receive a notification that you have blocked them."
     - "Block" button (pink)
   - User click "Block"
   - Frontend gọi `POST /users/:userId/block`
   - User bị block, conversation disabled

2. **Unblock User**
   - User có thể unblock từ blocked users list
   - Frontend gọi `DELETE /users/:userId/block`
   - User được unblock

---

## 🔄 Integration with Main Messaging API

### Blocked Users Filter

Blocked users không xuất hiện trong:
- Message suggestions
- Forward recipients
- Group suggestions
- Search results

### Group Chat Messages

Group chat messages sử dụng cùng message endpoints nhưng với `conversationId` là group ID:

```
POST /messages/:groupId/messages
GET /messages/:groupId/messages
```

### Conversation Settings

Settings được lưu per conversation và áp dụng cho:
- Notifications
- Gift sounds
- Display name
- Mute status

---

**Version:** 1.0  
**Last Updated:** 2025-01-15  
**Status:** ✅ Ready for Implementation

