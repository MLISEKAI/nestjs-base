import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseQueryDto } from '../dto/base-query.dto';
import { CreateClanDto, UpdateClanRankDto } from '../dto/clan.dto';

@Injectable()
export class ClanService {
  constructor(private prisma: PrismaService) {}

  async getAllClans() {
    return this.prisma.resClan.findMany({
      select: {
        id: true,
        name: true,
      },
    });
  }

  async getClans(userId: string, query: BaseQueryDto) {
    return this.prisma.resUserClan.findMany({
      where: { user_id: userId },
      include: { clan: true },
    });
  }

  async createClan(userId: string, dto: CreateClanDto) {
    const clan = await this.prisma.resClan.create({
      data: { name: dto.name},
    });
    await this.prisma.resUserClan.create({
      data: { user_id: userId, clan_id: clan.id, rank: 'Leader' },
    });
    return clan;
  }

  async joinClan(userId: string, clanId: string) {
    return this.prisma.resUserClan.create({ data: { user_id: userId, clan_id: clanId, rank: 'Member' } });
  }

  async leaveClan(userId: string, clanId: string) {
    await this.prisma.resUserClan.deleteMany({ where: { user_id: userId, clan_id: clanId } });
    return { message: 'Left clan' };
  }

  async updateClanRole(userId: string, clanId: string, dto: UpdateClanRankDto) {
    const existing = await this.prisma.resUserClan.findFirst({ where: { user_id: userId, clan_id: clanId } });
    if (!existing) throw new NotFoundException('Membership not found');
    return this.prisma.resUserClan.update({ where: { id: existing.id }, data: { rank: dto.rank ?? existing.rank } });
  }

  async getClanInfo(userId: string) {
    return this.prisma.resUserClan.findFirst({
      where: { user_id: userId },
      include: { clan: true },
    });
  }
}