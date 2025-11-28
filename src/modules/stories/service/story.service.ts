// Import Injectable và exceptions từ NestJS
import { Injectable, NotFoundException } from '@nestjs/common';
// Import PrismaService để query database
import { PrismaService } from 'src/prisma/prisma.service';
// Import DTO để validate và type-check dữ liệu
import { CreateStoryDto } from '../dto/story.dto';
// Import BaseQueryDto cho pagination
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
// Import utility để build paginated response
import { buildPaginatedResponse } from '../../../common/utils/pagination.util';

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * StoryService - Service xử lý business logic cho stories (trạng thái/status)
 *
 * Chức năng chính:
 * - Lấy stories của user (chỉ stories chưa hết hạn)
 * - Lấy tất cả active stories (feed)
 * - Tạo story mới (tự động expire sau 24 giờ)
 * - Xóa story
 * - Cleanup expired stories (dùng cho cron job)
 *
 * Lưu ý:
 * - Stories tự động expire sau 24 giờ
 * - Chỉ hiển thị stories chưa hết hạn (expires_at > now)
 * - Story có thể chứa text content và/hoặc media (image/video)
 * - Chỉ owner mới có thể xóa story của mình
 */
@Injectable()
export class StoryService {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject PrismaService khi tạo instance của service
   */
  constructor(private prisma: PrismaService) {}

  /**
   * Lấy stories của user (chỉ stories chưa hết hạn)
   * @param user_id - ID của user
   * @param query - Query parameters cho pagination (page, limit)
   * @returns Paginated list of active stories
   */
  async getStories(user_id: string, query?: BaseQueryDto) {
    // Parse pagination parameters với default values
    const take = query?.limit && query.limit > 0 ? query.limit : 20; // Default 20 items per page
    const page = query?.page && query.page > 0 ? query.page : 1; // Default page 1
    const skip = (page - 1) * take; // Calculate offset

    // Lấy thời gian hiện tại để filter stories chưa hết hạn
    const now = new Date();

    // Query stories và count total cùng lúc để tối ưu performance
    const [stories, total] = await Promise.all([
      // Lấy danh sách stories của user
      this.prisma.resStory.findMany({
        where: {
          user_id: user_id, // Chỉ lấy stories của user này
          expires_at: { gt: now }, // Chỉ lấy stories chưa hết hạn (greater than now)
        },
        take, // Limit số lượng
        skip, // Offset cho pagination
        orderBy: { created_at: 'desc' }, // Sắp xếp theo thời gian tạo (mới nhất trước)
        include: {
          // Include thông tin user
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
        },
      }),
      // Đếm tổng số active stories của user
      this.prisma.resStory.count({
        where: {
          user_id: user_id,
          expires_at: { gt: now },
        },
      }),
    ]);

    // Build response với pagination metadata
    return buildPaginatedResponse(stories, total, page, take);
  }

  /**
   * Lấy tất cả active stories (feed)
   * @param query - Query parameters cho pagination (page, limit)
   * @returns Paginated list of all active stories
   * 
   * TODO: Filter stories từ users mà current user đang follow
   */
  async getActiveStories(query?: BaseQueryDto) {
    // Parse pagination parameters với default values
    const take = query?.limit && query.limit > 0 ? query.limit : 20; // Default 20 items per page
    const page = query?.page && query.page > 0 ? query.page : 1; // Default page 1
    const skip = (page - 1) * take; // Calculate offset

    // Lấy thời gian hiện tại để filter stories chưa hết hạn
    const now = new Date();

    // Query stories và count total cùng lúc để tối ưu performance
    // TODO: Thêm filter để chỉ lấy stories từ users mà current user đang follow
    const [stories, total] = await Promise.all([
      // Lấy tất cả active stories
      this.prisma.resStory.findMany({
        where: {
          expires_at: { gt: now }, // Chỉ lấy stories chưa hết hạn
        },
        take, // Limit số lượng
        skip, // Offset cho pagination
        orderBy: { created_at: 'desc' }, // Sắp xếp theo thời gian tạo (mới nhất trước)
        include: {
          // Include thông tin user
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
        },
      }),
      // Đếm tổng số active stories
      this.prisma.resStory.count({
        where: {
          expires_at: { gt: now },
        },
      }),
    ]);

    // Build response với pagination metadata
    return buildPaginatedResponse(stories, total, page, take);
  }

  /**
   * Tạo story mới (tự động expire sau 24 giờ)
   * @param user_id - ID của user tạo story
   * @param dto - DTO chứa thông tin story (content, media_url, media_type)
   * @returns Story đã tạo
   */
  async createStory(user_id: string, dto: CreateStoryDto) {
    // Tính thời gian expire (24 giờ từ bây giờ)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Thêm 24 giờ

    // Tạo story mới trong database
    const story = await this.prisma.resStory.create({
      data: {
        user_id: user_id, // ID của user tạo story
        content: dto.content, // Text content (optional)
        media_url: dto.media_url, // URL của media (image/video) (optional)
        media_type: dto.media_type, // Loại media: image hoặc video (optional)
        expires_at: expiresAt, // Thời gian expire (24 giờ sau)
      },
      include: {
        // Include thông tin user để trả về trong response
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

  /**
   * Xóa story
   * @param user_id - ID của user (để verify ownership)
   * @param storyId - ID của story cần xóa
   * @returns Message xác nhận đã xóa
   * @throws NotFoundException nếu story không tồn tại hoặc không thuộc về user
   */
  async deleteStory(user_id: string, storyId: string) {
    try {
      // Xóa story khỏi database
      await this.prisma.resStory.delete({
        where: {
          id: storyId,
          user_id: user_id, // Chỉ owner mới có thể xóa
        },
      });

      // Trả về message xác nhận
      return { message: 'Story deleted' };
    } catch (error) {
      // Prisma error code P2025 = Record not found
      if (error.code === 'P2025') {
        throw new NotFoundException('Story not found or you do not have permission to delete it');
      }
      throw error;
    }
  }

  /**
   * Cleanup expired stories (dùng cho cron job)
   * Xóa tất cả stories đã hết hạn khỏi database
   * @returns Số lượng stories đã xóa
   * 
   * Lưu ý: Method này nên được gọi bởi cron job định kỳ (ví dụ: mỗi giờ)
   */
  async cleanupExpiredStories() {
    // Lấy thời gian hiện tại
    const now = new Date();
    
    // Xóa tất cả stories đã hết hạn (expires_at <= now)
    const result = await this.prisma.resStory.deleteMany({
      where: {
        expires_at: { lte: now }, // Less than or equal to now
      },
    });

    // Trả về số lượng stories đã xóa
    return { deleted: result.count };
  }
}
