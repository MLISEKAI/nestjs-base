// Import Injectable và exceptions từ NestJS
import { Injectable, NotFoundException } from '@nestjs/common';
// Import PrismaService để query database
import { PrismaService } from 'src/prisma/prisma.service';
// Import CacheService để cache data
import { CacheService } from 'src/common/cache/cache.service';
// Import BaseQueryDto cho pagination
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
// Import các DTO để validate và type-check dữ liệu
import { CreateClanDto, UpdateClanRankDto } from '../dto/clan.dto';
// Import utility để build paginated response
import { buildPaginatedResponse } from '../../../common/utils/pagination.util';

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * ClanService - Service xử lý business logic cho clans (bang hội)
 *
 * Chức năng chính:
 * - Lấy danh sách tất cả clans với pagination (cached 5 phút)
 * - Lấy danh sách clans mà user đã join (cached 5 phút)
 * - Tạo clan mới (user tự động trở thành Leader)
 * - Join clan (rank mặc định: Member)
 * - Leave clan
 * - Update clan role/rank (Leader, Admin, Member, etc.)
 * - Lấy thông tin clan của user (cached 5 phút)
 *
 * Lưu ý:
 * - User có thể join nhiều clans
 * - Mỗi clan có nhiều ranks (Leader, Admin, Member, etc.)
 * - Khi tạo clan, user tự động trở thành Leader
 * - Cache được invalidate khi có thay đổi (create, join, leave, update rank)
 */
@Injectable()
export class ClanService {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject PrismaService và CacheService
   */
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  /**
   * Lấy danh sách tất cả clans với pagination (cached 5 phút)
   * @param query - Query parameters cho pagination (page, limit)
   * @returns Paginated list of all clans
   */
  async getAllClans(query?: BaseQueryDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const cacheKey = `clans:all:page:${page}:limit:${take}`;
    const cacheTtl = 300; // 5 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Query clans và count total
        const [clans, total] = await Promise.all([
          this.prisma.resClan.findMany({
            select: {
              id: true,
              name: true,
            },
            take,
            skip,
            orderBy: { name: 'asc' }, // Sắp xếp theo tên A-Z
          }),
          this.prisma.resClan.count(),
        ]);

        return buildPaginatedResponse(clans, total, page, take);
      },
      cacheTtl,
    );
  }

  /**
   * Lấy danh sách clans mà user đã join (cached 5 phút)
   * @param userId - ID của user
   * @param query - Query parameters cho pagination
   * @returns Paginated list of user's clans với rank info
   */
  async getClans(userId: string, query: BaseQueryDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const cacheKey = `user:${userId}:clans:page:${page}:limit:${take}`;
    const cacheTtl = 300; // 5 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Query user's clan memberships
        const [userClans, total] = await Promise.all([
          this.prisma.resUserClan.findMany({
            where: { user_id: userId },
            include: { clan: true }, // Include clan info
            take,
            skip,
            orderBy: { id: 'desc' }, // Sắp xếp theo ID giảm dần (join mới nhất trước)
          }),
          this.prisma.resUserClan.count({ where: { user_id: userId } }),
        ]);

        return buildPaginatedResponse(userClans, total, page, take);
      },
      cacheTtl,
    );
  }

  /**
   * Tạo clan mới (user tự động trở thành Leader)
   * @param userId - ID của user tạo clan
   * @param dto - DTO chứa thông tin clan (name)
   * @returns Clan đã tạo
   * 
   * Lưu ý: User tự động được thêm vào clan với rank = Leader
   */
  async createClan(userId: string, dto: CreateClanDto) {
    // Tạo clan mới
    const clan = await this.prisma.resClan.create({
      data: { name: dto.name },
    });
    
    // Thêm user vào clan với rank = Leader
    await this.prisma.resUserClan.create({
      data: { user_id: userId, clan_id: clan.id, rank: 'Leader' },
    });

    // Invalidate cache
    await this.cacheService.delPattern(`clans:all:*`); // Xóa cache danh sách clans
    await this.cacheService.delPattern(`user:${userId}:clans:*`); // Xóa cache clans của user
    await this.cacheService.del(`user:${userId}:clan:info`); // Xóa cache clan info

    return clan;
  }

  /**
   * Join clan (rank mặc định: Member)
   * @param userId - ID của user
   * @param clanId - ID của clan muốn join
   * @returns Membership record
   */
  async joinClan(userId: string, clanId: string) {
    // Tạo membership mới với rank = Member
    const membership = await this.prisma.resUserClan.create({
      data: { user_id: userId, clan_id: clanId, rank: 'Member' },
    });

    // Invalidate cache
    await this.cacheService.delPattern(`user:${userId}:clans:*`);
    await this.cacheService.del(`user:${userId}:clan:info`);

    return membership;
  }

  /**
   * Leave clan (xóa membership)
   * @param userId - ID của user
   * @param clanId - ID của clan muốn leave
   * @returns Message xác nhận đã leave
   */
  async leaveClan(userId: string, clanId: string) {
    // Xóa membership (deleteMany vì có thể có nhiều records)
    await this.prisma.resUserClan.deleteMany({ where: { user_id: userId, clan_id: clanId } });

    // Invalidate cache
    await this.cacheService.delPattern(`user:${userId}:clans:*`);
    await this.cacheService.del(`user:${userId}:clan:info`);

    return { message: 'Left clan' };
  }

  /**
   * Update clan role/rank
   * @param userId - ID của user cần update rank
   * @param clanId - ID của clan
   * @param dto - DTO chứa rank mới (Leader, Admin, Member, etc.)
   * @returns Membership đã update
   * @throws NotFoundException nếu membership không tồn tại
   */
  async updateClanRole(userId: string, clanId: string, dto: UpdateClanRankDto) {
    try {
      // Nếu không có rank trong dto, giữ nguyên rank hiện tại
      if (dto.rank === undefined) {
        const existing = await this.prisma.resUserClan.findFirst({
          where: { user_id: userId, clan_id: clanId },
          select: { id: true, rank: true },
        });
        if (!existing) throw new NotFoundException('Membership not found');
        
        // Update với rank hiện tại (không thay đổi)
        return this.prisma.resUserClan.update({
          where: { id: existing.id },
          data: { rank: existing.rank },
        });
      }
      
      // Tìm membership và update rank
      const existing = await this.prisma.resUserClan.findFirst({
        where: { user_id: userId, clan_id: clanId },
        select: { id: true },
      });
      
      if (!existing) throw new NotFoundException('Membership not found');
      
      // Update rank mới
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

  /**
   * Lấy thông tin clan của user (cached 5 phút)
   * @param userId - ID của user
   * @returns Clan info với rank của user
   * 
   * Lưu ý: Chỉ trả về clan đầu tiên nếu user join nhiều clans
   */
  async getClanInfo(userId: string) {
    const cacheKey = `user:${userId}:clan:info`;
    const cacheTtl = 300; // 5 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Lấy clan đầu tiên của user
        return this.prisma.resUserClan.findFirst({
          where: { user_id: userId },
          include: { clan: true }, // Include clan info
        });
      },
      cacheTtl,
    );
  }
}
