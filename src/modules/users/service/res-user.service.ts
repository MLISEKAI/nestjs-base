// Import Injectable và exceptions từ NestJS
import { Injectable, NotFoundException } from '@nestjs/common';
// Import các DTO để validate và type-check dữ liệu
import { UpdateUserDto } from '../dto/user-response';
import { SendMessageDto } from '../dto/send-message.dto';
// Import các services khác để sử dụng
import { UserProfileService } from './user-profile.service';
import { UserConnectionsService } from './user-connections.service';
import { UserAlbumsService } from './user-albums.service';
import { UserMessagingService } from './user-messaging.service';

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * ResUserService - Service tổng hợp các user operations (facade pattern)
 *
 * Chức năng chính:
 * - Tổng hợp các operations từ UserProfileService, UserConnectionsService, UserMessagingService, UserAlbumsService
 * - Cung cấp unified interface cho user operations
 * - Được export từ UsersModule để các modules khác sử dụng
 *
 * Lưu ý:
 * - Service này là facade pattern, delegate các operations đến các services chuyên biệt
 * - Được export từ UsersModule để các modules khác có thể sử dụng
 */
@Injectable()
export class ResUserService {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject các services khi tạo instance của service
   */
  constructor(
    private profile: UserProfileService,
    private connections: UserConnectionsService,
    private messaging: UserMessagingService,
    private albums: UserAlbumsService,
  ) {}

  async findOne(id: string) {
    return this.profile.findOne(id);
  }

  async findUser(id: string, includeAssociates = false) {
    return this.profile.findUser(id, includeAssociates);
  }

  async updateProfile(id: string, dto: UpdateUserDto) {
    return this.profile.updateProfile(id, dto);
  }

  async searchUsers(search?: string, page?: number, limit?: number, sort?: string) {
    return this.profile.searchUsers({ search, page, limit, sort });
  }

  async getStats(userId: string) {
    return this.connections.getStats(userId);
  }

  async followUser(userId: string, targetId: string) {
    return this.connections.followUser(userId, targetId);
  }

  async unfollowUser(userId: string, targetId: string) {
    return this.connections.unfollowUser(userId, targetId);
  }

  async removeFollower(userId: string, followerId: string) {
    return this.connections.removeFollower(userId, followerId);
  }

  async unfriend(userId: string, friendId: string) {
    return this.connections.unfriend(userId, friendId);
  }

  async getFollowing(userId: string) {
    return this.connections.getFollowing(userId);
  }

  async getFollowers(userId: string) {
    return this.connections.getFollowers(userId);
  }

  async getFriends(userId: string) {
    return this.connections.getFriends(userId);
  }

  async getConnections(
    userId: string,
    type: 'followers' | 'following' | 'friends',
    search?: string,
  ) {
    return this.connections.getConnections(userId, type, search);
  }

  async sendMessage(senderId: string, dto: SendMessageDto) {
    return this.messaging.sendMessage(senderId, dto);
  }

  async uploadAvatar(userId: string, fileUrl: string) {
    return this.profile.uploadAvatar(userId, fileUrl);
  }

  async getAlbums(userId: string) {
    return this.albums.getAlbums(userId);
  }

  async getAlbumPhotos(userId: string, albumId: string) {
    return this.albums.getAlbumPhotos(userId, albumId);
  }

  async addPhotoToAlbum(userId: string, albumId: string, imageUrl: string) {
    return this.albums.addPhotoToAlbum(userId, albumId, imageUrl);
  }

  async deletePhotoFromAlbum(userId: string, albumId: string, photoId: string) {
    return this.albums.deletePhotoFromAlbum(userId, albumId, photoId);
  }
}
