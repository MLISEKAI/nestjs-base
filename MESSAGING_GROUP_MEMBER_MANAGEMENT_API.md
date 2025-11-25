# 👥👤 Group Member Management API Documentation

Tài liệu API cho tính năng Group Member Management (Quản lý thành viên nhóm) trong hệ thống Messaging. Tài liệu này cung cấp các endpoints và JSON response mẫu để frontend và backend sử dụng thống nhất.

---

## 📋 Bảng Components

| Component                | Type   | API Endpoint                                                         | Notes                                           |
| ------------------------ | ------ | -------------------------------------------------------------------- | ----------------------------------------------- |
| Member List Screen       | Screen | `GET /groups/:groupId/members`                                       | Hiển thị danh sách members với filters          |
| Member List Tabs         | Filter | `GET /groups/:groupId/members?role={role}`                           | Filter members theo role (All, Administrator)   |
| Member Item              | Item   | -                                                                    | Component hiển thị member trong list            |
| Add Member Button        | Button | `POST /groups/:groupId/members`                                      | Button "+" để thêm members                      |
| Member Actions Menu      | Menu   | -                                                                    | Context menu khi click vào member               |
| Assign Administrator     | Action | `PATCH /groups/:groupId/members/:userId/role`                        | Assign member làm administrator                 |
| Remove Administrator     | Action | `PATCH /groups/:groupId/members/:userId/role`                        | Remove administrator role từ member             |
| Send Message to Member   | Action | `POST /messages`                                                     | Tạo conversation với member                     |
| View Member Profile      | Action | `GET /users/:userId`                                                 | Xem profile của member                          |
| Remove Member            | Action | `DELETE /groups/:groupId/members/:userId`                            | Xóa member khỏi group                           |
| Member Role Badge        | Badge  | -                                                                    | Hiển thị role của member (Owner, Admin, Member) |
| More People Modal        | Modal  | `GET /users/suggestions?type=group&excludeGroup={groupId}`           | Modal "More people" để add members              |
| Search Users for Group   | Search | `GET /users/suggestions?q={query}&type=group&excludeGroup={groupId}` | Tìm kiếm users để add vào group                 |
| Leave Group Button       | Button | `DELETE /groups/:groupId/members/me`                                 | Button "Leave the group" trong settings         |
| Leave Group Confirmation | Dialog | -                                                                    | Confirmation dialog khi leave group             |
| Group Classification     | Field  | `GET /groups/classifications`                                        | Lấy danh sách classifications                   |
| Classification Modal     | Modal  | `PATCH /groups/:groupId/classification`                              | Modal để chọn classification                    |
| Classification Badge     | Badge  | -                                                                    | Hiển thị classification trong group header      |

---

## 🔌 API Endpoints

| Method | Endpoint                                                         | Response                         | Note                                                    |
| ------ | ---------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------- |
| GET    | `/groups/:groupId/members`                                       | `GroupMembersResponse`           | Lấy danh sách members trong group                       |
| GET    | `/groups/:groupId/members?role={role}`                           | `GroupMembersResponse`           | Filter members theo role (all, admin, member)           |
| POST   | `/groups/:groupId/members`                                       | `AddGroupMembersResponse`        | Thêm members vào group                                  |
| DELETE | `/groups/:groupId/members/:userId`                               | `RemoveGroupMemberResponse`      | Xóa member khỏi group                                   |
| PATCH  | `/groups/:groupId/members/:userId/role`                          | `UpdateMemberRoleResponse`       | Thay đổi role của member (assign/remove admin)          |
| GET    | `/users/:userId`                                                 | `UserProfileResponse`            | Lấy thông tin user profile                              |
| POST   | `/messages`                                                      | `CreateConversationResponse`     | Tạo conversation với member                             |
| GET    | `/groups/:groupId/members/summary`                               | `MemberSummaryResponse`          | Lấy summary về members (counts, roles)                  |
| GET    | `/users/suggestions?type=group&excludeGroup={groupId}`           | `GroupMemberSuggestionsResponse` | Lấy suggested users để add vào group (exclude existing) |
| GET    | `/users/suggestions?q={query}&type=group&excludeGroup={groupId}` | `GroupMemberSuggestionsResponse` | Search users để add vào group                           |
| DELETE | `/groups/:groupId/members/me`                                    | `LeaveGroupResponse`             | Rời khỏi group (self-initiated)                         |
| GET    | `/groups/classifications`                                        | `GroupClassificationsResponse`   | Lấy danh sách classifications                           |
| PATCH  | `/groups/:groupId/classification`                                | `UpdateClassificationResponse`   | Cập nhật classification của group                       |

