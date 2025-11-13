import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from '../dto/update-user.dto';
import { SendMessageDto } from '../dto/send-message.dto';
import { UserProfileService } from './user-profile.service';
import { UserConnectionsService } from './user-connections.service';
import { UserAlbumsService } from './user-albums.service';
import { UserMessagingService } from './user-messaging.service';

@Injectable()
export class ResUserService {
  constructor(
    private profile: UserProfileService,
    private connections: UserConnectionsService,
    private messaging: UserMessagingService,
    private albums: UserAlbumsService,
  ) {}

  async findOne(id: string) {
    return this.profile.findOne(id);
  }

  async findUser(id: string) {
    return this.profile.findUser(id);
  }

  async updateProfile(id: string, dto: UpdateUserDto) {
    return this.profile.updateProfile(id, dto);
  }

  async searchUsers(search?: string) {
    return this.profile.searchUsers(search);
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

  async getConnections(userId: string, type: 'followers' | 'following' | 'friends', search?: string) {
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

