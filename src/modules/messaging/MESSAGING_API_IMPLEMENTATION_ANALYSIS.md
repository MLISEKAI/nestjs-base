# 📊 Messaging API - Phân Tích Implementation & Giải Pháp

File này phân tích code hiện tại so với API documentation và đưa ra giải pháp để implement đầy đủ.

---

## 🔍 Tổng Quan

### Code Hiện Tại vs API Documentation

| Category           | Code Hiện Tại                 | API Documentation | Status                |
| ------------------ | ----------------------------- | ----------------- | --------------------- |
| **Core Messaging** | 1 endpoint (POST /messages)   | 15 endpoints      | ❌ Thiếu 14 endpoints |
| **Groups**         | 11 endpoints (khác structure) | 10 endpoints      | ⚠️ Cần refactor       |
| **Gifts**          | 2 endpoints (catalog + send)  | 4 endpoints       | ⚠️ Thiếu 2 endpoints  |
| **Block User**     | 3 endpoints (route khác)      | 3 endpoints       | ⚠️ Route khác         |
| **Upload**         | 3 endpoints (route khác)      | 1 endpoint        | ⚠️ Route khác         |
| **WebSocket**      | Có (basic)                    | 20+ events        | ⚠️ Thiếu nhiều events |

**Tổng kết:** Code hiện tại chỉ implement ~10% so với API documentation.

---

## 📋 Chi Tiết Phân Tích

### 1. Core Messaging API

#### ✅ Đã Có:

- `POST /messages` - Gửi message (trong `messages.controller.ts`)

#### ❌ Thiếu:

- `GET /messages` - Lấy danh sách conversations
- `GET /messages/categories` - Categories
- `GET /messages/search?q={query}` - Search
- `GET /messages/suggestions` - Suggestions
- `GET /messages/:conversationId` - Conversation detail
- `GET /messages/:conversationId/messages` - Messages trong conversation
- `PATCH /messages/:conversationId/read` - Mark read
- `PATCH /messages/:conversationId/notifications` - Mute notifications
- `DELETE /messages/:conversationId` - Delete conversation
- `GET /messages/:conversationId/media` - Media gallery
- `POST /messages/:conversationId/typing` - Typing indicator
- `GET /users/:userId/status` - User status

#### 🔧 Giải Pháp:

**Tạo module mới: `src/modules/messaging/`**

```
src/modules/messaging/
├── controller/
│   ├── conversations.controller.ts      # GET /messages, GET /messages/:id
│   ├── messages.controller.ts            # GET/POST /messages/:id/messages
│   ├── search.controller.ts              # GET /messages/search
│   └── typing.controller.ts              # POST /messages/:id/typing
├── service/
│   ├── conversation.service.ts
│   ├── message.service.ts
│   └── search.service.ts
├── dto/
│   ├── conversation.dto.ts
│   ├── message.dto.ts
│   └── search.dto.ts
└── messaging.module.ts
```

**Migration từ code cũ:**

- Di chuyển `POST /messages` từ `users/controller/messages.controller.ts` → `messaging/controller/messages.controller.ts`
- Tạo conversation model trong Prisma schema

---

### 2. Groups API

#### ✅ Đã Có (nhưng route khác):

- `GET /groups` - Lấy groups
- `GET /groups/:group_id` - Group detail
- `POST /groups` - Tạo group
- `PATCH /groups/:group_id` - Update group
- `DELETE /groups/:group_id` - Delete group
- `GET /groups/:group_id/members` - Members
- `POST /groups/:group_id/messages` - Send message
- `GET /groups/:group_id/messages` - Get messages
- `POST /groups/:group_id/join` - Join group
- `DELETE /groups/:group_id/leave` - Leave group

#### ❌ Thiếu:

- `GET /groups/:group_id/settings` - Group settings
- `PATCH /groups/:group_id/introduction` - Update introduction
- `PATCH /groups/:group_id/name` - Change name (có nhưng trong update)
- `PATCH /groups/:group_id/avatar` - Change avatar (có nhưng trong update)
- `GET /groups/:group_id/classification` - Classification
- `PATCH /groups/:group_id/notifications` - Mute notifications
- `PATCH /groups/:group_id/gift-effect` - Gift effect
- `POST /groups/:group_id/report` - Report group
- `DELETE /groups/:group_id/members/me` - Leave group (có nhưng route khác)

#### ⚠️ Vấn Đề:

1. **Route khác:** Code dùng `:group_id`, MD dùng `:group_id`
2. **Thiếu user_id trong route:** Code có `user/:user_id` trong một số routes
3. **Thiếu settings endpoints**

#### 🔧 Giải Pháp:

