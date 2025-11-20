import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/cache/cache.service';

@Injectable()
export class ProfileViewsServiceDb {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  // Ghi log khi user A xem hồ sơ user B
  async logProfileView(targetUserId: string, viewerId: string) {
    const view = await this.prisma.resProfileView.create({
      data: {
        viewer_id: viewerId,
        target_user_id: targetUserId,
      },
    });

    // Invalidate cache
    await this.cacheService.delPattern(`profile:${targetUserId}:views:*`);

    return view;
  }

  // Lấy lần xem cuối cùng của viewer_id vào hồ sơ target_user_id
  async getLastView(targetUserId: string, viewerId: string) {
    const lastView = await this.prisma.resProfileView.findFirst({
      where: {
        target_user_id: targetUserId,
        viewer_id: viewerId,
      },
      orderBy: { viewed_at: 'desc' },
    });
    if (!lastView) throw new NotFoundException('No view found');
    return lastView;
  }

  // Lấy danh sách lượt xem hồ sơ
  // Cached for 5 minutes
  async getProfileViews(userId: string, full: boolean = false) {
    const cacheKey = `profile:${userId}:views:${full ? 'full' : 'basic'}`;
    const cacheTtl = 300; // 5 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const views = await this.prisma.resProfileView.findMany({
          where: { target_user_id: userId },
          orderBy: { viewed_at: 'desc' },
          include: full ? { viewer: true } : undefined,
        });

        if (!full) {
          return views.map((v) => ({
            viewer_id: v.viewer_id,
            viewed_at: v.viewed_at,
          }));
        }

        return views.map((v) => ({
          viewer_id: v.viewer_id,
          viewed_at: v.viewed_at,
          viewer_name: v.viewer.nickname,
        }));
      },
      cacheTtl,
    );
  }
}
