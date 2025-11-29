# Room API Documentation Summary

## Tổng quan
Đã thêm giải thích chi tiết và ví dụ đầy đủ cho các API endpoints của Room module, bao gồm:
- Room Settings (Cài đặt phòng)
- Room Boost (Tăng cường phòng)
- Room Challenge (Thử thách phòng)
- Room Members (Quản lý thành viên)

## Files đã tạo mới

### 1. `src/modules/room/dto/room-boost.dto.ts`
DTOs cho Room Boost API với các class:
- `UseBoostItemDto` - Sử dụng boost item
- `PurchaseBoostDto` - Mua gói boost
- `BoostHistoryQueryDto` - Query lịch sử boost
- `BoostItemResponseDto` - Response cho boost items
- `SuperPackageResponseDto` - Response cho super packages
- `BoostHistoryItemDto` - Response cho lịch sử boost

**Ví dụ sử dụng:**
```typescript
// Sử dụng boost item
POST /rooms/room_12345/boost/use-item
{
  "item_id": "boost_firework_001",
  "quantity": 1
}

// Mua super package
POST /rooms/room_12345/boost/purchase
{
  "package_id": "super_package_vip",
  "payment_method": "diamond"
}
```

### 2. `src/modules/room/dto/room-challenge.dto.ts`
DTOs cho Room Challenge API với các class:
- `UpdateChallengeProgressDto` - Cập nhật tiến độ challenge
- `ContributorsQueryDto` - Query danh sách contributors
- `RoomChallengeResponseDto` - Response thông tin challenge
- `ContributorDto` - Thông tin contributor
- `ContributorsResponseDto` - Response danh sách contributors

**Ví dụ sử dụng:**
```typescript
// Cập nhật tiến độ challenge
POST /rooms/room_12345/challenge/progress
{
  "points": 100,
  "activity_type": "gift",
  "description": "Gửi quà trị giá 1000 coins"
}

// Lấy top contributors
GET /rooms/room_12345/contributors/weekly?limit=50&page=1
```

### 3. `src/modules/room/dto/room-members.dto.ts`
DTOs cho Room Members API với các class:
- `ViewersQueryDto` - Query danh sách viewers
- `KickUserDto` - Kick user khỏi phòng
- `BlockUserDto` - Block user
- `UnblockUserDto` - Unblock user
- `BlacklistQueryDto` - Query blacklist
- `ViewerDto` - Thông tin viewer
- `ViewersResponseDto` - Response danh sách viewers
- `KickUserResponseDto` - Response kick user
- `BlacklistItemDto` - Thông tin blacklist item
- `BlacklistResponseDto` - Response danh sách blacklist

**Ví dụ sử dụng:**
```typescript
// Lấy danh sách viewers
GET /rooms/room_12345/viewers?page=1&pageSize=50&role=speaker&sort_by=contribution

// Block user
POST /rooms/room_12345/block/u789
{
  "reason": "Spam và quấy rối",
  "permanent": true
}

// Kick user với thời gian cấm
POST /rooms/room_12345/kick/u456
{
  "reason": "Vi phạm quy định phòng",
  "ban_duration": 30
}
```

## Files đã cập nhật

### 1. `src/modules/room/controllers/room-settings.controller.ts`
Đã thêm:
- `@ApiOperation` với mô tả chi tiết cho mỗi endpoint
- `@ApiParam` với ví dụ cụ thể
- `@ApiResponse` với schema examples đầy đủ
- JSDoc comments giải thích chức năng

**Endpoints được document:**
- `GET /rooms/:room_id/modes` - Lấy danh sách chế độ phòng
- `POST /rooms/:room_id/set-mode` - Đặt chế độ phòng
- `GET /rooms/:room_id/seat-layouts` - Lấy danh sách layout ghế
- `POST /rooms/:room_id/set-seat-layout` - Đặt layout ghế
- `GET /rooms/:room_id/seats` - Lấy thông tin ghế
- `POST /rooms/:room_id/seats/join` - Tham gia ghế
- `POST /rooms/:room_id/seats/assign` - Chỉ định user vào ghế
- `POST /rooms/:room_id/seats/:seatId/lock` - Khóa ghế
- `DELETE /rooms/:room_id/seats/:seatId/lock` - Mở khóa ghế
- `POST /rooms/:room_id/seats/leave` - Rời khỏi ghế
- `PATCH /rooms/:room_id/settings` - Cập nhật cài đặt phòng