**Option 1: Refactor existing code (Recommended)**

- Thêm settings endpoints vào `group.controller.ts`
- Standardize route: dùng `:group_id`
- Remove `user/:user_id` từ routes (dùng JWT token thay vì)
- Thêm classification, introduction, report endpoints

---

### 3. Gift API

#### ✅ Đã Có:

- `GET /gifts/items` - Gift catalog (trong `gift-catalog.controller.ts`)
- `POST /gifts` - Send gift (trong `gifts.controller.ts`)

#### ❌ Thiếu:

- `POST /messages/:conversationId/messages` (type: gift) - Gift message trong chat
- `DELETE /messages/:conversationId/messages/:messageId` - Delete message

#### ⚠️ Vấn Đề:

- Gift catalog có nhưng response format có thể khác với MD
- Cần tích hợp gift message vào conversation system

#### 🔧 Giải Pháp:

- Khi implement messaging module, thêm support cho `type: "gift"` trong message
- Tích hợp gift service vào message service
- Thêm delete message endpoint

---

### 4. Block User API

#### ✅ Đã Có:

- `POST /profile/:user_id/block` - Block user
- `DELETE /profile/:user_id/block/:blocked_id` - Unblock user
- `GET /profile/:user_id/block/blocked` - List blocked users

#### ⚠️ Vấn Đề:

- **Route khác:** Code dùng `/profile/:user_id/block`, MD dùng `/users/:userId/block`
- **Route structure:** Code có `user_id` trong path, MD không có (dùng JWT)

#### 🔧 Giải Pháp:

**Option 1: Thêm routes mới (Recommended)**

- Giữ routes cũ để backward compatibility
- Thêm routes mới theo MD:
  - `POST /users/:userId/block`
  - `DELETE /users/:userId/block`
  - `GET /users/blocked` (không cần user_id trong path)

---

### 5. Upload Media API

#### ✅ Đã Có:

- `POST /uploads/images` - Upload images
- `POST /uploads/videos` - Upload videos
- `POST /uploads/audio` - Upload audio

#### ⚠️ Vấn Đề:

- **Route khác:** Code dùng `/uploads/{type}`, MD dùng `/upload/media` với `type` parameter
- **Response format:** Có thể khác với MD

#### 🔧 Giải Pháp:

**Option 1: Thêm route mới (Recommended)**

- Giữ routes cũ
- Thêm route mới: `POST /upload/media` với `type` parameter
- Unify response format

---

### 6. Forward Message API

#### ❌ Thiếu Hoàn Toàn:

- `GET /users/forward-recipients` - Forward recipients
- `GET /users/forward-recipients?q={query}` - Search recipients
- `POST /messages/forward` - Forward messages

#### 🔧 Giải Pháp:

- Tạo endpoints trong messaging module
- Tích hợp với user suggestions service

---

### 7. Business Card API

#### ❌ Thiếu Hoàn Toàn:

- `POST /messages/:conversationId/messages` (type: business_card)
- `GET /users/:userId` - User profile (có thể có trong users module)
- `POST /users/:userId/friends` - Add friend
- `GET /users/:userId/friends/status` - Friendship status

#### 🔧 Giải Pháp:

- Check xem users module đã có profile và friends endpoints chưa
- Thêm business_card type vào message system
- Tích hợp friends service

---

### 8. New Conversation API

#### ❌ Thiếu Hoàn Toàn:

- `GET /users/suggestions?type=message` - Message suggestions
- `GET /users/suggestions?type=group` - Group suggestions
- `POST /messages` - Create conversation (có nhưng khác purpose)
- `GET /users/contacts` - Contacts list

#### 🔧 Giải Pháp:

- Tạo suggestions service trong users module
- Refactor `POST /messages` để support create conversation
- Tạo contacts endpoint

---

### 9. Group Member Management API

#### ✅ Đã Có (một phần):

- `GET /groups/:group_id/members` - Members list
- `POST /groups/:group_id/join` - Join (tương tự add member)

#### ❌ Thiếu:

- `GET /groups/:group_id/members?role={role}` - Filter by role
- `POST /groups/:group_id/members` - Add members
- `DELETE /groups/:group_id/members/:userId` - Remove member
- `PATCH /groups/:group_id/members/:userId/role` - Change role
- `GET /groups/:group_id/members/summary` - Member summary
- `GET /users/suggestions?type=group&excludeGroup={group_id}` - More people
- `GET /groups/classifications` - Classifications
- `PATCH /groups/:group_id/classification` - Update classification

#### 🔧 Giải Pháp:

- Thêm member management endpoints vào group controller
- Thêm role management
- Thêm classification system

