# 👥⚙️ Group Chat Settings API Documentation

Tài liệu API cho tính năng Group Chat Settings (Cài đặt nhóm chat) trong hệ thống Messaging. Tài liệu này cung cấp các endpoints và JSON response mẫu để frontend và backend sử dụng thống nhất.

---

## 📋 Bảng Components

| Component            | Type    | API Endpoint                              | Notes                                                 |
| -------------------- | ------- | ----------------------------------------- | ----------------------------------------------------- |
| Group Chat Settings  | Screen  | `GET /groups/:group_id/settings`          | Hiển thị cài đặt group chat                           |
| Group Introduction   | Field   | `GET /groups/:group_id`                   | Hiển thị introduction của group                       |
| Edit Introduction    | Action  | `PATCH /groups/:group_id/introduction`    | Chỉnh sửa introduction của group                      |
| Change Group Name    | Action  | `PATCH /groups/:group_id/name`            | Đổi tên group                                         |
| Change Group Photo   | Action  | `PATCH /groups/:group_id/avatar`          | Đổi avatar/photo của group                            |
| Upload Group Photo   | Action  | `POST /upload/media` (type: group_avatar) | Upload photo cho group                                |
| Member List          | List    | `GET /groups/:group_id/members`           | Xem danh sách members (10/120)                        |
| Group Classification | Field   | `GET /groups/:group_id/classification`    | Xem classification của group                          |
| Mute Notifications   | Toggle  | `PATCH /groups/:group_id/notifications`   | Bật/tắt thông báo cho group                           |
| Gift Effect          | Toggle  | `PATCH /groups/:group_id/gift-effect`     | Bật/tắt gift effect cho group                         |
| Report Group         | Action  | `POST /groups/:group_id/report`           | Báo cáo group                                         |
| Leave Group          | Action  | `DELETE /groups/:group_id/members/me`     | Rời khỏi group                                        |
| Group Info Display   | Display | `GET /groups/:group_id`                   | Hiển thị thông tin group (name, avatar, member count) |

---

## 🔌 API Endpoints

| Method | Endpoint                           | Response                         | Note                              |
| ------ | ---------------------------------- | -------------------------------- | --------------------------------- |
| GET    | `/groups/:group_id/settings`       | `GroupSettingsResponse`          | Lấy cài đặt group chat            |
| GET    | `/groups/:group_id`                | `GroupDetailResponse`            | Lấy thông tin chi tiết group      |
| PATCH  | `/groups/:group_id/introduction`   | `UpdateIntroductionResponse`     | Cập nhật introduction của group   |
| PATCH  | `/groups/:group_id/name`           | `UpdateGroupNameResponse`        | Đổi tên group                     |
| PATCH  | `/groups/:group_id/avatar`         | `UpdateGroupAvatarResponse`      | Đổi avatar của group              |
| POST   | `/upload/media` (group_avatar)     | `UploadGroupAvatarResponse`      | Upload avatar cho group           |
| GET    | `/groups/:group_id/members`        | `GroupMembersResponse`           | Lấy danh sách members trong group |
| GET    | `/groups/:group_id/classification` | `GroupClassificationResponse`    | Lấy classification của group      |
| PATCH  | `/groups/:group_id/notifications`  | `MuteGroupNotificationsResponse` | Bật/tắt thông báo cho group       |
| PATCH  | `/groups/:group_id/gift-effect`    | `GiftEffectResponse`             | Bật/tắt gift effect cho group     |
| POST   | `/groups/:group_id/report`         | `ReportGroupResponse`            | Báo cáo group                     |
| DELETE | `/groups/:group_id/members/me`     | `LeaveGroupResponse`             | Rời khỏi group                    |

---

## 📦 JSON Response Examples

### 1. GET /groups/:group_id/settings - Group Settings Response

**Response:**

```json
{
  "success": true,
  "data": {
    "group_id": "group-123",
    "name": "Study Group",
    "avatar": "https://example.com/group-avatar.jpg",
    "introduction": "- No spam, send the group link. No spam, send the group link... - No spam, send the group link.",
    "memberCount": 10,
    "maxMembers": 120,
    "memberListDisplay": "10/120",
    "classification": "education",
    "settings": {
      "notificationsEnabled": false,
      "isMuted": true,
      "giftEffectEnabled": true,
      "onlyAdminsCanPost": false,
      "onlyAdminsCanAddMembers": false
    },
    "currentUserRole": "admin",
    "canEditIntroduction": true,
    "canChangeName": true,
    "canChangePhoto": true,
    "canManageMembers": true,
    "canReport": true,
    "canLeave": true
  },
  "timestamp": "2025-01-16T19:02:00Z"
}
```

