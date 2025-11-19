import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StatsQueryDto } from '../dto/stats-query.dto';
import { UpdateUserProfileDto } from '../dto/profile.dto';
import { BlockUserService } from '../../block-user/service/block-user.service';

@Injectable()
export class UserProfileService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => BlockUserService))
    private blockUserService: BlockUserService,
  ) {}

  async getProfile(userId: string, currentUserId?: string) {
    const user = await this.prisma.resUser.findUnique({
      where: { id: userId },
      include: {
        albums: { include: { photos: true } },
        wallets: true,
        vipStatus: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    // Check if account is locked
    const isAccountLocked = user.is_blocked || false;

    // Check block status if currentUserId is provided
    let isBlockedByMe = false;
    let hasBlockedMe = false;

    if (currentUserId && currentUserId !== userId) {
      const blockStatus = await this.blockUserService.getBlockStatus(currentUserId, userId);
      isBlockedByMe = blockStatus.isBlockedByMe;
      hasBlockedMe = blockStatus.hasBlockedMe;
    }

    return {
      ...user,
      statusBadge: 'Bronze',
      isAccountLocked,
      isBlockedByMe,
      hasBlockedMe,
      relationshipStatus: 'single',
    };
  }

  async updateProfile(userId: string, dto: UpdateUserProfileDto) {
    // Tối ưu: Dùng update trực tiếp, Prisma sẽ throw NotFoundException nếu user không tồn tại
    try {
      return await this.prisma.resUser.update({
        where: { id: userId },
        data: {
          nickname: dto.nickname,
          avatar: dto.avatar,
          bio: dto.bio,
          gender: dto.gender,
          birthday: dto.birthday ? new Date(dto.birthday) : undefined,
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        // Prisma error code for record not found
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  async deleteProfile(userId: string) {
    await this.prisma.resUser.delete({ where: { id: userId } });
    return { message: 'Profile deleted' };
  }

  async getStats(userId: string, query: StatsQueryDto) {
    const [posts, followers, following] = await Promise.all([
      this.prisma.resPost.count({ where: { user_id: userId } }),
      this.prisma.resFollow.count({ where: { following_id: userId } }),
      this.prisma.resFollow.count({ where: { follower_id: userId } }),
    ]);
    return {
      posts,
      followers,
      following,
      totalViews: Math.floor(Math.random() * 1000), // TODO: Tính từ profile views nếu có
    };
  }

  async getRoomStatus(userId: string) {
    return this.prisma.resRoomStatus.findUnique({ where: { user_id: userId } });
  }
}
