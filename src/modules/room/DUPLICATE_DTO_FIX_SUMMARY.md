# Duplicate DTO Fix Summary

## Vấn đề
Khi chạy server, xuất hiện 2 lỗi duplicate DTOs:
```
ERROR Duplicate DTO detected: "SendMessageDto" is defined multiple times with different schemas.
ERROR Duplicate DTO detected: "BlockUserDto" is defined multiple times with different schemas.
```

## Nguyên nhân
Có 2 modules khác nhau định nghĩa DTOs với cùng tên:

### 1. SendMessageDto
- **Module 1**: `src/modules/messaging/dto/message.dto.ts` - Cho messaging module
- **Module 2**: `src/modules/room/dto/room-message.dto.ts` - Cho room chat module

### 2. BlockUserDto
- **Module 1**: `src/modules/users/block-user/dto/block-user.dto.ts` - Cho user blocking
- **Module 2**: `src/modules/room/dto/room-members.dto.ts` - Cho room member blocking

## Giải pháp
Đổi tên các DTOs trong **room module** để tránh conflict với các modules khác.

---

## Các thay đổi đã thực hiện

### 1. Room Message DTOs

#### File: `src/modules/room/dto/room-message.dto.ts`

**Trước:**
```typescript
export class SendMessageDto { ... }
export class SendGiftDto { ... }
```

**Sau:**
```typescript
export class SendRoomMessageDto { ... }
export class SendRoomGiftDto { ... }
```

#### Files cập nhật:
- ✅ `src/modules/room/dto/room-message.dto.ts` - Đổi tên class
- ✅ `src/modules/room/controllers/room-chat.controller.ts` - Update imports và usage
- ✅ `src/modules/room/services/room-chat.service.ts` - Update imports và method signatures

---

### 2. Room Members DTOs

#### File: `src/modules/room/dto/room-members.dto.ts`

**Trước:**
```typescript
export class BlockUserDto { ... }
export class UnblockUserDto { ... }
```

**Sau:**
```typescript
export class RoomBlockUserDto { ... }
export class RoomUnblockUserDto { ... }
```

#### Files cập nhật:
- ✅ `src/modules/room/dto/room-members.dto.ts` - Đổi tên class
- ✅ `src/modules/room/controllers/room-members.controller.ts` - Update imports và usage

---

## Chi tiết thay đổi

### 1. SendMessageDto → SendRoomMessageDto

#### room-message.dto.ts
```typescript
// OLD
export class SendMessageDto {
  @ApiProperty({ ... })
  type: MessageType;
  
  @ApiProperty({ ... })
  content: string;
}

// NEW
export class SendRoomMessageDto {
  @ApiProperty({ ... })
  type: MessageType;
  
  @ApiProperty({ ... })
  content: string;
}
```

#### room-chat.controller.ts
```typescript
// OLD
import { SendMessageDto, SendGiftDto } from '../dto/room-message.dto';

async sendMessage(
  @Param('room_id') room_id: string,
  @Request() req: any,
  @Body() dto: SendMessageDto,
) { ... }

// NEW
import { SendRoomMessageDto, SendRoomGiftDto } from '../dto/room-message.dto';

async sendMessage(
  @Param('room_id') room_id: string,
  @Request() req: any,
  @Body() dto: SendRoomMessageDto,
) { ... }
```

#### room-chat.service.ts
```typescript
// OLD
import { SendMessageDto, SendGiftDto } from '../dto/room-message.dto';

async sendMessage(room_id: string, user_id: string, dto: SendMessageDto) { ... }

// NEW
import { SendRoomMessageDto, SendRoomGiftDto } from '../dto/room-message.dto';

async sendMessage(room_id: string, user_id: string, dto: SendRoomMessageDto) { ... }
```

---

### 2. SendGiftDto → SendRoomGiftDto

#### room-message.dto.ts
```typescript
// OLD
export class SendGiftDto {
  @ApiProperty({ ... })
  gift_id: string;
  
  @ApiProperty({ ... })
  recipientId: string;
  
  @ApiPropertyOptional({ ... })
  quantity?: number;
}

// NEW
export class SendRoomGiftDto {
  @ApiProperty({ ... })
  gift_id: string;
  
  @ApiProperty({ ... })
  recipientId: string;
  
  @ApiPropertyOptional({ ... })
  quantity?: number;
}
```

#### room-chat.controller.ts
```typescript
// OLD
@ApiBody({ type: SendGiftDto })
async sendGift(
  @Param('room_id') room_id: string,
  @Request() req: any,
  @Body() dto: SendGiftDto,
) { ... }

// NEW
@ApiBody({ type: SendRoomGiftDto })
async sendGift(
  @Param('room_id') room_id: string,
  @Request() req: any,
  @Body() dto: SendRoomGiftDto,
) { ... }
```