---

## 📦 JSON Response Examples

### 1. GET /groups/:groupId/members - Group Members Response

**Query Parameters:**

- `role` (optional) - Filter by role: `all`, `admin`, `member`, `owner`
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 50)

**Response:**

```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "user-1",
        "nickname": "Alena Franci",
        "avatar": "https://example.com/avatar1.jpg",
        "role": "owner",
        "roleDisplay": "Owner",
        "joinedAt": "2025-01-15T10:39:00Z",
        "isOnline": true,
        "canManage": false
      },
      {
        "id": "user-2",
        "nickname": "Alena Mango",
        "avatar": "https://example.com/avatar2.jpg",
        "role": "admin",
        "roleDisplay": "Admin",
        "joinedAt": "2025-01-15T10:40:00Z",
        "isOnline": false,
        "canManage": true
      },
      {
        "id": "user-3",
        "nickname": "Brandon Lipshutz",
        "avatar": "https://example.com/avatar3.jpg",
        "role": "member",
        "roleDisplay": "Member",
        "joinedAt": "2025-01-15T10:41:00Z",
        "isOnline": true,
        "canManage": true
      },
      {
        "id": "user-4",
        "nickname": "Justin Korsgaard",
        "avatar": "https://example.com/avatar4.jpg",
        "role": "member",
        "roleDisplay": "Member",
        "joinedAt": "2025-01-15T10:42:00Z",
        "isOnline": false,
        "canManage": true
      },
      {
        "id": "user-5",
        "nickname": "Cheyenne Westervelt",
        "avatar": "https://example.com/avatar5.jpg",
        "role": "member",
        "roleDisplay": "Member",
        "joinedAt": "2025-01-15T10:43:00Z",
        "isOnline": true,
        "canManage": true
      },
      {
        "id": "user-6",
        "nickname": "Skylar Korsgaard",
        "avatar": "https://example.com/avatar6.jpg",
        "role": "member",
        "roleDisplay": "Member",
        "joinedAt": "2025-01-15T10:44:00Z",
        "isOnline": false,
        "canManage": true
      },
      {
        "id": "user-7",
        "nickname": "Jaydon Dokidis",
        "avatar": "https://example.com/avatar7.jpg",
        "role": "member",
        "roleDisplay": "Member",
        "joinedAt": "2025-01-15T10:45:00Z",
        "isOnline": true,
        "canManage": true
      },
      {
        "id": "user-8",
        "nickname": "Brandon Aminoff",
        "avatar": "https://example.com/avatar8.jpg",
        "role": "member",
        "roleDisplay": "Member",
        "joinedAt": "2025-01-15T10:46:00Z",
        "isOnline": false,
        "canManage": true
      },
      {
        "id": "user-9",
        "nickname": "Skylar Septimus",
        "avatar": "https://example.com/avatar9.jpg",
        "role": "member",
        "roleDisplay": "Member",
        "joinedAt": "2025-01-15T10:47:00Z",
        "isOnline": true,
        "canManage": true
      },
      {
        "id": "user-10",
        "nickname": "Gustavo Saris",
        "avatar": "https://example.com/avatar10.jpg",
        "role": "member",
        "roleDisplay": "Member",
        "joinedAt": "2025-01-15T10:48:00Z",
        "isOnline": false,
        "canManage": true
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
      "ownerCount": 1,
      "adminCount": 1,
      "memberCount": 8,
      "onlineCount": 5
    }
  },
  "timestamp": "2025-01-16T19:02:00Z"
}
```

### 2. GET /groups/:groupId/members?role=admin - Filter Members by Role Response

**Response:**