### 2. GET /groups/:group_id - Group Detail Response

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "group-123",
    "name": "Study Group",
    "avatar": "https://example.com/group-avatar.jpg",
    "introduction": "- No spam, send the group link. No spam, send the group link... - No spam, send the group link.",
    "type": "group",
    "classification": "education",
    "createdBy": "current-user",
    "createdAt": "2025-01-15T10:39:00Z",
    "updatedAt": "2025-01-16T19:02:00Z",
    "memberCount": 10,
    "maxMembers": 120,
    "settings": {
      "notificationsEnabled": false,
      "isMuted": true,
      "giftEffectEnabled": true,
      "onlyAdminsCanPost": false,
      "onlyAdminsCanAddMembers": false
    },
    "currentUserRole": "admin",
    "isMember": true
  },
  "timestamp": "2025-01-16T19:02:00Z"
}
```

### 3. PATCH /groups/:group_id/introduction - Update Introduction Request & Response

**Request Body:**

```json
{
  "introduction": "- No spam, send the group link. No spam, send the group link... - No spam, send the group link."
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "group_id": "group-123",
    "introduction": "- No spam, send the group link. No spam, send the group link... - No spam, send the group link.",
    "updatedAt": "2025-01-16T19:05:00Z",
    "updatedBy": "current-user"
  },
  "message": "Introduction updated successfully",
  "timestamp": "2025-01-16T19:05:00Z"
}
```

### 4. PATCH /groups/:group_id/name - Update Group Name Request & Response

**Request Body:**

```json
{
  "name": "Study Group Updated"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "group_id": "group-123",
    "name": "Study Group Updated",
    "updatedAt": "2025-01-16T19:06:00Z",
    "updatedBy": "current-user"
  },
  "message": "Group name updated successfully",
  "timestamp": "2025-01-16T19:06:00Z"
}
```

### 5. POST /upload/media - Upload Group Avatar Request & Response

**Request:** `multipart/form-data`

**Form Data:**

- `file` - Image file
- `type` - `group_avatar`
- `group_id` - Group ID

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "media-301",
    "url": "https://example.com/uploads/group-avatar-123.jpg",
    "thumbnail": "https://example.com/uploads/thumb-group-avatar-123.jpg",
    "type": "group_avatar",
    "size": 2048000,
    "width": 1920,
    "height": 1920,
    "group_id": "group-123",
    "createdAt": "2025-01-16T19:07:00Z"
  },
  "message": "Group avatar uploaded successfully",
  "timestamp": "2025-01-16T19:07:00Z"
}
```

### 6. PATCH /groups/:group_id/avatar - Update Group Avatar Request & Response

**Request Body:**

```json
{
  "avatarUrl": "https://example.com/uploads/group-avatar-123.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "group_id": "group-123",
    "avatar": "https://example.com/uploads/group-avatar-123.jpg",
    "updatedAt": "2025-01-16T19:07:00Z",
    "updatedBy": "current-user"
  },
  "message": "Group avatar updated successfully",
  "timestamp": "2025-01-16T19:07:00Z"
}
```

### 7. GET /groups/:group_id/members - Group Members Response

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
        "joinedAt": "2025-01-15T10:39:00Z",
        "isOnline": true
      },
      {
        "id": "user-1",
        "nickname": "Abram Mango",
        "avatar": "https://example.com/avatar1.jpg",
        "role": "member",
        "joinedAt": "2025-01-15T10:40:00Z",
        "isOnline": true
      },
      {
        "id": "user-2",
        "nickname": "Emerson Dokidis",
        "avatar": "https://example.com/avatar2.jpg",
        "role": "member",
        "joinedAt": "2025-01-15T10:41:00Z",
        "isOnline": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 10,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    },
    "summary": {
      "totalMembers": 10,
      "maxMembers": 120,
      "adminCount": 1,
      "memberCount": 9,
      "onlineCount": 5
    }
  },
  "timestamp": "2025-01-16T19:02:00Z"
}
```

### 8. GET /groups/:group_id/classification - Group Classification Response

**Response:**

```json
{
  "success": true,
  "data": {
    "group_id": "group-123",
    "classification": "education",
    "classificationName": "Education",
    "description": "Groups for educational purposes",
    "icon": "graduation-cap",
    "color": "#4CAF50"
  },
  "timestamp": "2025-01-16T19:02:00Z"
}
```

### 9. PATCH /groups/:group_id/notifications - Mute Group Notifications Request & Response

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
    "group_id": "group-123",
    "notificationsEnabled": false,
    "isMuted": true,
    "updatedAt": "2025-01-16T19:08:00Z"
  },
  "message": "Group notifications muted",
  "timestamp": "2025-01-16T19:08:00Z"
}
```