#### room-chat.service.ts
```typescript
// OLD
async sendGift(room_id: string, user_id: string, dto: SendGiftDto) { ... }

// NEW
async sendGift(room_id: string, user_id: string, dto: SendRoomGiftDto) { ... }
```

---

### 3. BlockUserDto → RoomBlockUserDto

#### room-members.dto.ts
```typescript
// OLD
export class BlockUserDto {
  @ApiPropertyOptional({ ... })
  reason?: string;
  
  @ApiPropertyOptional({ ... })
  permanent?: boolean;
  
  @ApiPropertyOptional({ ... })
  duration_hours?: number;
}

// NEW
export class RoomBlockUserDto {
  @ApiPropertyOptional({ ... })
  reason?: string;
  
  @ApiPropertyOptional({ ... })
  permanent?: boolean;
  
  @ApiPropertyOptional({ ... })
  duration_hours?: number;
}
```

#### room-members.controller.ts
```typescript
// OLD
import { BlockUserDto, UnblockUserDto, ... } from '../dto/room-members.dto';

async blockUser(
  @Param('room_id') room_id: string,
  @Param('user_id') user_id: string,
  @Request() req: any,
  @Body() dto: BlockUserDto,
) { ... }

// NEW
import { RoomBlockUserDto, RoomUnblockUserDto, ... } from '../dto/room-members.dto';

async blockUser(
  @Param('room_id') room_id: string,
  @Param('user_id') user_id: string,
  @Request() req: any,
  @Body() dto: RoomBlockUserDto,
) { ... }
```

---

### 4. UnblockUserDto → RoomUnblockUserDto

#### room-members.dto.ts
```typescript
// OLD
export class UnblockUserDto {
  @ApiPropertyOptional({ ... })
  note?: string;
}

// NEW
export class RoomUnblockUserDto {
  @ApiPropertyOptional({ ... })
  note?: string;
}
```

#### room-members.controller.ts
```typescript
// OLD
async unblockUser(
  @Param('room_id') room_id: string,
  @Param('user_id') user_id: string,
  @Request() req: any,
  @Body() dto: UnblockUserDto,
) { ... }

// NEW
async unblockUser(
  @Param('room_id') room_id: string,
  @Param('user_id') user_id: string,
  @Request() req: any,
  @Body() dto: RoomUnblockUserDto,
) { ... }
```

---

## Tổng kết

### Files đã sửa (7 files)
1. ✅ `src/modules/room/dto/room-message.dto.ts` - Đổi tên 2 DTOs
2. ✅ `src/modules/room/dto/room-members.dto.ts` - Đổi tên 2 DTOs
3. ✅ `src/modules/room/controllers/room-chat.controller.ts` - Update imports và usage
4. ✅ `src/modules/room/services/room-chat.service.ts` - Update imports và method signatures
5. ✅ `src/modules/room/controllers/room-members.controller.ts` - Update imports và usage

### DTOs đã đổi tên (4 DTOs)
1. ✅ `SendMessageDto` → `SendRoomMessageDto`
2. ✅ `SendGiftDto` → `SendRoomGiftDto`
3. ✅ `BlockUserDto` → `RoomBlockUserDto`
4. ✅ `UnblockUserDto` → `RoomUnblockUserDto`

### Kết quả
- ✅ Không còn duplicate DTO warnings
- ✅ Tất cả files compile thành công
- ✅ Swagger documentation vẫn hoạt động bình thường
- ✅ Không breaking changes cho API endpoints (chỉ đổi tên internal DTOs)

---

## Naming Convention

Để tránh duplicate DTOs trong tương lai, nên áp dụng naming convention:

### Pattern
```
[Module][Action][Entity]Dto
```

### Examples
- ✅ `SendRoomMessageDto` - Room module, Send action, Message entity
- ✅ `RoomBlockUserDto` - Room module, Block action, User entity
- ✅ `CreateGroupDto` - Group module, Create action
- ✅ `UpdateProfileDto` - Profile module, Update action

### Benefits
- Tránh conflict giữa các modules
- Dễ identify DTO thuộc module nào
- Consistent naming across codebase
- Better code organization

---

## Testing

Sau khi fix, cần test:

1. ✅ Server khởi động không có warnings
2. ✅ Swagger UI hiển thị đúng DTOs
3. ✅ API endpoints hoạt động bình thường:
   - POST `/rooms/:room_id/messages` - Send room message
   - POST `/rooms/:room_id/gifts` - Send gift
   - POST `/rooms/:room_id/block/:user_id` - Block user
   - POST `/rooms/:room_id/unblock/:user_id` - Unblock user

---

## Notes

- Các DTOs trong messaging module và users module **KHÔNG** bị thay đổi
- Chỉ đổi tên DTOs trong room module để tránh conflict
- API endpoints và request/response format **KHÔNG** thay đổi
- Backward compatible - không breaking changes
