import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PostDto, CreatePostDto, UpdatePostDto } from '../dto/posts.dto';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  async getPosts(userId: string, dto?: PostDto) {
    return this.prisma.resPost.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }

  async createPost(userId: string, dto: CreatePostDto) {
    return this.prisma.resPost.create({ data: { user_id: userId, content: dto.content } });
  }

  async updatePost(userId: string, postId: string, dto: UpdatePostDto) {
    const existing = await this.prisma.resPost.findFirst({
      where: { id: postId, user_id: userId },
    });
    if (!existing) throw new NotFoundException('Post not found');
    return this.prisma.resPost.update({
      where: { id: postId },
      data: { content: dto.content ?? existing.content },
    });
  }

  async deletePost(userId: string, postId: string) {
    const existing = await this.prisma.resPost.findFirst({
      where: { id: postId, user_id: userId },
    });
    if (!existing) throw new NotFoundException('Post not found');
    await this.prisma.resPost.delete({ where: { id: postId } });
    return { message: 'Post deleted' };
  }
}
