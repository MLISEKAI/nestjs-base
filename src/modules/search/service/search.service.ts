import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/cache/cache.service';
import { buildPaginatedResponse } from '../../../common/utils/pagination.util';
import type { DateFilter } from '../../../common/interfaces/prisma.interface';
import { Prisma } from '@prisma/client';
import { SearchType } from 'src/common/enums/search';
import { SearchQueryDto } from '../dto';

@Injectable()
export class SearchService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  /**
   * Universal search - Tìm kiếm trong tất cả loại nội dung
   * Cached for 5 minutes
   */
  async search(query: SearchQueryDto, user_id?: string) {
    const { q, type = SearchType.ALL, page = 1, limit = 20, from_date, to_date } = query;
    const take = Number(limit) > 0 ? Number(limit) : 20;
    const currentPage = Number(page) > 0 ? Number(page) : 1;
    const skip = (currentPage - 1) * take;

    const dateKey = from_date && to_date ? `:${from_date}:${to_date}` : '';
    const cacheKey = `search:${type}:${q || 'all'}:page:${currentPage}:limit:${take}${dateKey}`;
    const cacheTtl = 300; // 5 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const dateFilter = this.buildDateFilter(from_date, to_date);

        // Nếu type cụ thể, chỉ search loại đó
        if (type === SearchType.USERS) {
          return this.searchUsers(q, dateFilter, skip, take, currentPage, user_id);
        }

        if (type === SearchType.POSTS) {
          return this.searchPosts(q, dateFilter, skip, take, currentPage, user_id);
        }

        if (type === SearchType.COMMENTS) {
          return this.searchComments(q, dateFilter, skip, take, currentPage, user_id);
        }

        // type === ALL hoặc undefined: Search tất cả loại nội dung
        // Mỗi loại lấy một số lượng kết quả (limit/3 để tổng không vượt quá limit)
        const itemsPerType = Math.ceil(take / 3);

        // Search all types in parallel, with error handling for comments
        const [users, posts, comments] = await Promise.all([
          this.searchUsers(q, dateFilter, 0, itemsPerType, 1, user_id).catch(() =>
            buildPaginatedResponse([], 0, 1, itemsPerType),
          ),
          this.searchPosts(q, dateFilter, 0, itemsPerType, 1, user_id).catch(() =>
            buildPaginatedResponse([], 0, 1, itemsPerType),
          ),
          this.searchComments(q, dateFilter, 0, itemsPerType, 1, user_id).catch(() =>
            buildPaginatedResponse([], 0, 1, itemsPerType),
          ),
        ]);

        return {
          users: users.items,
          posts: posts.items,
          comments: comments.items,
          meta: {
            total: users.meta.total_items + posts.meta.total_items + comments.meta.total_items,
            page: currentPage,
            limit: take,
            total_pages: Math.ceil(
              (users.meta.total_items + posts.meta.total_items + comments.meta.total_items) / take,
            ),
          },
        };
      },
      cacheTtl,
    );
  }

  /**
   * Search users với PostgreSQL full-text search
   */
  private async searchUsers(
    q: string,
    dateFilter: DateFilter | undefined,
    skip: number,
    take: number,
    page: number,
    user_id?: string,
  ) {
    // Sử dụng Prisma contains cho basic search
    // TODO: Upgrade lên PostgreSQL full-text search hoặc Elasticsearch
    const where = {
      OR: [
        { nickname: { contains: q, mode: 'insensitive' as const } },
        { id: { contains: q, mode: 'insensitive' as const } },
      ],
      ...(dateFilter ? { created_at: dateFilter } : {}),
    };

    const [users, total] = await Promise.all([
      this.prisma.resUser.findMany({
        where,
        take,
        skip,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          nickname: true,
          avatar: true,
          bio: true,
          created_at: true,
        },
      }),
      this.prisma.resUser.count({ where }),
    ]);

    return buildPaginatedResponse(users, total, page, take);
  }

  /**
   * Search posts với full-text search
   */
  private async searchPosts(
    q: string,
    dateFilter: DateFilter | undefined,
    skip: number,
    take: number,
    page: number,
    user_id?: string,
  ) {
    const where = {
      content: { contains: q, mode: 'insensitive' as const },
      ...(dateFilter ? { created_at: dateFilter } : {}),
    };

    const [posts, total] = await Promise.all([
      this.prisma.resPost.findMany({
        where,
        take,
        skip,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      }),
      this.prisma.resPost.count({ where }),
    ]);

    return buildPaginatedResponse(posts, total, page, take);
  }

  /**
   * Search comments
   * Returns empty result if table doesn't exist (graceful degradation)
   */
  private async searchComments(
    q: string,
    dateFilter: DateFilter | undefined,
    skip: number,
    take: number,
    page: number,
    user_id?: string,
  ) {
    try {
      const where = {
        content: { contains: q, mode: 'insensitive' as const },
        ...(dateFilter ? { created_at: dateFilter } : {}),
      };

      const [comments, total] = await Promise.all([
        this.prisma.resComment.findMany({
          where,
          take,
          skip,
          orderBy: { created_at: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
              },
            },
            post: {
              select: {
                id: true,
                content: true,
              },
            },
          },
        }),
        this.prisma.resComment.count({ where }),
      ]);

      return buildPaginatedResponse(comments, total, page, take);
    } catch (error: any) {
      // Graceful degradation: If comments table doesn't exist, return empty results
      if (error?.message?.includes('does not exist') || error?.code === 'P2021') {
        return buildPaginatedResponse([], 0, page, take);
      }
      throw error;
    }
  }

  /**
   * Build date filter
   */
  private buildDateFilter(from_date?: string, to_date?: string): DateFilter | undefined {
    if (!from_date && !to_date) return undefined;

    const filter: DateFilter = {};
    if (from_date) {
      filter.gte = new Date(from_date);
    }
    if (to_date) {
      filter.lte = new Date(to_date);
    }

    return filter;
  }
}
