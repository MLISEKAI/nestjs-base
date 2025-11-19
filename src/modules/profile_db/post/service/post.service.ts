import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PostDto, CreatePostDto, UpdatePostDto } from '../dto/posts.dto';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';
import { buildPaginatedResponse } from '../../../../common/utils/pagination.util';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  async getPosts(userId: string, query?: BaseQueryDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const [posts, total] = await Promise.all([
      this.prisma.resPost.findMany({
        where: { user_id: userId },
        take,
        skip,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.resPost.count({ where: { user_id: userId } }),
    ]);

    return buildPaginatedResponse(posts, total, page, take);
  }

  async createPost(userId: string, dto: CreatePostDto) {
    return this.prisma.resPost.create({ data: { user_id: userId, content: dto.content } });
  }

  async updatePost(userId: string, postId: string, dto: UpdatePostDto) {
    try {
      if (dto.content === undefined) {
        // Nếu không có content, cần lấy giá trị hiện tại
        const existing = await this.prisma.resPost.findFirst({
          where: { id: postId, user_id: userId },
          select: { content: true },
        });
        if (!existing) throw new NotFoundException('Post not found');
        return this.prisma.resPost.update({
          where: { id: postId },
          data: { content: existing.content },
        });
      }
      return await this.prisma.resPost.update({
        where: { id: postId, user_id: userId },
        data: { content: dto.content },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Post not found');
      }
      throw error;
    }
  }

  async deletePost(userId: string, postId: string) {
    try {
      await this.prisma.resPost.delete({
        where: { id: postId, user_id: userId },
      });
      return { message: 'Post deleted' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Post not found');
      }
      throw error;
    }
  }
}
