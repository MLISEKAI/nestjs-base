import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';
import { CreateClanDto, UpdateClanRankDto } from '../dto/clan.dto';
import { buildPaginatedResponse } from '../../../../common/utils/pagination.util';

@Injectable()
export class ClanService {
  constructor(private prisma: PrismaService) {}

  async getAllClans(query?: BaseQueryDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const [clans, total] = await Promise.all([
      this.prisma.resClan.findMany({
        select: {
          id: true,
          name: true,
        },
        take,
        skip,
        orderBy: { name: 'asc' },
      }),
      this.prisma.resClan.count(),
    ]);

    return buildPaginatedResponse(clans, total, page, take);
  }

  async getClans(userId: string, query: BaseQueryDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const [userClans, total] = await Promise.all([
      this.prisma.resUserClan.findMany({
        where: { user_id: userId },
        include: { clan: true },
        take,
        skip,
        // Note: ResUserClan may not have created_at field, order by id instead
        orderBy: { id: 'desc' },
      }),
      this.prisma.resUserClan.count({ where: { user_id: userId } }),
    ]);

    return buildPaginatedResponse(userClans, total, page, take);
  }

  async createClan(userId: string, dto: CreateClanDto) {
    const clan = await this.prisma.resClan.create({
      data: { name: dto.name },
    });
    await this.prisma.resUserClan.create({
      data: { user_id: userId, clan_id: clan.id, rank: 'Leader' },
    });
    return clan;
  }

  async joinClan(userId: string, clanId: string) {
    return this.prisma.resUserClan.create({
      data: { user_id: userId, clan_id: clanId, rank: 'Member' },
    });
  }

  async leaveClan(userId: string, clanId: string) {
    await this.prisma.resUserClan.deleteMany({ where: { user_id: userId, clan_id: clanId } });
    return { message: 'Left clan' };
  }

  async updateClanRole(userId: string, clanId: string, dto: UpdateClanRankDto) {
    try {
      if (dto.rank === undefined) {
        // Nếu không có rank, cần lấy giá trị hiện tại
        const existing = await this.prisma.resUserClan.findFirst({
          where: { user_id: userId, clan_id: clanId },
          select: { id: true, rank: true },
        });
        if (!existing) throw new NotFoundException('Membership not found');
        return this.prisma.resUserClan.update({
          where: { id: existing.id },
          data: { rank: existing.rank },
        });
      }
      // Tìm membership và update
      const existing = await this.prisma.resUserClan.findFirst({
        where: { user_id: userId, clan_id: clanId },
        select: { id: true },
      });
      if (!existing) throw new NotFoundException('Membership not found');
      return this.prisma.resUserClan.update({
        where: { id: existing.id },
        data: { rank: dto.rank },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Membership not found');
      }
      throw error;
    }
  }

  async getClanInfo(userId: string) {
    return this.prisma.resUserClan.findFirst({
      where: { user_id: userId },
      include: { clan: true },
    });
  }
}
