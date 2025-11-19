import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';
import { buildPaginatedResponse } from '../../../../common/utils/pagination.util';

@Injectable()
export class ReferralService {
  constructor(private prisma: PrismaService) {}

  async getReferrals(userId: string, query?: BaseQueryDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const [referrals, total] = await Promise.all([
      this.prisma.resReferral.findMany({
        where: { referred_id: userId },
        take,
        skip,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.resReferral.count({ where: { referred_id: userId } }),
    ]);

    return buildPaginatedResponse(referrals, total, page, take);
  }

  async addReferral(userId: string, referredId: string) {
    return this.prisma.resReferral.create({
      data: { referrer_id: userId, referred_id: referredId },
    });
  }

  async removeReferral(userId: string, referredId: string) {
    await this.prisma.resReferral.deleteMany({
      where: { referrer_id: userId, referred_id: referredId },
    });
    return { message: 'Referral removed' };
  }
}
