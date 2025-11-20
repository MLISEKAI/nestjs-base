import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStoryDto } from '../dto/story.dto';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';
import { buildPaginatedResponse } from '../../../../common/utils/pagination.util';

@Injectable()
export class StoryService {
  constructor(private prisma: PrismaService) {}

  async getStories(userId: string, query?: BaseQueryDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    // Only get non-expired stories
    const now = new Date();

    const [stories, total] = await Promise.all([
      this.prisma.resStory.findMany({
        where: {
          user_id: userId,
          expires_at: { gt: now },
        },
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
        },
      }),
      this.prisma.resStory.count({
        where: {
          user_id: userId,
          expires_at: { gt: now },
        },
      }),
    ]);

    return buildPaginatedResponse(stories, total, page, take);
  }

  async getActiveStories(query?: BaseQueryDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const now = new Date();

    // Get stories from users that current user follows
    // For now, get all active stories
    const [stories, total] = await Promise.all([
      this.prisma.resStory.findMany({
        where: {
          expires_at: { gt: now },
        },
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
        },
      }),
      this.prisma.resStory.count({
        where: {
          expires_at: { gt: now },
        },
      }),
    ]);

    return buildPaginatedResponse(stories, total, page, take);
  }

  async createStory(userId: string, dto: CreateStoryDto) {
    // Stories expire after 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const story = await this.prisma.resStory.create({
      data: {
        user_id: userId,
        content: dto.content,
        media_url: dto.media_url,
        media_type: dto.media_type,
        expires_at: expiresAt,
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    return story;
  }

  async deleteStory(userId: string, storyId: string) {
    try {
      await this.prisma.resStory.delete({
        where: {
          id: storyId,
          user_id: userId, // Only owner can delete
        },
      });

      return { message: 'Story deleted' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Story not found or you do not have permission to delete it');
      }
      throw error;
    }
  }

  async cleanupExpiredStories() {
    // This can be called by a cron job to clean up expired stories
    const now = new Date();
    const result = await this.prisma.resStory.deleteMany({
      where: {
        expires_at: { lte: now },
      },
    });

    return { deleted: result.count };
  }
}