### 10. PATCH /groups/:group_id/gift-effect - Gift Effect Request & Response

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
    "group_id": "group-123",
    "giftEffectEnabled": true,
    "updatedAt": "2025-01-16T19:09:00Z"
  },
  "message": "Gift effect enabled",
  "timestamp": "2025-01-16T19:09:00Z"
}
```

### 11. POST /groups/:group_id/report - Report Group Request & Response

**Request Body:**

```json
{
  "reason": "inappropriate_content",
  "description": "Group contains inappropriate content"
}
```

**Available Reasons:**

- `inappropriate_content` - Inappropriate content
- `spam` - Spam
- `harassment` - Harassment
- `violence` - Violence
- `fake_news` - Fake news
- `other` - Other (requires description)

**Response:**

```json
{
  "success": true,
  "data": {
    "reportId": "report-301",
    "group_id": "group-123",
    "groupName": "Study Group",
    "reason": "inappropriate_content",
    "description": "Group contains inappropriate content",
    "reportedAt": "2025-01-16T19:10:00Z",
    "status": "pending"
  },
  "message": "Thank you! The group has been reported. We will review and handle it according to regulations.",
  "timestamp": "2025-01-16T19:10:00Z"
}
```

### 12. DELETE /groups/:group_id/members/me - Leave Group Response

**Response:**

```json
{
  "success": true,
  "data": {
    "group_id": "group-123",
    "groupName": "Study Group",
    "leftAt": "2025-01-16T19:11:00Z",
    "newMemberCount": 9
  },
  "message": "You have left the group",
  "timestamp": "2025-01-16T19:11:00Z"
}
```

**Note:** Nếu user là admin duy nhất, group sẽ không thể bị xóa. User cần transfer admin role trước khi leave.

---

## 🔄 WebSocket Events

### Group Settings Updated Event

**Event:** `group_settings_updated`

**Payload:**

```json
{
  "group_id": "group-123",
  "settings": {
    "notificationsEnabled": false,
    "isMuted": true,
    "giftEffectEnabled": true,
    "introduction": "- No spam, send the group link...",
    "name": "Study Group Updated"
  },
  "updatedBy": "current-user",
  "updatedAt": "2025-01-16T19:05:00Z"
}
```

### Group Name Changed Event

**Event:** `group_name_changed`

**Payload:**

```json
{
  "group_id": "group-123",
  "oldName": "Study Group",
  "newName": "Study Group Updated",
  "changedBy": "current-user",
  "changedAt": "2025-01-16T19:06:00Z"
}
```

### Group Avatar Changed Event

**Event:** `group_avatar_changed`

**Payload:**

```json
{
  "group_id": "group-123",
  "avatar": "https://example.com/uploads/group-avatar-123.jpg",
  "changedBy": "current-user",
  "changedAt": "2025-01-16T19:07:00Z"
}
```

### Group Introduction Updated Event

**Event:** `group_introduction_updated`

**Payload:**

```json
{
  "group_id": "group-123",
  "introduction": "- No spam, send the group link...",
  "updatedBy": "current-user",
  "updatedAt": "2025-01-16T19:05:00Z"
}
```

### Member Left Group Event

**Event:** `member_left_group`

**Payload:**

```json
{
  "group_id": "group-123",
  "groupName": "Study Group",
  "userId": "current-user",
  "userName": "You",
  "leftAt": "2025-01-16T19:11:00Z",
  "newMemberCount": 9
}
```

---

## 📝 Request/Response Types

### Group Classifications

- `education` - Education groups
- `business` - Business groups
- `social` - Social groups
- `entertainment` - Entertainment groups
- `sports` - Sports groups
- `technology` - Technology groups
- `other` - Other groups

### Group Member Roles

- `admin` - Group administrator
- `moderator` - Group moderator
- `member` - Regular member

### Report Reasons

- `inappropriate_content` - Inappropriate content
- `spam` - Spam
- `harassment` - Harassment
- `violence` - Violence
- `fake_news` - Fake news
- `other` - Other (requires description)

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
  "timestamp": "2025-01-16T19:02:00Z"
}
```

### Common Error Codes

