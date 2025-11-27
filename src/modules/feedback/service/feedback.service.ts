// Import Injectable và exceptions từ NestJS
import { Injectable, NotFoundException } from '@nestjs/common';
// Import PrismaService để query database
import { PrismaService } from 'src/prisma/prisma.service';
// Import DTO để validate và type-check dữ liệu
import { FeedbackDto } from '../dto/feedback.dto';
// Import BaseQueryDto cho pagination
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
// Import utility để build paginated response
import { buildPaginatedResponse } from '../../../common/utils/pagination.util';

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * FeedbackService - Service xử lý business logic cho feedback (phản hồi/góp ý)
 *
 * Chức năng chính:
 * - Gửi feedback mới (có thể anonymous hoặc có user_id)
 * - Lấy danh sách feedback của user với pagination
 * - Cập nhật nội dung feedback
 * - Xóa feedback
 *
 * Lưu ý:
 * - Feedback có thể anonymous (user_id = null)
 * - User có thể xem lại các feedback đã gửi
 * - Admin có thể xem tất cả feedbacks (TODO: implement admin endpoints)
 */
@Injectable()
export class FeedbackService {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject PrismaService khi tạo instance của service
   */
  constructor(private prisma: PrismaService) {}

  /**
   * Gửi feedback mới
   * @param dto - DTO chứa thông tin feedback (user_id, message)
   * @returns Feedback đã tạo
   * 
   * Lưu ý: user_id có thể null (anonymous feedback)
   */
  async postFeedback(dto: FeedbackDto) {
    // Destructure DTO để lấy user_id và message
    const { user_id, message } = dto;
    
    // Tạo feedback mới trong database
    return this.prisma.resFeedback.create({
      data: {
        content: message, // Nội dung feedback
        user_id: user_id || undefined, // ID của user (undefined nếu anonymous)
      },
    });
  }

  /**
   * Lấy danh sách feedback của user với pagination
   * @param userId - ID của user
   * @param query - Query parameters cho pagination (page, limit)
   * @returns Paginated list of feedbacks
   */
  async getFeedback(userId: string, query?: BaseQueryDto) {
    // Parse pagination parameters với default values
    const take = query?.limit && query.limit > 0 ? query.limit : 20; // Default 20 items per page
    const page = query?.page && query.page > 0 ? query.page : 1; // Default page 1
    const skip = (page - 1) * take; // Calculate offset

    // Query feedbacks và count total cùng lúc để tối ưu performance
    const [feedbacks, total] = await Promise.all([
      // Lấy danh sách feedbacks của user
      this.prisma.resFeedback.findMany({
        where: { user_id: userId }, // Chỉ lấy feedbacks của user này
        take, // Limit số lượng
        skip, // Offset cho pagination
        orderBy: { created_at: 'desc' }, // Sắp xếp theo thời gian tạo (mới nhất trước)
      }),
      // Đếm tổng số feedbacks của user
      this.prisma.resFeedback.count({ where: { user_id: userId } }),
    ]);

    // Build response với pagination metadata
    return buildPaginatedResponse(feedbacks, total, page, take);
  }

  /**
   * Cập nhật nội dung feedback
   * @param feedbackId - ID của feedback cần update
   * @param dto - DTO chứa nội dung mới (message)
   * @returns Feedback đã update
   * @throws NotFoundException nếu feedback không tồn tại
   */
  async updateFeedback(feedbackId: string, dto: FeedbackDto) {
    try {
      // Update nội dung feedback
      return await this.prisma.resFeedback.update({
        where: { id: feedbackId }, // Tìm feedback theo ID
        data: { content: dto.message }, // Update nội dung mới
      });
    } catch (error) {
      // Prisma error code P2025 = Record not found
      if (error.code === 'P2025') {
        throw new NotFoundException('Feedback not found');
      }
      throw error;
    }
  }

  /**
   * Xóa feedback
   * @param feedbackId - ID của feedback cần xóa
   * @returns Message xác nhận đã xóa
   * @throws NotFoundException nếu feedback không tồn tại
   */
  async deleteFeedback(feedbackId: string) {
    try {
      // Xóa feedback khỏi database
      await this.prisma.resFeedback.delete({ where: { id: feedbackId } });
      
      // Trả về message xác nhận
      return { message: 'Feedback deleted' };
    } catch (error) {
      // Prisma error code P2025 = Record not found
      if (error.code === 'P2025') {
        throw new NotFoundException('Feedback not found');
      }
      throw error;
    }
  }
}
