# 🗺️ LỘ TRÌNH PHÁT TRIỂN MODULES - CHI TIẾT TỪNG BƯỚC

**Mục tiêu**: Xây dựng các feature modules theo thứ tự ưu tiên, từ cơ bản đến nâng cao.

**Chiến lược**: Làm tuần tự, test kỹ từng module trước khi chuyển sang module tiếp theo.

---

## 📊 TỔNG QUAN CÁC MODULES

### Phân Loại Theo Độ Ưu Tiên

**🔴 Priority 1 - Core Modules (Bắt buộc)**:
1. Users Module - Quản lý users
2. Associate Module - Quản lý authentication providers
3. Profile Module - Thông tin profile users

**🟡 Priority 2 - Social Features (Quan trọng)**:
4. Posts Module - Bài viết & feed
5. Notifications Module - Thông báo
6. Messaging Module - Tin nhắn

**🟢 Priority 3 - Advanced Features (Nâng cao)**:
7. Wallet Module - Ví điện tử
8. Gifts Module - Quà tặng
9. Groups Module - Nhóm
10. Events Module - Sự kiện
11. Room Module - Phòng audio/video

**🔵 Priority 4 - Optional Features (Tùy chọn)**:
12. Stories Module - Stories 24h
13. Store Module - Cửa hàng
14. Tasks Module - Nhiệm vụ
15. Support Module - Hỗ trợ

---

## 🔴 PRIORITY 1: CORE MODULES

### MODULE 1: Users Module (Quan trọng nhất)

**Thời gian**: 2-3 giờ  
**Độ phức tạp**: Trung bình

#### Bước 1.1: Tạo Cấu Trúc

```bash
# Tạo folders
mkdir -p src/modules/users/{controller,service,dto,interfaces}
mkdir -p src/modules/users/block-user
```

**Commit**:
```bash
git add src/modules/users/
git commit -m "feat(users): create users module structure"
```

#### Bước 1.2: Prisma Schema - Users

**Schema đã có trong `src/prisma/schema.prisma`**:

```prisma
// USER MODEL - Đã có sẵn
model ResUser {
  id         String    @id @default(uuid())
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt
  deleted_at DateTime?
  is_deleted Boolean   @default(false)

  union_id   String        @unique
  role       UserBasicRole @default(guest)
  nickname   String
  is_blocked Boolean       @default(false)
  bio        String?
  avatar     String?
  gender     String?
  birthday   DateTime?

  // Relations
  followers    ResFollow[]     @relation("Followers")
  following    ResFollow[]     @relation("Following")
  friendsA     ResFriend[]     @relation("FriendsA")
  friendsB     ResFriend[]     @relation("FriendsB")
  post         ResPost[]

  @@index([union_id])
  @@index([nickname])
  @@index([created_at])
  @@index([is_deleted, is_blocked])
  @@index([nickname, created_at])
  @@map("res_user")
}

// FOLLOW MODEL - Đã có sẵn
model ResFollow {
  id         String   @id @default(uuid())
  created_at DateTime @default(now())

  follower_id  String
  following_id String

  follower  ResUser @relation("Followers", fields: [follower_id], references: [id])
  following ResUser @relation("Following", fields: [following_id], references: [id])

  @@unique([follower_id, following_id])
  @@index([follower_id])
  @@index([following_id])
  @@index([follower_id, created_at])
  @@index([following_id, created_at])
  @@map("res_follow")
}

// FRIEND MODEL - Đã có sẵn
model ResFriend {
  id         String   @id @default(uuid())
  created_at DateTime @default(now())

  user_a_id String
  user_b_id String

  userA ResUser @relation("FriendsA", fields: [user_a_id], references: [id])
  userB ResUser @relation("FriendsB", fields: [user_b_id], references: [id])

  @@unique([user_a_id, user_b_id])
  @@index([user_a_id])
  @@index([user_b_id])
  @@index([user_a_id, created_at])
  @@index([user_b_id, created_at])
  @@map("res_friend")
}

// BLOCK MODEL - Cần thêm
model ResBlock {
  id         String   @id @default(uuid())
  created_at DateTime @default(now())

  blocker_id String  // User who blocks
  blocked_id String  // User who is blocked

  blocker ResUser @relation("Blocking", fields: [blocker_id], references: [id], onDelete: Cascade)
  blocked ResUser @relation("BlockedBy", fields: [blocked_id], references: [id], onDelete: Cascade)

  @@unique([blocker_id, blocked_id])
  @@index([blocker_id])
  @@index([blocked_id])
  @@map("res_block")
}
```

