import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/cache/cache.service';
import { buildPaginatedResponse } from '../../../common/utils/pagination.util';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

@Injectable()
export class GiftSummaryService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async getGiftsSummary(userId: string, query?: BaseQueryDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const cacheKey = `user:${userId}:gifts:summary:page:${page}:limit:${take}`;
    const cacheTtl = 60; // 1 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const [gifts, total] = await Promise.all([
          this.prisma.resGift.findMany({
            where: { receiver_id: userId },
            take,
            skip,
            orderBy: { created_at: 'desc' },
            include: {
              sender: { select: { id: true, nickname: true, avatar: true } },
              giftItem: { select: { id: true, name: true, image_url: true, price: true } },
            },
          }),
          this.prisma.resGift.count({ where: { receiver_id: userId } }),
        ]);

        return buildPaginatedResponse(gifts, total, page, take);
      },
      cacheTtl,
    );
  }

  async getTopSupporters(userId: string) {
    const cacheKey = `user:${userId}:gifts:top-supporters`;
    const cacheTtl = 300; // 5 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const supporters = await this.prisma.resSupporter.findMany({
          where: { user_id: userId },
          orderBy: { amount: 'desc' },
          take: 5,
        });
        return supporters;
      },
      cacheTtl,
    );
  }

  async getGiftMilestones(userId: string) {
    const cacheKey = `user:${userId}:gifts:milestones`;
    const cacheTtl = 300; // 5 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return this.prisma.resGiftMilestone.findMany({ where: { user_id: userId } });
      },
      cacheTtl,
    );
  }
}
