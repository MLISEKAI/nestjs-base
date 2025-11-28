// Import Injectable và exceptions từ NestJS
import { Injectable, NotFoundException } from '@nestjs/common';
// Import các DTO để validate và type-check dữ liệu
import { UpdateUserDto } from '../dto/user-response';
// Import các services khác để sử dụng
import { UserProfileService } from './user-profile.service';
import { UserConnectionsService } from './user-connections.service';
import { UserAlbumsService } from './user-albums.service';

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * ResUserService - Service tổng hợp các user operations (facade pattern)
 *
 * Chức năng chính:
 * - Tổng hợp các operations từ UserProfileService, UserConnectionsService, UserAlbumsService
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

  async getStats(user_id: string) {
    return this.connections.getStats(user_id);
  }

  async followUser(user_id: string, targetId: string) {
    return this.connections.followUser(user_id, targetId);
  }

  async unfollowUser(user_id: string, targetId: string) {
    return this.connections.unfollowUser(user_id, targetId);
  }

  async removeFollower(user_id: string, followerId: string) {
    return this.connections.removeFollower(user_id, followerId);
  }

  async unfriend(user_id: string, friendId: string) {
    return this.connections.unfriend(user_id, friendId);
  }

  async getFollowing(user_id: string) {
    return this.connections.getFollowing(user_id);
  }

  async getFollowers(user_id: string) {
    return this.connections.getFollowers(user_id);
  }

  async getFriends(user_id: string) {
    return this.connections.getFriends(user_id);
  }

  async getConnections(
    user_id: string,
    type: 'followers' | 'following' | 'friends',
    search?: string,
  ) {
    return this.connections.getConnections(user_id, type, search);
  }

  async uploadAvatar(user_id: string, fileUrl: string) {
    return this.profile.uploadAvatar(user_id, fileUrl);
  }

  async getAlbums(user_id: string) {
    return this.albums.getAlbums(user_id);
  }

  async getAlbumPhotos(user_id: string, albumId: string) {
    return this.albums.getAlbumPhotos(user_id, albumId);
  }

  async addPhotoToAlbum(user_id: string, albumId: string, imageUrl: string) {
    return this.albums.addPhotoToAlbum(user_id, albumId, imageUrl);
  }

  async deletePhotoFromAlbum(user_id: string, albumId: string, photoId: string) {
    return this.albums.deletePhotoFromAlbum(user_id, albumId, photoId);
  }
}