```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "user-1",
        "nickname": "Alena Franci",
        "avatar": "https://example.com/avatar1.jpg",
        "role": "owner",
        "roleDisplay": "Owner",
        "joinedAt": "2025-01-15T10:39:00Z",
        "isOnline": true,
        "canManage": false
      },
      {
        "id": "user-2",
        "nickname": "Alena Mango",
        "avatar": "https://example.com/avatar2.jpg",
        "role": "admin",
        "roleDisplay": "Admin",
        "joinedAt": "2025-01-15T10:40:00Z",
        "isOnline": false,
        "canManage": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 2,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    },
    "filter": {
      "role": "admin",
      "includesOwner": true
    },
    "summary": {
      "totalMembers": 2,
      "ownerCount": 1,
      "adminCount": 1
    }
  },
  "timestamp": "2025-01-16T19:02:00Z"
}
```

### 3. POST /groups/:groupId/members - Add Group Members Request & Response

**Request Body:**

```json
{
  "memberIds": ["user-11", "user-12"]
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
        "id": "user-11",
        "nickname": "Ann Botosh",
        "avatar": "https://example.com/avatar11.jpg",
        "role": "member",
        "joinedAt": "2025-01-16T19:15:00Z"
      },
      {
        "id": "user-12",
        "nickname": "Emerson Dokidis",
        "avatar": "https://example.com/avatar12.jpg",
        "role": "member",
        "joinedAt": "2025-01-16T19:15:00Z"
      }
    ],
    "totalAdded": 2,
    "newMemberCount": 12
  },
  "message": "Members added successfully",
  "timestamp": "2025-01-16T19:15:00Z"
}
```

### 4. DELETE /groups/:groupId/members/:userId - Remove Group Member Response

**Response:**

```json
{
  "success": true,
  "data": {
    "groupId": "group-123",
    "removedUserId": "user-4",
    "removedUserName": "Emerson Dokidis",
    "removedBy": "current-user",
    "removedAt": "2025-01-16T19:20:00Z",
    "newMemberCount": 9
  },
  "message": "Member removed successfully",
  "timestamp": "2025-01-16T19:20:00Z"
}
```

### 5. PATCH /groups/:groupId/members/:userId/role - Assign Administrator Request & Response

**Request Body:**

```json
{
  "role": "admin"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "groupId": "group-123",
    "userId": "user-4",
    "userName": "Justin Korsgaard",
    "oldRole": "member",
    "newRole": "admin",
    "roleDisplay": "Admin",
    "updatedBy": "current-user",
    "updatedAt": "2025-01-16T19:25:00Z"
  },
  "message": "Member assigned as administrator",
  "timestamp": "2025-01-16T19:25:00Z"
}
```

### 6. PATCH /groups/:groupId/members/:userId/role - Remove Administrator Request & Response

**Request Body:**

```json
{
  "role": "member"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "groupId": "group-123",
    "userId": "user-4",
    "userName": "Justin Korsgaard",
    "oldRole": "admin",
    "newRole": "member",
    "roleDisplay": "Member",
    "updatedBy": "current-user",
    "updatedAt": "2025-01-16T19:30:00Z"
  },
  "message": "Administrator role removed",
  "timestamp": "2025-01-16T19:30:00Z"
}
```

### 7. GET /groups/:groupId/members/summary - Member Summary Response

**Response:**

```json
{
  "success": true,
  "data": {
    "groupId": "group-123",
    "summary": {
      "totalMembers": 10,
      "maxMembers": 120,
      "memberListDisplay": "10/120",
      "ownerCount": 1,
      "adminCount": 1,
      "memberCount": 8,
      "onlineCount": 5,
      "offlineCount": 5
    },
    "roles": {
      "owner": 1,
      "admin": 1,
      "member": 8
    }
  },
  "timestamp": "2025-01-16T19:02:00Z"
}
```

### 8. POST /messages - Create Conversation with Member Request & Response

**Request Body:**

```json
{
  "participantId": "user-4",
  "type": "direct",
  "source": "group_member"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "conv-127",
    "type": "direct",
    "participants": [
      {
        "id": "current-user",
        "nickname": "You",
        "avatar": "https://example.com/my-avatar.jpg"
      },
      {
        "id": "user-4",
        "nickname": "Justin Korsgaard",
        "avatar": "https://example.com/avatar4.jpg"
      }
    ],
    "createdAt": "2025-01-16T19:35:00Z"
  },
  "message": "Conversation created successfully",
  "timestamp": "2025-01-16T19:35:00Z"
}
```