---

### 10. WebSocket Events

#### ✅ Đã Có (Basic):

- `send_message` - Send message
- `typing` - Typing indicator
- `new_message` - New message event
- `user_typing` - User typing event
- `new_notification` - Notification event

#### ❌ Thiếu:

- `user_status_update` - User status
- `voice_recording` - Voice recording
- `media_upload_progress` - Upload progress
- `gift_sent` - Gift sent
- `message_forwarded` - Message forwarded
- `message_deleted` - Message deleted
- `user_blocked` - User blocked
- `user_unblocked` - User unblocked
- `conversation_settings_updated` - Settings updated
- `group_created` - Group created
- `group_settings_updated` - Group settings
- `group_member_added` - Member added
- `group_member_removed` - Member removed
- `group_member_role_updated` - Role updated
- `member_left_group` - Member left
- `conversation_created` - Conversation created
- `friend_request_sent` - Friend request

#### 🔧 Giải Pháp:

- Extend WebSocket gateway với các events mới
- Tích hợp events vào các services tương ứng

---

## 🎯 Implementation Plan

### Phase 1: Core Messaging (Priority: HIGH)

**Tasks:**

1. ✅ Tạo Prisma schema cho conversations và messages
2. ✅ Tạo messaging module structure
3. ✅ Implement conversation endpoints:
   - `GET /messages` - List conversations
   - `GET /messages/:conversationId` - Conversation detail
   - `POST /messages` - Create conversation
4. ✅ Implement message endpoints:
   - `GET /messages/:conversationId/messages` - Get messages
   - `POST /messages/:conversationId/messages` - Send message (refactor từ code cũ)
5. ✅ Implement search & suggestions
6. ✅ Implement categories
7. ✅ Implement mark read, delete conversation

**Estimated Time:** 2-3 weeks

---

### Phase 2: Group Chat Integration (Priority: HIGH)

**Tasks:**

1. ✅ Refactor group routes (standardize `:group_id`)
2. ✅ Add group settings endpoints
3. ✅ Add member management endpoints
4. ✅ Add classification system
5. ✅ Integrate group messages với conversation system

**Estimated Time:** 1-2 weeks

---

### Phase 3: Advanced Features (Priority: MEDIUM)

**Tasks:**

1. ✅ Forward message
2. ✅ Business card
3. ✅ Gift message trong chat
4. ✅ Media gallery
5. ✅ Typing indicator (có WebSocket nhưng cần HTTP endpoint)

**Estimated Time:** 1-2 weeks

---

### Phase 4: Settings & Actions (Priority: MEDIUM)

**Tasks:**

1. ✅ Chat settings
2. ✅ Display name
3. ✅ Mute notifications
4. ✅ Gift sounds
5. ✅ Report chat
6. ✅ Block user (refactor routes)

**Estimated Time:** 1 week

---

### Phase 5: WebSocket Events (Priority: LOW)

**Tasks:**

1. ✅ Extend WebSocket gateway
2. ✅ Add missing events
3. ✅ Test real-time updates

**Estimated Time:** 1 week

---

## 📝 Code Structure Recommendations

### 1. Prisma Schema

```prisma
model Conversation {
  id            String   @id @default(uuid())
  type          String   // "direct" | "group"
  group_id       String?  @unique
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  participants ConversationParticipant[]
  messages      Message[]
  settings      ConversationSettings?
}

model ConversationParticipant {
  id             String   @id @default(uuid())
  conversationId String
  userId         String
  displayName    String?
  isMuted        Boolean  @default(false)
  giftSoundsEnabled Boolean @default(true)
  joinedAt       DateTime @default(now())

  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id])

  @@unique([conversationId, userId])
}

model Message {
  id             String   @id @default(uuid())
  conversationId String
  senderId       String
  type           String   // "text" | "image" | "video" | "audio" | "gift" | "business_card" | "system"
  content        String?
  mediaUrl       String?
  mediaThumbnail String?
  mediaSize      Int?
  mediaDuration  Int?
  isRead         Boolean  @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Gift specific
  giftId         String?
  gift           Gift?    @relation(fields: [giftId], references: [id])

  // Business card specific
  businessCardUserId String?

  // Forward specific
  isForwarded    Boolean  @default(false)
  originalMessageId String?

  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender         User         @relation(fields: [senderId], references: [id])

  @@index([conversationId, createdAt])
}

model ConversationSettings {
  id             String   @id @default(uuid())
  conversationId String   @unique
  notificationsEnabled Boolean @default(true)
  giftSoundsEnabled Boolean @default(true)

  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
}
```

### 2. Module Structure

