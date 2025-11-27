// Import Injectable và exceptions từ NestJS
import { Injectable, NotFoundException } from '@nestjs/common';
// Import PrismaService để query database
import { PrismaService } from 'src/prisma/prisma.service';
// Import CacheService để cache data
import { CacheService } from 'src/common/cache/cache.service';
// Import các DTO để validate và type-check dữ liệu
import { CreatePostMediaDto, UpdatePostMediaDto } from '../dto/posts.dto';

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * PostMediaService - Service xử lý business logic cho post media (ảnh/video/audio attachments)
 *
 * Chức năng chính:
 * - Lấy danh sách media của post (cached 5 phút)
 * - Thêm media mới vào post
 * - Cập nhật thông tin media (URL, order)
 * - Xóa media khỏi post
 *
 * Lưu ý:
 * - Media được sắp xếp theo order (ascending)
 * - Khi thêm media mới, order tự động tăng (max + 1)
 * - Cache được invalidate khi có thay đổi (add, update, delete)
 * - Media types: image, video, audio, file
 */
@Injectable()
export class PostMediaService {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject PrismaService và CacheService
   */
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  /**
   * Lấy danh sách media của post (cached 5 phút)
   * @param postId - ID của post
   * @returns Danh sách media được sắp xếp theo order
   * @throws NotFoundException nếu post không tồn tại
   */
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

        // Lấy danh sách media của post
        const media = await this.prisma.resPostMedia.findMany({
          where: { post_id: postId },
          orderBy: { order: 'asc' }, // Sắp xếp theo order (thứ tự hiển thị)
        });

        return media;
      },
      cacheTtl,
    );
  }

  /**
   * Thêm media mới vào post
   * @param postId - ID của post
   * @param dto - DTO chứa thông tin media (media_url, media_type, order)
   * @returns Media đã tạo
   * @throws NotFoundException nếu post không tồn tại
   * 
   * Lưu ý: Nếu không chỉ định order, sẽ tự động lấy max order + 1
   */
  async addPostMedia(postId: string, dto: CreatePostMediaDto) {
    // Check if post exists
    const post = await this.prisma.resPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Get max order để tính order cho media mới
    const maxOrder = await this.prisma.resPostMedia.findFirst({
      where: { post_id: postId },
      orderBy: { order: 'desc' }, // Lấy media có order lớn nhất
      select: { order: true },
    });

    // Nếu dto có order thì dùng, không thì tự động tăng
    const order = dto.order !== undefined ? dto.order : (maxOrder?.order || 0) + 1;

    // Tạo media mới
    const media = await this.prisma.resPostMedia.create({
      data: {
        post_id: postId,
        media_url: dto.media_url, // URL của media (đã upload lên cloud)
        media_type: dto.media_type, // Loại media: image, video, audio, file
        order, // Thứ tự hiển thị
      },
    });

    // Invalidate cache
    await this.cacheService.del(`post:${postId}:media`);

    return media;
  }

  /**
   * Cập nhật thông tin media
   * @param mediaId - ID của media cần update
   * @param dto - DTO chứa thông tin mới (media_url, order)
   * @returns Media đã update
   * @throws NotFoundException nếu media không tồn tại
   */
  async updatePostMedia(mediaId: string, dto: UpdatePostMediaDto) {
    try {
      // Update media (chỉ update các fields được gửi lên)
      const media = await this.prisma.resPostMedia.update({
        where: { id: mediaId },
        data: {
          ...(dto.media_url && { media_url: dto.media_url }), // Update URL nếu có
          ...(dto.order !== undefined && { order: dto.order }), // Update order nếu có
        },
      });

      // Invalidate cache
      await this.cacheService.del(`post:${media.post_id}:media`);

      return media;
    } catch (error) {
      // Prisma error code P2025 = Record not found
      if (error.code === 'P2025') {
        throw new NotFoundException('Media not found');
      }
      throw error;
    }
  }

  /**
   * Xóa media khỏi post
   * @param mediaId - ID của media cần xóa
   * @returns Message xác nhận đã xóa
   * @throws NotFoundException nếu media không tồn tại
   */
  async deletePostMedia(mediaId: string) {
    try {
      // Get post_id trước khi xóa để invalidate cache
      const media = await this.prisma.resPostMedia.findUnique({
        where: { id: mediaId },
        select: { post_id: true },
      });

      // Xóa media khỏi database
      await this.prisma.resPostMedia.delete({
        where: { id: mediaId },
      });

      // Invalidate cache
      if (media) {
        await this.cacheService.del(`post:${media.post_id}:media`);
      }

      return { message: 'Media deleted' };
    } catch (error) {
      // Prisma error code P2025 = Record not found
      if (error.code === 'P2025') {
        throw new NotFoundException('Media not found');
      }
      throw error;
    }
  }
}