### 9. GET /users/suggestions?type=group&excludeGroup=group-123 - More People Suggestions Response

**Query Parameters:**

- `type` - `group`
- `excludeGroup` - Group ID để exclude existing members
- `q` (optional) - Search query
- `page` (optional) - Page number
- `limit` (optional) - Items per page

**Response:**

```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "id": "user-11",
        "nickname": "Abram Mango",
        "avatar": "https://example.com/avatar11.jpg",
        "bio": "Striving for excellence, embracing challenges...",
        "isOnline": true,
        "type": "premium",
        "typeIcon": "P",
        "typeIconColor": "pink",
        "mutualFriends": 5,
        "hasConversation": true,
        "conversationId": "conv-123",
        "isInGroup": false
      },
      {
        "id": "user-12",
        "nickname": "Kierra Curtis",
        "avatar": "https://example.com/avatar12.jpg",
        "bio": "Striving for excellence, embracing challenges...",
        "isOnline": false,
        "type": "male",
        "typeIcon": "♂",
        "typeIconColor": "blue",
        "mutualFriends": 3,
        "hasConversation": false,
        "isInGroup": false
      },
      {
        "id": "user-13",
        "nickname": "Emerson Dokidis",
        "avatar": "https://example.com/avatar13.jpg",
        "bio": "Striving for excellence, embracing challenges...",
        "isOnline": true,
        "type": "male",
        "typeIcon": "♂",
        "typeIconColor": "blue",
        "mutualFriends": 2,
        "hasConversation": true,
        "conversationId": "conv-124",
        "isInGroup": false
      },
      {
        "id": "user-14",
        "nickname": "Ann Botosh",
        "avatar": "https://example.com/avatar14.jpg",
        "bio": "Striving for excellence, embracing challenges...",
        "isOnline": false,
        "type": "premium",
        "typeIcon": "P",
        "typeIconColor": "pink",
        "mutualFriends": 1,
        "hasConversation": false,
        "isInGroup": false
      },
      {
        "id": "user-15",
        "nickname": "Carter Lipshutz",
        "avatar": "https://example.com/avatar15.jpg",
        "bio": "Striving for excellence, embracing challenges...",
        "isOnline": true,
        "type": "premium",
        "typeIcon": "P",
        "typeIconColor": "pink",
        "mutualFriends": 4,
        "hasConversation": false,
        "isInGroup": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    },
    "excludedGroupId": "group-123"
  },
  "timestamp": "2025-01-16T19:02:00Z"
}
```

### 10. POST /groups/:groupId/members - Add Members from More People Request & Response

**Request Body:**

```json
{
  "memberIds": ["user-11", "user-12"]
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
        "id": "user-11",
        "nickname": "Abram Mango",
        "avatar": "https://example.com/avatar11.jpg",
        "role": "member",
        "joinedAt": "2025-01-16T19:45:00Z"
      },
      {
        "id": "user-12",
        "nickname": "Kierra Curtis",
        "avatar": "https://example.com/avatar12.jpg",
        "role": "member",
        "joinedAt": "2025-01-16T19:45:00Z"
      }
    ],
    "totalAdded": 2,
    "newMemberCount": 12,
    "systemMessage": "You added Abram Mango and Kierra Curtis to the group"
  },
  "message": "Members added successfully",
  "timestamp": "2025-01-16T19:45:00Z"
}
```

**Note:** Nếu add multiple members, system message sẽ combine: "You added [user1] and [user2] to the group"

### 11. DELETE /groups/:groupId/members/me - Leave Group Response

**Response:**

```json
{
  "success": true,
  "data": {
    "groupId": "group-123",
    "groupName": "Study Group",
    "leftAt": "2025-01-16T19:50:00Z",
    "newMemberCount": 9,
    "canRejoin": true
  },
  "message": "You have left the group",
  "timestamp": "2025-01-16T19:50:00Z"
}
```

**Note:** Sau khi leave, user không thể send/receive messages trong group. System message: "You has left the group"

### 12. GET /groups/classifications - Group Classifications Response

**Response:**

