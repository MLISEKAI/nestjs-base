import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

export class CreatePostMediaDto {
  media_url: string;
  media_type: string; // image, video, audio, file
  order?: number;
}

export class UpdatePostMediaDto {
  media_url?: string;
  order?: number;
}

@Injectable()
export class PostMediaService {
  constructor(private prisma: PrismaService) {}

  async getPostMedia(postId: string) {
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
      await this.prisma.resPostMedia.delete({
        where: { id: mediaId },
      });

      return { message: 'Media deleted' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Media not found');
      }
      throw error;
    }
  }
}