```
src/modules/messaging/
├── controller/
│   ├── conversations.controller.ts
│   ├── messages.controller.ts
│   ├── search.controller.ts
│   ├── typing.controller.ts
│   └── media.controller.ts
├── service/
│   ├── conversation.service.ts
│   ├── message.service.ts
│   ├── search.service.ts
│   └── typing.service.ts
├── dto/
│   ├── conversation.dto.ts
│   ├── message.dto.ts
│   ├── search.dto.ts
│   └── typing.dto.ts
├── interfaces/
│   └── messaging.interface.ts
└── messaging.module.ts
```

### 3. Route Standardization

**Current → Recommended:**

| Current                        | Recommended                     | Note                 |
| ------------------------------ | ------------------------------- | -------------------- |
| `POST /messages`               | `POST /messages`                | ✅ OK                |
| `GET /groups`                  | `GET /groups`                   | ✅ OK                |
| `GET /groups/:group_id`        | `GET /groups/:group_id`         | ⚠️ Change param name |
| `POST /profile/:user_id/block` | `POST /users/:userId/block`     | ⚠️ Change route      |
| `POST /uploads/images`         | `POST /upload/media?type=image` | ⚠️ Change route      |

---

## 🔄 Migration Strategy

### Step 1: Database Migration

1. Tạo Prisma schema cho conversations và messages
2. Run migration
3. Seed test data

### Step 2: Backend Implementation

1. Tạo messaging module
2. Implement core endpoints
3. Test với Postman/Swagger

### Step 3: Integration

1. Integrate với existing services (gifts, groups, users)
2. Update WebSocket gateway
3. Test end-to-end

### Step 4: Frontend Integration

1. Update API calls theo new routes
2. Test UI flows
3. Handle backward compatibility nếu cần

---

## ⚠️ Breaking Changes

### Routes Cần Thay Đổi:

1. **Block User:**
   - Old: `POST /profile/:user_id/block`
   - New: `POST /users/:userId/block`
   - **Action:** Thêm route mới, giữ route cũ (deprecated)

2. **Upload:**
   - Old: `POST /uploads/images`, `POST /uploads/videos`
   - New: `POST /upload/media?type={type}`
   - **Action:** Thêm route mới, giữ routes cũ

3. **Groups:**
   - Old: `:group_id` param
   - New: `:group_id` param
   - **Action:** Support cả hai (backward compatibility)

---

## 📊 Progress Tracking

### Completed ✅

- [x] Basic message sending (`POST /messages`)
- [x] Basic group endpoints
- [x] Gift catalog (`GET /gifts/items`)
- [x] Send gift (`POST /gifts`)
- [x] Block user (routes khác)
- [x] Upload media (routes khác)
- [x] Basic WebSocket (typing, messages)

### In Progress 🚧

- [ ] None

### Pending 📋

- [ ] Conversation list & detail
- [ ] Message list trong conversation
- [ ] Search & suggestions
- [ ] Categories
- [ ] Forward message
- [ ] Business card
- [ ] Group settings
- [ ] Member management
- [ ] Media gallery
- [ ] Typing indicator HTTP endpoint
- [ ] Chat settings
- [ ] Report chat
- [ ] Extended WebSocket events

---

## 🎯 Priority Matrix

| Feature                 | Priority | Effort | Impact | Phase |
| ----------------------- | -------- | ------ | ------ | ----- |
| Conversation list       | HIGH     | Medium | High   | 1     |
| Message list            | HIGH     | Medium | High   | 1     |
| Send message (refactor) | HIGH     | Low    | High   | 1     |
| Group settings          | HIGH     | Medium | High   | 2     |
| Member management       | HIGH     | Medium | High   | 2     |
| Forward message         | MEDIUM   | Medium | Medium | 3     |
| Business card           | MEDIUM   | Medium | Medium | 3     |
| Media gallery           | MEDIUM   | Low    | Medium | 3     |
| Chat settings           | MEDIUM   | Low    | Medium | 4     |
| WebSocket events        | LOW      | Medium | Low    | 5     |

---

## 📚 References

- [API Complete Reference](./MESSAGING_API_COMPLETE_REFERENCE.md)
- [Core Messaging API](./MESSAGING_API_DOCUMENTATION.md)
- [Gift & Forward API](./MESSAGING_GIFT_FORWARD_API.md)
- [Group Settings API](./MESSAGING_GROUP_SETTINGS_API.md)
- [Member Management API](./MESSAGING_GROUP_MEMBER_MANAGEMENT_API.md)

---

**Version:** 1.0  
**Last Updated:** 2025-01-16  
**Status:** 📋 Analysis Complete - Ready for Implementation
