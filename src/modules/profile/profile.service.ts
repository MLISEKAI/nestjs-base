import { Injectable, NotFoundException } from '@nestjs/common';
import {
  mockUsers,
  mockStats,
  mockWallet,
  mockVipStatus,
  mockStore,
  mockTaskSummary,
  mockLoveSpace,
  mockInventory,
  mockClans,
  mockReferrals,
  mockPosts,
  mockSupportInfo,
  mockHelpArticles,
  mockCompanyInfo,
  mockUserStatus,
  mockUserLevel,
  mockAlbums,
  mockLocation,
  mockContribution,
  mockInterests,
  mockGiftsSummary,
  mockTopGifts,
  mockTopSupporters,
  mockRelationshipSummary,
  mockRelationships,
  mockRoomStatus,
  mockClanInfo,
} from './profile.mock';
import { ClanDto } from './dto/clan.dto';
import { FeedbackDto } from './dto/feedback.dto';
import { LoveSpaceDto } from './dto/lovespace.dto';
import { UserProfileDto } from './dto/profile.dto';
import { QuestScanDto } from './dto/questscan.dto';
import { UserStatsDto } from './dto/sats.dto';
import { StoreDto } from './dto/store.dto';
import { VipStatusDto } from './dto/vip.dto';
import { WalletDto } from './dto/wallet.dto';

@Injectable()
export class ProfileService {
  async getProfile(userId: string, dto: UserProfileDto) {
    const user = mockUsers.find((u) => u.id === userId);
    if (!user) return null;
    const albums = mockAlbums.filter((a) => a.user_id === userId);

    return {
      ...user,
      level: mockUserLevel,
      statusBadge: mockUserStatus.statusBadge,
      isAccountLocked: mockUserStatus.isAccountLocked,
      isBlockedByMe: mockUserStatus.isBlockedByMe,
      hasBlockedMe: mockUserStatus.hasBlockedMe,
      relationshipStatus: mockUserStatus.relationshipStatus,
      albums,
    };
  }

  async getStats(userId: string, dto: UserStatsDto) {
    return mockStats;
  }

  async getWallet(userId: string, dto: WalletDto) {
    return mockWallet;
  }

  async getVipStatus(userId: string, dto: VipStatusDto) {
    return mockVipStatus;
  }

  async getStore(userId: string, dto: StoreDto) {
    return mockStore;
  }

  async getTaskSummary(userId: string, dto: any) {
    return mockTaskSummary;
  }

  async getLoveSpace(userId: string, dto: LoveSpaceDto) {
    return mockLoveSpace;
  }

  async getPosts(userId: string, dto: any) {
    return mockPosts[userId] || [];
  }

  async getInventory(userId: string, dto: any) {
    return mockInventory;
  }

  async getClans(userId: string, dto: ClanDto) {
    return mockClans;
  }

  async getReferrals(userId: string, dto: any) {
    return mockReferrals;
  }

  async getHelpArticles() {
    return mockHelpArticles;
  }

  async getCompanyInfo() {
    return mockCompanyInfo;
  }

  async postFeedback(dto: FeedbackDto) {
    return {
      success: true,
      message: 'Feedback received successfully',
      data: dto,
    };
  }

  async postQuestScan(userId: string, dto: QuestScanDto) {
    return {
      success: true,
      questId: 7,
      questTitle: 'Tìm kho báu',
      description: `Quest được scan từ QR: ${dto.qrCode}`,
      reward: '50 coins',
    };
  }

  async getUserLocation(userId: string) {
    return mockLocation;
  }

  async getUserContribution(userId: string) {
    return mockContribution;
  }

  async getUserInterests(userId: string) {
    return mockInterests;
  }

  async getGiftsSummary(userId: string) {
    return mockGiftsSummary;
  }

  async getTopGifts(userId: string) {
    return mockTopGifts;
  }

  async getTopSupporters(userId: string) {
    return mockTopSupporters;
  }

  async getRelationshipSummary(userId: string) {
    return mockRelationshipSummary;
  }

  async getRelationships(userId: string) {
    return mockRelationships;
  }

  async getRoomStatus(userId: string) {
    return mockRoomStatus;
  }

  async getClanInfo(userId: string) {
    return mockClanInfo;
  }

  async getSupportInfo() {
    return mockSupportInfo;
  }

  async getAlbums(userId: string) {
    return mockAlbums.filter((a) => a.user_id === userId);
  }

  // Lấy tất cả ảnh trong 1 album
  async getAlbumPhotos(userId: string, albumId: string) {
    const album = mockAlbums.find(
      (a) => a.id === albumId && a.user_id === userId,
    );
    if (!album) throw new NotFoundException('Album not found');
    return album.photos;
  }

  // Thêm ảnh vào album
  async addPhotoToAlbum(userId: string, albumId: string, imageUrl: string) {
    const album = mockAlbums.find(
      (a) => a.id === albumId && a.user_id === userId,
    );
    if (!album) throw new NotFoundException('Album not found');

    const newPhoto = {
      id: `mock-${Date.now()}`,
      album_id: albumId,
      image_url: imageUrl,
    };

    album.photos.push(newPhoto);
    return newPhoto;
  }

  // Xóa ảnh khỏi album
  async deletePhotoFromAlbum(userId: string, albumId: string, photoId: string) {
    const album = mockAlbums.find(
      (a) => a.id === albumId && a.user_id === userId,
    );
    if (!album) throw new NotFoundException('Album not found');

    album.photos = album.photos.filter((p) => p.id !== photoId);
    return { message: 'Photo deleted' };
  }
}