**Nếu chưa có ResBlock, thêm vào schema**:
```bash
# Edit src/prisma/schema.prisma
# Thêm ResBlock model và relations vào ResUser

# Run migration
yarn prisma migrate dev --name add_block_model
```

**Commit**:
```bash
git add src/prisma/
git commit -m "feat(users): add ResBlock model to schema"
```

#### Bước 1.3: DTOs

**File**: `src/modules/users/dto/create-user.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'john_doe' })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  nickname: string;

  @ApiProperty({ example: 'john@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'Hello, I am John!', required: false })
  @IsString()
  @IsOptional()
  bio?: string;
}
```

**File**: `src/modules/users/dto/update-user.dto.ts`

```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {}
```

**File**: `src/modules/users/dto/search-users.dto.ts`

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchUsersDto {
  @ApiPropertyOptional({ example: 'john' })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;
}
```

**Commit**:
```bash
git add src/modules/users/dto/
git commit -m "feat(users): add DTOs for user operations"
```

#### Bước 1.4: User Service

**File**: `src/modules/users/service/user.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CacheService } from '@/common/cache/cache.service';
import { CreateUserDto, UpdateUserDto, SearchUsersDto } from '../dto';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async findAll(searchDto: SearchUsersDto) {
    const { query, page = 1, limit = 20 } = searchDto;
    const skip = (page - 1) * limit;

    const where = query
      ? {
          nickname: { contains: query, mode: 'insensitive' as const },
          is_deleted: false,
        }
      : { is_deleted: false };

    const [users, total] = await Promise.all([
      this.prisma.resUser.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          nickname: true,
          avatar: true,
          bio: true,
          created_at: true,
        },
      }),
      this.prisma.resUser.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const cacheKey = `user:${id}:detail`;
    
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const user = await this.prisma.resUser.findUnique({
          where: { id },
          select: {
            id: true,
            nickname: true,
            avatar: true,
            bio: true,
            gender: true,
            birthday: true,
            created_at: true,
          },
        });

        if (!user || user.is_deleted) {
          throw new NotFoundException('User not found');
        }

        return user;
      },
      1800, // 30 minutes
    );
  }

  async update(id: string, updateDto: UpdateUserDto) {
    const user = await this.prisma.resUser.update({
      where: { id },
      data: updateDto,
    });

    // Invalidate cache
    await this.cache.del(`user:${id}:detail`);

    return user;
  }

  async remove(id: string) {
    await this.prisma.resUser.update({
      where: { id },
      data: { is_deleted: true, deleted_at: new Date() },
    });

    // Invalidate cache
    await this.cache.invalidateUserCache(id);

    return { message: 'User deleted successfully' };
  }
}
```

**Commit**:
```bash
git add src/modules/users/service/
git commit -m "feat(users): implement user service with CRUD operations"
```

#### Bước 1.5: User Controller

**File**: `src/modules/users/controller/user.controller.ts`

```typescript
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from '../service/user.service';
import { CreateUserDto, UpdateUserDto, SearchUsersDto } from '../dto';
import { AccountAuthGuard } from '@/auth/guards/account-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(AccountAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Tìm kiếm users' })
  findAll(@Query() searchDto: SearchUsersDto) {
    return this.userService.findAll(searchDto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin user theo ID' })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin user' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateUserDto,
    @CurrentUser('userId') currentUserId: string,
  ) {
    // TODO: Check if currentUserId === id (only update own profile)
    return this.userService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa user (soft delete)' })
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
```

**Commit**:
```bash
git add src/modules/users/controller/
git commit -m "feat(users): implement user controller with REST endpoints"
```

#### Bước 1.6: Users Module

**File**: `src/modules/users/users.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { UserService } from './service/user.service';
import { UserController } from './controller/user.controller';

@Module({
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UsersModule {}
```

**Commit**:
```bash
git add src/modules/users/users.module.ts
git commit -m "feat(users): create users module"
```

#### Bước 1.7: Import vào AppModule

**File**: `src/app.module.ts`

```typescript
// Thêm import
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    // ... existing imports
    UsersModule,  // Thêm dòng này
  ],
  // ...
})
export class AppModule {}
```

**Commit**:
```bash
git add src/app.module.ts
git commit -m "feat(users): integrate users module into app"
```

#### Bước 1.8: Test Users Module

```bash
# Build
yarn build

# Start
yarn start:dev

# Test endpoints
curl http://localhost:3000/api/users
curl http://localhost:3000/api/users/{user-id}

# Check Swagger
open http://localhost:3000/swagger
```

**Commit** (nếu có fixes):
```bash
git add .
git commit -m "fix(users): resolve build errors and test endpoints"
```

---

### MODULE 2: Associate Module

**Thời gian**: 1-2 giờ  
**Độ phức tạp**: Thấp

#### Schema

```prisma
// ASSOCIATE MODEL - Đã có trong schema
model ResAssociate {
  id         String    @id @default(uuid())
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt
  deleted_at DateTime?
  is_deleted Boolean   @default(false)

  user_id        String
  email          String?
  phone_number   String?
  ref_id         String
  hash           String?
  provider       ProviderEnum
  email_verified Boolean      @default(false)
  phone_verified Boolean      @default(false)

  user ResUser @relation(fields: [user_id], references: [id])

  @@index([ref_id])
  @@index([user_id])
  @@map("res_associate")
}
```

#### Các Bước

1. Tạo structure: `mkdir -p src/modules/associate/{controller,service,dto}`
2. Tạo DTOs
3. Tạo Service
4. Tạo Controller
5. Tạo Module
6. Import vào AppModule
7. Test

**Commits**:
```bash
git commit -m "feat(associate): create associate module structure"
git commit -m "feat(associate): add DTOs for associate operations"
git commit -m "feat(associate): implement associate service"
git commit -m "feat(associate): implement associate controller"
git commit -m "feat(associate): create associate module"
git commit -m "feat(associate): integrate into app"
```

---

### MODULE 3: Profile Module

**Thời gian**: 2-3 giờ  
**Độ phức tạp**: Trung bình

#### Schema

```prisma
// PROFILE VIEW MODEL
model ResProfileView {
  id             String   @id @default(uuid())
  viewer_id      String
  target_user_id String
  viewed_at      DateTime @default(now())

  viewer      ResUser @relation("Viewer", fields: [viewer_id], references: [id])
  target_user ResUser @relation("Target", fields: [target_user_id], references: [id])

  @@index([viewer_id])
  @@index([target_user_id])
  @@map("res_profile_view")
}
```

#### Các Bước

Tương tự Users Module

**Commits**:
```bash
git commit -m "feat(profile): create profile module structure"
git commit -m "feat(profile): add profile DTOs"
git commit -m "feat(profile): implement profile service"
git commit -m "feat(profile): implement profile controller"
git commit -m "feat(profile): create profile module"
git commit -m "feat(profile): integrate into app"
```

---

## 🟡 PRIORITY 2: SOCIAL FEATURES

### MODULE 4: Posts Module

**Thời gian**: 3-4 giờ  
**Độ phức tạp**: Cao

#### Schema

```prisma
// POST MODEL - Đã có
model ResPost {
  id          String      @id @default(uuid())
  user_id     String
  content     String
  privacy     PostPrivacy @default(public)
  share_count Int         @default(0)
  created_at  DateTime    @default(now())
  updated_at  DateTime    @updatedAt

  user     ResUser       @relation(fields: [user_id], references: [id])
  comments ResComment[]
  likes    ResPostLike[]

  @@index([user_id])
  @@index([created_at])
  @@index([privacy])
  @@index([user_id, created_at])
  @@index([privacy, created_at])
  @@map("res_post")
}

// COMMENT MODEL
model ResComment {
  id         String   @id @default(uuid())
  post_id    String
  user_id    String
  content    String?
  parent_id  String?
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  post    ResPost      @relation(fields: [post_id], references: [id], onDelete: Cascade)
  user    ResUser      @relation("CommentAuthor", fields: [user_id], references: [id])
  parent  ResComment?  @relation("CommentReplies", fields: [parent_id], references: [id])
  replies ResComment[] @relation("CommentReplies")

  @@index([post_id])
  @@index([user_id])
  @@index([parent_id])
  @@index([post_id, created_at])
  @@index([user_id, created_at])
  @@map("res_comment")
}

// POST LIKE MODEL
model ResPostLike {
  id         String       @id @default(uuid())
  post_id    String
  user_id    String
  reaction   PostReaction @default(like)
  created_at DateTime     @default(now())

  post ResPost @relation(fields: [post_id], references: [id], onDelete: Cascade)
  user ResUser @relation(fields: [user_id], references: [id])

  @@unique([post_id, user_id])
  @@index([post_id])
  @@index([user_id])
  @@map("res_post_like")
}
```

**Commits**:
```bash
git commit -m "feat(posts): create posts module structure"
git commit -m "feat(posts): add post DTOs (create, update, comment, like)"
git commit -m "feat(posts): implement post service with CRUD"
git commit -m "feat(posts): implement comment service"
git commit -m "feat(posts): implement like service"
git commit -m "feat(posts): implement post controller"
git commit -m "feat(posts): create posts module"
git commit -m "feat(posts): integrate into app"
```

---

## 📋 TỔNG KẾT LỘ TRÌNH

### Thứ Tự Làm Modules

| # | Module | Thời Gian | Priority | Commits |
|---|--------|-----------|----------|---------|
| 1 | Users | 2-3h | 🔴 High | 8 |
| 2 | Associate | 1-2h | 🔴 High | 6 |
| 3 | Profile | 2-3h | 🔴 High | 6 |
| 4 | Posts | 3-4h | 🟡 Medium | 8 |
| 5 | Notifications | 2-3h | 🟡 Medium | 6 |
| 6 | Messaging | 3-4h | 🟡 Medium | 8 |
| 7 | Wallet | 2-3h | 🟢 Low | 6 |
| 8 | Gifts | 2-3h | 🟢 Low | 6 |
| 9 | Groups | 2-3h | 🟢 Low | 6 |
| 10 | Events | 2-3h | 🟢 Low | 6 |
| 11 | Room | 3-4h | 🟢 Low | 8 |

### Pattern Chung Cho Mỗi Module

1. **Tạo structure** → commit
2. **Thêm/update schema** → commit
3. **Tạo DTOs** → commit
4. **Implement Service** → commit
5. **Implement Controller** → commit
6. **Tạo Module** → commit
7. **Import vào AppModule** → commit
8. **Test & fix** → commit

### Checklist Cho Mỗi Module

- [ ] Folder structure đã tạo
- [ ] Schema đã có/update trong Prisma
- [ ] Migration đã chạy
- [ ] DTOs đã tạo với validation
- [ ] Service đã implement
- [ ] Controller đã implement
- [ ] Module đã tạo
- [ ] Import vào AppModule
- [ ] Build thành công
- [ ] Endpoints test thành công
- [ ] Swagger documentation đầy đủ
- [ ] Cache đã implement (nếu cần)
- [ ] Tất cả commits đã push

---

## 🚀 Bắt Đầu

**Bước tiếp theo**: Làm Users Module (Module 1) theo hướng dẫn chi tiết ở trên!

**Sau khi hoàn thành Users Module**, tiếp tục với Associate Module, rồi Profile Module, v.v.

**Mỗi module hoàn thành = 6-8 commits rõ ràng!**