```json
{
  "success": true,
  "data": {
    "classifications": [
      {
        "id": "games",
        "name": "Games",
        "icon": "game-controller",
        "color": "#2196F3",
        "description": "Groups for gaming and entertainment"
      },
      {
        "id": "making_friends",
        "name": "Making friends",
        "icon": "heart-pulse",
        "color": "#E91E63",
        "description": "Groups for making new friends"
      },
      {
        "id": "enjoyment",
        "name": "Enjoyment",
        "icon": "ice-cream",
        "color": "#FF9800",
        "description": "Groups for fun and enjoyment"
      },
      {
        "id": "entertainment",
        "name": "Entertainment",
        "icon": "film",
        "color": "#9C27B0",
        "description": "Groups for entertainment content"
      },
      {
        "id": "learning",
        "name": "Learning",
        "icon": "book-open",
        "color": "#F44336",
        "description": "Groups for learning and education"
      },
      {
        "id": "networking",
        "name": "Networking",
        "icon": "briefcase",
        "color": "#673AB7",
        "description": "Groups for professional networking"
      },
      {
        "id": "others",
        "name": "Others",
        "icon": "settings",
        "color": "#607D8B",
        "description": "Other types of groups"
      }
    ]
  },
  "timestamp": "2025-01-16T19:02:00Z"
}
```

### 13. PATCH /groups/:groupId/classification - Update Group Classification Request & Response

**Request Body:**

```json
{
  "classification": "learning"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "groupId": "group-123",
    "groupName": "Study Group",
    "oldClassification": null,
    "newClassification": "learning",
    "classificationName": "Learning",
    "classificationIcon": "book-open",
    "classificationColor": "#F44336",
    "updatedBy": "current-user",
    "updatedAt": "2025-01-16T19:55:00Z"
  },
  "message": "Group classification updated successfully",
  "timestamp": "2025-01-16T19:55:00Z"
}
```

**Note:** Classification hiển thị trong group header (e.g., "Study Group" với "2 people Learning")

---

## 🔄 WebSocket Events

### Member Added Event

**Event:** `group_member_added`

**Payload:**

```json
{
  "groupId": "group-123",
  "groupName": "Study Group",
  "addedUserId": "user-11",
  "addedUserName": "Ann Botosh",
  "addedBy": "current-user",
  "addedAt": "2025-01-16T19:15:00Z",
  "newMemberCount": 12
}
```

### Member Removed Event

**Event:** `group_member_removed`

**Payload:**

```json
{
  "groupId": "group-123",
  "groupName": "Study Group",
  "removedUserId": "user-4",
  "removedUserName": "Emerson Dokidis",
  "removedBy": "current-user",
  "removedAt": "2025-01-16T19:20:00Z",
  "newMemberCount": 9
}
```

### Member Role Updated Event

**Event:** `group_member_role_updated`

**Payload:**

```json
{
  "groupId": "group-123",
  "userId": "user-4",
  "userName": "Justin Korsgaard",
  "oldRole": "member",
  "newRole": "admin",
  "updatedBy": "current-user",
  "updatedAt": "2025-01-16T19:25:00Z"
}
```

### Member Left Group Event

**Event:** `member_left_group`

**Payload:**

```json
{
  "groupId": "group-123",
  "groupName": "Study Group",
  "userId": "user-3",
  "userName": "Abram Mango",
  "leftAt": "2025-01-16T19:40:00Z",
  "newMemberCount": 8
}
```

### Group Classification Updated Event

**Event:** `group_classification_updated`

**Payload:**

```json
{
  "groupId": "group-123",
  "groupName": "Study Group",
  "oldClassification": null,
  "newClassification": "learning",
  "classificationName": "Learning",
  "updatedBy": "current-user",
  "updatedAt": "2025-01-16T19:55:00Z"
}
```

---

## 📝 Request/Response Types

### Member Roles

- `owner` - Group owner (cannot be changed)
- `admin` - Group administrator
- `member` - Regular member

### Role Filter Values

- `all` - All members (includes owner, admin, member)
- `admin` - Administrators only (includes owner and admin)
- `member` - Regular members only

### Member Actions

- `assign_admin` - Assign as administrator
- `remove_admin` - Remove administrator role
- `send_message` - Send a message to member
- `view_profile` - View member profile
- `remove_member` - Remove from group

### Group Classifications

