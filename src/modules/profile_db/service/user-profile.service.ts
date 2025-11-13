import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserProfileDto } from '../dto/profile.dto';
import { StatsQueryDto } from '../dto/stats-query.dto';

@Injectable()
export class UserProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.resUser.findUnique({
      where: { id: userId },
      include: {
        albums: { include: { photos: true } },
        wallet: true,
        vipStatus: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    return {
      ...user,
      statusBadge: 'Bronze',
      isAccountLocked: false,
      isBlockedByMe: false,
      hasBlockedMe: false,
      relationshipStatus: 'single',
    };
  }

  async updateProfile(userId: string, dto: UpdateUserProfileDto) {
    const existing = await this.prisma.resUser.findUnique({ where: { id: userId } });
    if (!existing) throw new NotFoundException('User not found');
    return this.prisma.resUser.update({
      where: { id: userId },
      data: {
        nickname: dto.nickname,
        avatar: dto.avatar,
        bio: dto.bio,
        gender: dto.gender,
        birthday: dto.birthday ? new Date(dto.birthday) : undefined,
      },
    });
  }

  async deleteProfile(userId: string) {
    await this.prisma.resUser.delete({ where: { id: userId } });
    return { message: 'Profile deleted' };
  }

  async getStats(userId: string, query: StatsQueryDto) {
    const posts = 0;
    const followers = await this.prisma.resFollow.count({ where: { following_id: userId } });
    const following = await this.prisma.resFollow.count({ where: { follower_id: userId } });
    return {
      posts,
      followers,
      following,
      totalViews: Math.floor(Math.random() * 1000),
    };
  }

  async getRoomStatus(userId: string) {
    return this.prisma.resRoomStatus.findUnique({ where: { user_id: userId } });
  }
}