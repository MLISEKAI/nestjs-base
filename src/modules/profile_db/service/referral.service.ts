import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReferralService {
  constructor(private prisma: PrismaService) {}

  async getReferrals(userId: string) {
    return this.prisma.resReferral.findMany({ where: { referred_id: userId } });
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
