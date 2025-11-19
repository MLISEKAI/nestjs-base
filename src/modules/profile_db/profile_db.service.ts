import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProfileServiceDb {
  constructor(private prisma: PrismaService) {}

  async postQuestScan(userId: string, dto: { qrCode: string }) {
    return { message: `Quest scanned successfully: ${dto.qrCode}` };
  }

  async getUserLocation(userId: string) {
    return this.prisma.resLocation.findUnique({ where: { user_id: userId } });
  }

  async getUserContribution(userId: string) {
    return this.prisma.resContribution.findUnique({ where: { user_id: userId } });
  }

  async getUserInterests(userId: string) {
    return this.prisma.resInterest.findMany({ where: { user_id: userId } });
  }
}