- `UNAUTHORIZED` - Missing or invalid token
- `FORBIDDEN` - User doesn't have permission
- `NOT_FOUND` - Resource not found (group)
- `VALIDATION_ERROR` - Request validation failed
- `NOT_GROUP_MEMBER` - User is not a member of the group
- `INSUFFICIENT_PERMISSIONS` - User doesn't have permission (e.g., not admin)
- `CANNOT_LEAVE_AS_LAST_ADMIN` - Cannot leave group as the last admin
- `ALREADY_REPORTED` - Group already reported
- `MEDIA_UPLOAD_FAILED` - Media upload failed
- `INVALID_MEDIA_TYPE` - Invalid media type
- `MEDIA_SIZE_EXCEEDED` - Media file size exceeds limit
- `GROUP_NAME_TOO_LONG` - Group name exceeds maximum length
- `INTRODUCTION_TOO_LONG` - Introduction exceeds maximum length
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_SERVER_ERROR` - Server error

---

## 📊 Pagination

Các list endpoints hỗ trợ pagination với query parameters:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 100)
- `sort` - Sort field (default: `joinedAt`)
- `order` - Sort order: `asc` or `desc` (default: `asc`)

**Example:**

```
GET /groups/:group_id/members?page=1&limit=50&sort=joinedAt&order=asc
```

---

## 🎯 Notes

1. **Group Introduction**: Introduction có thể được edit bởi admin, hiển thị trong settings
2. **Group Name**: Group name có thể được thay đổi bởi admin
3. **Group Avatar**: Group avatar có thể upload và thay đổi bởi admin
4. **Member List**: Hiển thị member count (e.g., "10/120") với pagination
5. **Group Classification**: Classification định nghĩa loại group (education, business, etc.)
6. **Mute Notifications**: Mute chỉ áp dụng cho user hiện tại, không ảnh hưởng group
7. **Gift Effect**: Gift effect enable/disable cho group
8. **Report Group**: Reports được review bởi admin team
9. **Leave Group**: User có thể leave group, nhưng không thể leave nếu là admin duy nhất
10. **Permissions**: Chỉ admin có thể edit introduction, name, photo, và manage members

---

## 🎨 UI Flow Documentation

### Edit Introduction Flow

1. **Open Edit Introduction**
   - User click "Introduction" trong group settings
   - Frontend hiển thị edit screen với current introduction
   - Keyboard hiển thị để type

2. **Edit Introduction**
   - User edit introduction text
   - User click checkmark để save
   - Frontend gọi `PATCH /groups/:group_id/introduction`
   - Introduction được update
   - WebSocket emit `group_introduction_updated` event

### Change Group Name/Photo Flow

1. **Open Change Name/Photo**
   - User click "Change the name or the group photo" trong settings
   - Frontend hiển thị edit screen với current name và avatar

2. **Change Group Name**
   - User edit name trong input field
   - User click "Xong" (Done) button
   - Frontend gọi `PATCH /groups/:group_id/name`
   - Group name được update
   - WebSocket emit `group_name_changed` event

3. **Change Group Photo**
   - User click "Upload photo" button
   - Frontend mở image picker
   - User select image
   - Frontend upload qua `POST /upload/media` với `type: group_avatar`
   - Frontend gọi `PATCH /groups/:group_id/avatar` với `avatarUrl`
   - Group avatar được update
   - WebSocket emit `group_avatar_changed` event

### Mute Notifications Flow

1. **Toggle Mute**
   - User toggle "Mute notifications" switch trong settings
   - Frontend gọi `PATCH /groups/:group_id/notifications` với `enabled: false`
   - Notifications bị tắt cho group này

### Gift Effect Flow

1. **Toggle Gift Effect**
   - User toggle "Gift effect" switch trong settings
   - Frontend gọi `PATCH /groups/:group_id/gift-effect` với `enabled: true/false`
   - Gift effect được bật/tắt

### Report Group Flow

1. **Report Group**
   - User click "Report chat" trong settings
   - Frontend hiển thị report modal với reasons
   - User select reason và optional description
   - Frontend gọi `POST /groups/:group_id/report`
   - Hiển thị confirmation message

### Leave Group Flow

1. **Leave Group**
   - User click "Leave the group" trong settings
   - Frontend hiển thị confirmation dialog
   - User confirm
   - Frontend gọi `DELETE /groups/:group_id/members/me`
   - User rời khỏi group
   - WebSocket emit `member_left_group` event
   - Frontend navigate về messages list

---

## 🔄 Integration with Main Messaging API

### Group Settings Integration

Group settings được lưu per group và áp dụng cho:

- Notifications (per user)
- Gift effect (group-wide)
- Introduction (group-wide)
- Name and avatar (group-wide)

### Member List Display

Member list hiển thị:

- Member count vs max members (e.g., "10/120")
- Pagination cho large groups
- Role indicators (admin, moderator, member)
- Online status

### System Messages

Khi group settings thay đổi, system messages được tạo:

- "You named the group 'Study Group'"
- "You have changed the group photo"
- "You updated the group introduction"

---

**Version:** 1.0  
**Last Updated:** 2025-01-16  
**Status:** ✅ Ready for Implementation
