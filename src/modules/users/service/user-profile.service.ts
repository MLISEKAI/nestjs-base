// Import Injectable và exceptions từ NestJS
import { Injectable, NotFoundException } from '@nestjs/common';
// Import PrismaService để query database
import { PrismaService } from 'src/prisma/prisma.service';
// Import CacheService để cache data
import { CacheService } from 'src/common/cache/cache.service';
// Import DTO để validate và type-check dữ liệu
import { UpdateUserDto } from '../dto/user-response';
// Import utility function để build paginated response
import { buildPaginatedResponse } from '../../../common/utils/pagination.util';
// Import interfaces để type-check
import { SearchUsersParams } from '../interfaces';
// Import Prisma types để type-check
import { Prisma } from '@prisma/client';

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * UserProfileService - Service xử lý business logic cho user profile
 *
 * Chức năng chính:
 * - Tìm kiếm users (search by nickname hoặc ID)
 * - Lấy thông tin user profile
 * - Update user profile
 * - Upload avatar
 * - Cache user profile để tối ưu performance
 *
 * Lưu ý:
 * - User profile được cache 30 phút
 * - Không include albums trong findUser để tránh load quá nhiều data
 * - Albums có endpoint riêng với pagination
 */
@Injectable()
export class UserProfileService {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject PrismaService và CacheService khi tạo instance của service
   */
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async findUser(id: string, includeAssociates = false) {
    // Tối ưu: Không include albums vì:
    // 1. Đã có endpoint riêng GET /profile/:user_id/albums với pagination
    // 2. Include albums + photos có thể load rất nhiều data (N albums × M photos)
    // 3. Public profile chỉ cần thông tin cơ bản của user
    // Nếu cần albums, client nên gọi endpoint riêng với pagination
    return this.prisma.resUser.findUnique({
      where: { id },
      include: {
        ...(includeAssociates && {
          associates: {
            select: {
              id: true,
              provider: true,
              email: true,
              phone_number: true,
              email_verified: true,
              phone_verified: true,
            },
          },
        }),
      },
    });
  }

  async findOne(id: string) {
    const cacheKey = `user:${id}:detail`;
    const cacheTtl = 1800; // 30 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const user = await this.findUser(id);
        if (!user) return { message: 'User not found' };
        return user;
      },
      cacheTtl,
    );
  }

  async updateProfile(id: string, dto: UpdateUserDto) {
    const existingUser = await this.prisma.resUser.findUnique({ where: { id } });
    if (!existingUser) throw new NotFoundException('User not found');

    const user = await this.prisma.resUser.update({
      where: { id },
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
      },
    });

    // Invalidate cache khi update profile
    await this.cacheService.del(`user:${id}:detail`);
    await this.cacheService.delPattern(`profile:${id}:*`);
    await this.cacheService.delPattern(`users:search:*`); // Invalidate tất cả search results

    return { message: 'Profile updated successfully', user };
  }

  async searchUsers(params: SearchUsersParams) {
    // Xử lý search: trim và kiểm tra empty string
    const search = params?.search?.trim();
    const where: Prisma.ResUserWhereInput =
      search && search.length > 0
        ? {
            OR: [
              { nickname: { contains: search, mode: 'insensitive' as const } },
              { id: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {};

    // Loại bỏ user hiện tại khỏi kết quả nếu có authenticated
    if (params?.excludeUserId) {
      where.NOT = { id: params.excludeUserId };
    }

    let orderBy: Record<string, 'asc' | 'desc'> = { created_at: 'asc' };
    if (params?.sort) {
      const [field, dir] = String(params.sort).split(':');
      if (field) orderBy = { [field]: dir?.toLowerCase() === 'desc' ? 'desc' : 'asc' };
    }

    const take = params?.limit && params.limit > 0 ? params.limit : 20;
    const page = params?.page && params.page > 0 ? params.page : 1;
    const skip = (page - 1) * take;

    // Cache key với search term, page, limit, sort, và excludeUserId (để cache riêng cho authenticated/unauthenticated)
    const searchKey = search || 'all';
    const sortKey = params?.sort || 'created_at:asc';
    const excludeKey = params?.excludeUserId ? `:exclude:${params.excludeUserId}` : '';
    const cacheKey = `users:search:${searchKey}:page:${page}:limit:${take}:sort:${sortKey}${excludeKey}`;
    const cacheTtl = 300; // 5 phút (search results thay đổi thường xuyên)

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Tối ưu: Chỉ select các fields cần thiết thay vì select tất cả
        const [users, total] = await Promise.all([
          this.prisma.resUser.findMany({
            where,
            orderBy,
            take,
            skip,
            select: {
              id: true,
              nickname: true,
              avatar: true,
              bio: true,
              created_at: true,
              updated_at: true,
            },
          }),
          this.prisma.resUser.count({ where }),
        ]);

        // Return in standard pagination format
        return buildPaginatedResponse(users, total, page, take);
      },
      cacheTtl,
    );
  }

  async uploadAvatar(user_id: string, fileUrl: string) {
    const user = await this.prisma.resUser.update({
      where: { id: user_id },
      data: { avatar: fileUrl },
    });

    // Invalidate cache khi upload avatar
    await this.cacheService.del(`user:${user_id}:detail`);
    await this.cacheService.delPattern(`profile:${user_id}:*`);
    await this.cacheService.delPattern(`users:search:*`); // Invalidate search results

    return { message: 'Avatar updated', avatar: user.avatar };
  }
}