- `games` - Games (blue, game controller icon)
- `making_friends` - Making friends (pink, heart pulse icon)
- `enjoyment` - Enjoyment (orange, ice cream icon)
- `entertainment` - Entertainment (purple, film icon)
- `learning` - Learning (red, book icon)
- `networking` - Networking (purple, briefcase icon)
- `others` - Others (grey, settings icon)

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
- `NOT_FOUND` - Resource not found (group, member, user)
- `VALIDATION_ERROR` - Request validation failed
- `NOT_GROUP_MEMBER` - User is not a member of the group
- `INSUFFICIENT_PERMISSIONS` - User doesn't have permission (e.g., not admin/owner)
- `CANNOT_REMOVE_OWNER` - Cannot remove group owner
- `CANNOT_CHANGE_OWNER_ROLE` - Cannot change owner role
- `CANNOT_REMOVE_LAST_ADMIN` - Cannot remove the last admin
- `CANNOT_REMOVE_SELF` - Cannot remove yourself (use leave group instead)
- `USER_ALREADY_IN_GROUP` - User is already a member of the group
- `MAX_MEMBERS_REACHED` - Group has reached maximum members
- `ALREADY_ADMIN` - User is already an administrator
- `NOT_ADMIN` - User is not an administrator (cannot remove admin role)
- `CANNOT_LEAVE_AS_LAST_ADMIN` - Cannot leave group as the last admin
- `CANNOT_LEAVE_AS_OWNER` - Owner cannot leave group (must transfer ownership first)
- `INVALID_CLASSIFICATION` - Invalid classification ID
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_SERVER_ERROR` - Server error

---

## 📊 Pagination

Các list endpoints hỗ trợ pagination với query parameters:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 100)
- `sort` - Sort field (default: `joinedAt`)
- `order` - Sort order: `asc` or `desc` (default: `asc`)
- `role` - Filter by role: `all`, `admin`, `member`

**Example:**

```
GET /groups/:groupId/members?page=1&limit=50&role=admin&sort=joinedAt&order=asc
```

---

## 🎯 Notes

1. **Member Roles**: Owner, Admin, Member - Owner không thể bị thay đổi role hoặc remove
2. **Role Filters**: Tab "All" hiển thị tất cả members, "Administrator" hiển thị owner + admin
3. **Member Actions**: Actions menu hiển thị khác nhau dựa trên role và permissions
4. **Assign Admin**: Chỉ owner/admin có thể assign admin role
5. **Remove Admin**: Chỉ owner có thể remove admin role
6. **Remove Member**: Admin/owner có thể remove members, nhưng không thể remove owner
7. **System Messages**: Mỗi action tạo system message trong group chat
8. **Member Count**: Hiển thị "10/120" (current/max) trong member list
9. **Online Status**: Members có online status indicator
10. **Permissions**: `canManage` field cho biết current user có thể manage member không
11. **More People Modal**: Exclude existing members khi suggest users để add
12. **Leave Group**: User không thể send/receive messages sau khi leave, cần được add lại
13. **Group Classification**: Classification hiển thị trong group header (e.g., "2 people Learning")
14. **System Messages**: Multiple members được combine trong một message

---

## 🎨 UI Flow Documentation

### View Member List Flow

1. **Open Member List**
   - User click "Member list (10/120)" trong group settings
   - Frontend gọi `GET /groups/:groupId/members`
   - Hiển thị member list với tabs "All" và "Administrator"

2. **Filter by Role**
   - User click tab "Administrator"
   - Frontend gọi `GET /groups/:groupId/members?role=admin`
   - Filter và hiển thị chỉ admin/owner members

### Member Actions Menu Flow

1. **Open Actions Menu**
   - User click vào member trong list
   - Frontend hiển thị context menu với actions:
     - "Assign as administrator" (nếu là member)
     - "Remove administrator role" (nếu là admin)
     - "Send a message"
     - "View profile"
     - "Remove from the group"

2. **Assign Administrator**
   - User click "Assign as administrator"
   - Frontend gọi `PATCH /groups/:groupId/members/:userId/role` với `role: "admin"`
   - Member role được update thành "Admin"
   - System message: "You have added [user] as a group administrator"
   - WebSocket emit `group_member_role_updated` event

3. **Remove Administrator**
   - User click "Remove administrator role"
   - Frontend gọi `PATCH /groups/:groupId/members/:userId/role` với `role: "member"`
   - Member role được update thành "Member"
   - System message: "You have removed [user] administrator status"
   - WebSocket emit `group_member_role_updated` event

4. **Send Message to Member**
   - User click "Send a message"
   - Frontend gọi `POST /messages` với `participantId`
   - Navigate đến conversation với member

5. **View Profile**
   - User click "View profile"
   - Frontend gọi `GET /users/:userId`
   - Navigate đến user profile screen

6. **Remove Member**
   - User click "Remove from the group"
   - Frontend hiển thị confirmation dialog
   - User confirm
   - Frontend gọi `DELETE /groups/:groupId/members/:userId`
   - Member bị remove khỏi group
   - System message: "You removed [user] from the group"
   - WebSocket emit `group_member_removed` event

### Add Members Flow (More People Modal)

1. **Open More People Modal**
   - User click "+" icon trong member list header
   - Frontend gọi `GET /users/suggestions?type=group&excludeGroup={groupId}`
   - Hiển thị modal "More people" với search bar và suggested users

2. **Search Users**
   - User type trong search bar
   - Frontend debounce và gọi `GET /users/suggestions?q={query}&type=group&excludeGroup={groupId}`
   - Filter và hiển thị matching users (exclude existing members)

3. **Select Members**
   - User click checkbox để select/deselect users
   - Selected users hiển thị ở top với 'x' để remove
   - "Start a group chat" button enable khi có ít nhất 1 member selected

4. **Add Members**
   - User click "Start a group chat" button (hoặc "Add" button)
   - Frontend gọi `POST /groups/:groupId/members` với `memberIds`
   - Members được add vào group
   - System message: "You added [user1] and [user2] to the group" (combined message)
   - WebSocket emit `group_member_added` events
   - Modal đóng, navigate về member list hoặc group chat

### Leave Group Flow

1. **Open Leave Group**
   - User click "Leave the group" trong group settings
   - Frontend hiển thị confirmation dialog:
     - Title: "Leave the group?"
     - Message: "Are you sure you want to leave this conversation? You will no longer receive new messages."
     - Buttons: "Cancel" (grey) và "Leave" (red)

2. **Confirm Leave**
   - User click "Leave" button
   - Frontend gọi `DELETE /groups/:groupId/members/me`
   - User rời khỏi group
   - System message: "You has left the group"
   - WebSocket emit `member_left_group` event
   - Frontend navigate về messages list
   - Group chat hiển thị banner: "Bạn không thể nhắn tin cho nhóm này" / "You have left this group and can no longer send or receive messages unless someone adds you back to the group."

### Group Classification Flow

1. **Open Classification Modal**
   - User click "Group classification" trong group settings
   - Frontend gọi `GET /groups/classifications`
   - Hiển thị modal với grid of classifications

2. **Select Classification**
   - User click classification (e.g., "Learning")
   - Classification được highlight với border
   - "Confirm" button enable (pink)

3. **Confirm Classification**
   - User click "Confirm" button
   - Frontend gọi `PATCH /groups/:groupId/classification` với `classification: "learning"`
   - Classification được update
   - Group header hiển thị: "Study Group" với "2 people Learning"
   - WebSocket emit `group_classification_updated` event
   - Modal đóng

---

## 🔄 Integration with Main Messaging API

### System Messages

Mỗi member action tạo system message trong group chat:

- "You added [user] to the group" (single)
- "You added [user1] and [user2] to the group" (multiple)
- "You removed [user] from the group"
- "[User] has left the group"
- "You has left the group" (self)
- "[User] removed You to the group" (bị remove bởi admin)
- "You have added [user] as a group administrator"
- "You have removed [user] administrator status"

### Member List Display

Member list hiển thị:

- Member count vs max (e.g., "10/120")
- Role badges (Owner, Admin, Member)
- Online status indicators
- Profile pictures và names
- Joined date

### Permissions

Actions menu items hiển thị dựa trên:

- Current user role (owner/admin/member)
- Target member role
- Group settings

---

**Version:** 1.0  
**Last Updated:** 2025-01-16  
**Status:** ✅ Ready for Implementation
