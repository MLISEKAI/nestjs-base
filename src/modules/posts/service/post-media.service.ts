import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/cache/cache.service';
import { CreatePostMediaDto, UpdatePostMediaDto } from '../dto/posts.dto';

@Injectable()
export class PostMediaService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async getPostMedia(postId: string) {
    const cacheKey = `post:${postId}:media`;
    const cacheTtl = 300; // 5 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Check if post exists
        const post = await this.prisma.resPost.findUnique({
          where: { id: postId },
        });

        if (!post) {
          throw new NotFoundException('Post not found');
        }

        const media = await this.prisma.resPostMedia.findMany({
          where: { post_id: postId },
          orderBy: { order: 'asc' },
        });

        return media;
      },
      cacheTtl,
    );
  }

  async addPostMedia(postId: string, dto: CreatePostMediaDto) {
    // Check if post exists
    const post = await this.prisma.resPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Get max order
    const maxOrder = await this.prisma.resPostMedia.findFirst({
      where: { post_id: postId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const order = dto.order !== undefined ? dto.order : (maxOrder?.order || 0) + 1;

    const media = await this.prisma.resPostMedia.create({
      data: {
        post_id: postId,
        media_url: dto.media_url,
        media_type: dto.media_type,
        order,
      },
    });

    // Invalidate cache
    await this.cacheService.del(`post:${postId}:media`);

    return media;
  }

  async updatePostMedia(mediaId: string, dto: UpdatePostMediaDto) {
    try {
      const media = await this.prisma.resPostMedia.update({
        where: { id: mediaId },
        data: {
          ...(dto.media_url && { media_url: dto.media_url }),
          ...(dto.order !== undefined && { order: dto.order }),
        },
      });

      // Invalidate cache
      await this.cacheService.del(`post:${media.post_id}:media`);

      return media;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Media not found');
      }
      throw error;
    }
  }

  async deletePostMedia(mediaId: string) {
    try {
      // Get post_id before deleting to invalidate cache
      const media = await this.prisma.resPostMedia.findUnique({
        where: { id: mediaId },
        select: { post_id: true },
      });

      await this.prisma.resPostMedia.delete({
        where: { id: mediaId },
      });

      // Invalidate cache
      if (media) {
        await this.cacheService.del(`post:${media.post_id}:media`);
      }

      return { message: 'Media deleted' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Media not found');
      }
      throw error;
    }
  }
}
