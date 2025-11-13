import { Controller, Get, Param, Query, Post, Delete, Body, Put } from '@nestjs/common';
import { ApiTags, ApiQuery, ApiBody, ApiOperation, ApiParam, ApiOkResponse } from '@nestjs/swagger';
import { ResUserService } from '../service/res-user.service';
import { ConnectionsResponseDto, UpdateUserDto, UploadAvatarDto } from '../dto/update-user.dto';
import { SearchUserDto } from '../dto/search-user.dto';
import { SendMessageDto } from '../dto/send-message.dto';

@ApiTags('Users')
@Controller('users')
export class ResUserController {
  constructor(private readonly usersService: ResUserService) {}

  @Get()
  @ApiOperation({ summary: 'Tìm kiếm danh sách users' })
  @ApiQuery({ name: 'search', required: false, description: 'Từ khóa tìm kiếm', example: 'NguyenVanA' })
  @ApiOkResponse({
    description: 'Danh sách user theo schema Prisma',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Users fetched' },
        users: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              union_id: { type: 'string' },
              role: { type: 'string' },
              nickname: { type: 'string' },
              bio: { type: 'string' },
              avatar: { type: 'string' },
              gender: { type: 'string' },
              birthday: { type: 'string' },
              created_at: { type: 'string' },
            },
          },
        },
      },
    },
  })
  findAll(@Query() query: SearchUserDto) {
    return this.usersService.searchUsers(query.search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết user theo id' })
  @ApiParam({ name: 'id', description: 'ID của user', example: 'User ID' })
  @ApiOkResponse({
    description: 'User theo schema Prisma (bao gồm albums và photos)',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        union_id: { type: 'string' },
        role: { type: 'string' },
        nickname: { type: 'string' },
        bio: { type: 'string' },
        avatar: { type: 'string' },
        gender: { type: 'string' },
        birthday: { type: 'string' },
        albums: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              image_url: { type: 'string' },
              photos: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    album_id: { type: 'string' },
                    image_url: { type: 'string' },
                    created_at: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
  
  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin cá nhân của user' })
  @ApiParam({ name: 'id', description: 'ID của user', example: 'User ID' })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({
    description: 'Kết quả cập nhật',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Profile updated successfully' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            nickname: { type: 'string' },
            bio: { type: 'string' },
            avatar: { type: 'string' },
            gender: { type: 'string' },
            birthday: { type: 'string' },
            updated_at: { type: 'string' },
          },
        },
      },
    },
  })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(id, dto);
  }
  
  @Get(':id/stats')
  @ApiOperation({ summary: 'Lấy thông tin tổng quan (followers, following, friends) của user' })
  @ApiParam({ name: 'id', description: 'ID của user', example: 'User ID' })
  @ApiOkResponse({
    description: 'Thống kê theo schema Prisma',
    schema: {
      type: 'object',
      properties: {
        followers: { type: 'number' },
        following: { type: 'number' },
        friends: { type: 'number' },
      },
    },
  })
  getStats(@Param('id') id: string) {
    return this.usersService.getStats(id);
  }

  // Follow lại / follow mới
  @Post(':id/following/:target_id')
  @ApiOperation({ summary: 'Follow user khác' })
  @ApiParam({ name: 'id', description: 'ID của user hiện tại', example: 'User ID' })
  @ApiParam({ name: 'target_id', description: 'ID user cần follow', example: 'Target ID' })
  @ApiOkResponse({
    description: 'Kết quả follow',
    schema: { type: 'object', properties: { message: { type: 'string' } } },
  })
  follow(@Param('id') userId: string, @Param('target_id') targetId: string) {
    return this.usersService.followUser(userId, targetId);
  }
  
  @Get(':id/following')
  @ApiOperation({ summary: 'Lấy danh sách users đang follow' })
  @ApiParam({ name: 'id', description: 'ID của user', example: 'User ID' })
  @ApiOkResponse({
    description: 'Danh sách users đang follow',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        users: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, nickname: { type: 'string' } } } },
      },
    },
  })
  getFollowing(@Param('id') id: string) {
    return this.usersService.getFollowing(id);
  }

  // Hủy follow (unfollow)
  @Delete(':id/following/:following_id')
  @ApiOperation({ summary: 'Hủy follow user' })
  @ApiParam({ name: 'id', description: 'ID user hiện tại', example: 'User ID' })
  @ApiParam({ name: 'following_id', description: 'ID user cần unfollow', example: 'Target ID' })
  @ApiOkResponse({ description: 'Kết quả unfollow', schema: { type: 'object', properties: { message: { type: 'string' } } } })
  
  unfollow(@Param('id') userId: string, @Param('following_id') followingId: string) {
    return this.usersService.unfollowUser(userId, followingId);
  }

  @Get(':id/followers')
  @ApiOperation({ summary: 'Lấy danh sách followers của user' })
  @ApiParam({ name: 'id', description: 'ID user', example: 'User ID' })
  @ApiOkResponse({
    description: 'Danh sách followers',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        users: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, nickname: { type: 'string' } } } },
      },
    },
  })
  getFollowers(@Param('id') id: string) {
    return this.usersService.getFollowers(id);
  }
  
  // Xóa follower  (người follow bạn)
  @Delete(':id/followers/:follower_id')
  @ApiOperation({ summary: 'Xóa follower (người follow bạn)' })
  @ApiParam({ name: 'id', description: 'ID user hiện tại', example: 'User ID' })
  @ApiParam({ name: 'follower_id', description: 'ID follower cần xóa', example: 'Target ID' })
  @ApiOkResponse({ description: 'Kết quả xóa follower', schema: { type: 'object', properties: { message: { type: 'string' } } } })
  removeFollower(@Param('id') userId: string, @Param('follower_id') followerId: string) {
    return this.usersService.removeFollower(userId, followerId);
  }

  @Get(':id/friends')
  @ApiOperation({ summary: 'Lấy danh sách friends của user' })
  @ApiParam({ name: 'id', description: 'ID user', example: 'User ID' })
  @ApiOkResponse({
    description: 'Danh sách friends',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        users: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, nickname: { type: 'string' } } } },
      },
    },
  })
  getFriends(@Param('id') id: string) {
    return this.usersService.getFriends(id);
  }

  // Xóa friend
  @Delete(':id/friends/:friend_id')
  @ApiOperation({ summary: 'Xóa friend' })
  @ApiParam({ name: 'id', description: 'ID user hiện tại', example: 'User ID' })
  @ApiParam({ name: 'friend_id', description: 'ID friend cần xóa', example: 'Target ID' })
  @ApiOkResponse({ description: 'Kết quả unfriend', schema: { type: 'object', properties: { message: { type: 'string' } } } })
  unfriend(@Param('id') userId: string, @Param('friend_id') friendId: string) {
    return this.usersService.unfriend(userId, friendId);
  }

  
  @Get(':id/connections')
  @ApiOperation({ summary: 'Lấy danh sách kết nối theo loại (followers, following, friends)' })
  @ApiQuery({ name: 'type', required: true, description: 'Loại kết nối', enum: ['followers', 'following', 'friends'], example: 'followers' })
  @ApiQuery({ name: 'search', required: false, description: 'Từ khóa tìm kiếm', example: 'NguyenVanA' })
  @ApiParam({ name: 'id', description: 'ID user', example: 'User ID' })
  @ApiOkResponse({
    description: 'Danh sách kết nối',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        users: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              nickname: { type: 'string' },
              avatar: { type: 'string' },
              is_following: { type: 'boolean' },
              is_friend: { type: 'boolean' },
            },
          },
        },
      },
    },
  })
  async getConnections(
    @Param('id') userId: string,
    @Query('type') type: 'followers' | 'following' | 'friends',
    @Query('search') search?: string,
  ) {
    return this.usersService.getConnections(userId, type, search)
  }


  // gửi tin nhắn
  @Post(':id/messages')
  @ApiOperation({ summary: 'Gửi tin nhắn đến user khác' })
  @ApiParam({ name: 'id', description: 'ID người gửi', example: 'User ID' })
  @ApiBody({ type: SendMessageDto })
  @ApiOkResponse({
    description: 'Tin nhắn đã gửi theo schema Prisma',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        data: { type: 'object', properties: { id: { type: 'string' }, sender_id: { type: 'string' }, receiver_id: { type: 'string' }, content: { type: 'string' }, created_at: { type: 'string' } } },
      },
    },
  })
  sendMessage(@Param('id') senderId: string, @Body() dto: SendMessageDto) {
    return this.usersService.sendMessage(senderId, dto);
  }

  @Post(':id/avatar')
  @ApiOperation({ summary: 'Upload avatar cho user' })
  @ApiParam({ name: 'id', description: 'ID user', example: 'User ID' })
  @ApiBody({ schema: { type: 'object', properties: { fileUrl: { type: 'string', example: 'https://example.com/avatar.jpg' } } } })
  @ApiOkResponse({ description: 'Kết quả upload avatar', schema: { type: 'object', properties: { message: { type: 'string' }, avatar: { type: 'string' } } } })
  uploadAvatar(@Param('id') userId: string, @Body() dto: UploadAvatarDto) {
    return this.usersService.uploadAvatar(userId, dto.fileUrl);
  }
}
