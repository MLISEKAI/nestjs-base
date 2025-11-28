import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/cache/cache.service';
import { StatsQueryDto } from '../dto/stats-query.dto';
import { UpdateUserProfileDto } from '../dto/profile.dto';
import { BlockUserService } from '../../../users/block-user/service/block-user.service';

@Injectable()
export class UserProfileService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    @Inject(forwardRef(() => BlockUserService))
    private blockUserService: BlockUserService,
  ) {}

  async getProfile(user_id: string, currentuser_id?: string) {
    // Cache key: profile:{user_id}:{currentuser_id} để cache theo viewer
    const cacheKey = `profile:${user_id}:${currentuser_id || 'public'}`;
    const cacheTtl = 1800; // 30 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const user = await this.prisma.resUser.findUnique({
          where: { id: user_id },
          include: {
            albums: { include: { photos: true } },
            wallets: true,
            vipStatus: true,
          },
        });
        if (!user) throw new NotFoundException('User not found');

        // Check if account is locked
        const isAccountLocked = user.is_blocked || false;

        // Check block status if currentuser_id is provided
        let isBlockedByMe = false;
        let hasBlockedMe = false;

        if (currentuser_id && currentuser_id !== user_id) {
          const blockStatus = await this.blockUserService.getBlockStatus(currentuser_id, user_id);
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
      },
      cacheTtl,
    );
  }

  async updateProfile(user_id: string, dto: UpdateUserProfileDto) {
    // Tối ưu: Dùng update trực tiếp, Prisma sẽ throw NotFoundException nếu user không tồn tại
    try {
      const updated = await this.prisma.resUser.update({
        where: { id: user_id },
        data: {
          nickname: dto.nickname,
          avatar: dto.avatar,
          bio: dto.bio,
          gender: dto.gender,
          birthday: dto.birthday ? new Date(dto.birthday) : undefined,
        },
        select: {
          id: true,
          nickname: true,
          bio: true,
          avatar: true,
          gender: true,
          birthday: true,
          updated_at: true,
          albums: {
            select: {
              id: true,
              image_url: true,
              created_at: true,
            },
            orderBy: {
              created_at: 'desc',
            },
          },
        },
      });

      // Invalidate cache
      await this.cacheService.delPattern(`profile:${user_id}:*`);

      return updated;
    } catch (error) {
      if (error.code === 'P2025') {
        // Prisma error code for record not found
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  async deleteProfile(user_id: string) {
    await this.prisma.resUser.delete({ where: { id: user_id } });
    return { message: 'Profile deleted' };
  }

  async getStats(user_id: string, query: StatsQueryDto) {
    const cacheKey = `profile:${user_id}:stats`;
    const cacheTtl = 300; // 5 phút (stats thay đổi thường xuyên)

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const [posts, followers, following] = await Promise.all([
          this.prisma.resPost.count({ where: { user_id: user_id } }),
          this.prisma.resFollow.count({ where: { following_id: user_id } }),
          this.prisma.resFollow.count({ where: { follower_id: user_id } }),
        ]);
        return {
          posts,
          followers_count: followers,
          following_count: following,
          views_count: Math.floor(Math.random() * 1000), // TODO: Tính từ profile views nếu có
        };
      },
      cacheTtl,
    );
  }

  async getRoomStatus(user_id: string) {
    return this.prisma.resRoomStatus.findUnique({ where: { user_id: user_id } });
  }
}