### 2. `src/modules/room/controllers/room-boost.controller.ts`
Đã thêm:
- Import các DTOs mới
- `@ApiOperation`, `@ApiParam`, `@ApiQuery`, `@ApiResponse` đầy đủ
- JSDoc comments giải thích chi tiết
- Response examples cho cả success và error cases

**Endpoints được document:**
- `GET /rooms/:room_id/boost/items` - Lấy danh sách boost items
- `GET /rooms/:room_id/boost/super-packages` - Lấy danh sách super packages
- `POST /rooms/:room_id/boost/use-item` - Sử dụng boost item
- `POST /rooms/:room_id/boost/purchase` - Mua gói boost
- `GET /rooms/:room_id/boost/history` - Lấy lịch sử boost

### 3. `src/modules/room/controllers/room-challenge.controller.ts`
Đã thêm:
- Import các DTOs mới
- `@ApiOperation`, `@ApiParam`, `@ApiQuery`, `@ApiResponse` đầy đủ
- JSDoc comments giải thích hệ thống challenge
- Response examples với dữ liệu thực tế

**Endpoints được document:**
- `GET /rooms/:room_id/challenge` - Lấy thông tin challenge
- `POST /rooms/:room_id/challenge/progress` - Cập nhật tiến độ challenge
- `GET /rooms/:room_id/contributors/:period` - Lấy danh sách contributors

### 4. `src/modules/room/controllers/room-members.controller.ts`
Đã thêm:
- Import các DTOs mới
- `@ApiOperation`, `@ApiParam`, `@ApiQuery`, `@ApiResponse` đầy đủ
- JSDoc comments giải thích quản lý thành viên
- Response examples cho nhiều trường hợp (success, error, permission denied)

**Endpoints được document:**
- `GET /rooms/:room_id/viewers` - Lấy danh sách viewers
- `POST /rooms/:room_id/kick/:user_id` - Kick user khỏi phòng
- `POST /rooms/:room_id/block/:user_id` - Block user
- `POST /rooms/:room_id/unblock/:user_id` - Unblock user
- `GET /rooms/:room_id/blacklist` - Lấy danh sách blacklist

## Tính năng chính đã document

### Room Settings
- Quản lý chế độ phòng (party, music, game, etc.)
- Quản lý layout ghế (4, 6, 8, 12 ghế)
- Quản lý trạng thái ghế (join, leave, assign, lock/unlock)
- Cập nhật cài đặt phòng (tên, mô tả, privacy, age limit, etc.)

### Room Boost
- Xem và sử dụng boost items (pháo hoa, hiệu ứng, huy hiệu)
- Mua super packages với giá ưu đãi
- Xem lịch sử sử dụng boost trong phòng
- Hệ thống thanh toán (coin, diamond, real_money)

### Room Challenge
- Hệ thống challenge với mục tiêu và phần thưởng
- Tích lũy điểm từ các hoạt động (gift, chat, time, boost)
- Theo dõi tiến độ và milestones
- Xem top contributors theo khoảng thời gian (daily, weekly, monthly)

### Room Members
- Xem danh sách viewers với thông tin chi tiết
- Quản lý vai trò (host, moderator, speaker, viewer)
- Kick user với thời gian cấm tùy chỉnh
- Block/unblock user (permanent hoặc temporary)
- Quản lý blacklist với lý do và thời gian

## Swagger Documentation
Tất cả endpoints đều có:
- ✅ Mô tả chi tiết bằng tiếng Việt
- ✅ Ví dụ request body với dữ liệu thực tế
- ✅ Ví dụ response với schema đầy đủ
- ✅ Error responses với các trường hợp khác nhau
- ✅ Query parameters với validation rules
- ✅ Path parameters với examples

## Testing
Để test các APIs này trong Swagger UI:
1. Chạy server: `npm run start:dev`
2. Truy cập: `http://localhost:3000/api`
3. Authenticate với JWT token
4. Test các endpoints với examples có sẵn

## Validation
Tất cả DTOs đều có:
- Class-validator decorators (@IsString, @IsNumber, @Min, etc.)
- ApiProperty decorators với examples
- Optional fields được đánh dấu rõ ràng
- Enum values cho các fields có giá trị cố định
