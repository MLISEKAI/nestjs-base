// Import Injectable và exceptions từ NestJS
import { Injectable, NotFoundException } from '@nestjs/common';
// Import PrismaService để query database
import { PrismaService } from 'src/prisma/prisma.service';
// Import BaseQueryDto cho pagination
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
// Import các DTO để validate và type-check dữ liệu
import { CreateTaskDto, UpdateTaskDto } from '../dto/task-summary.dto';
// Import utility để build paginated response
import { buildPaginatedResponse } from '../../../common/utils/pagination.util';

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * TaskService - Service xử lý business logic cho tasks (nhiệm vụ/công việc)
 *
 * Chức năng chính:
 * - Lấy danh sách tasks của user với pagination
 * - Tạo task mới
 * - Cập nhật trạng thái task (done/undone)
 * - Xóa task
 *
 * Lưu ý:
 * - Mỗi user chỉ có thể quản lý tasks của chính mình
 * - Task có 2 trạng thái: is_done (true/false)
 * - Không có cache vì tasks thay đổi thường xuyên
 */
@Injectable()
export class TaskService {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject PrismaService khi tạo instance của service
   */
  constructor(private prisma: PrismaService) {}

  /**
   * Lấy danh sách tasks của user với pagination
   * @param userId - ID của user
   * @param query - Query parameters cho pagination (page, limit)
   * @returns Paginated list of tasks
   */
  async getTaskSummary(userId: string, query?: BaseQueryDto) {
    // Parse pagination parameters với default values
    const take = query?.limit && query.limit > 0 ? query.limit : 20; // Default 20 items per page
    const page = query?.page && query.page > 0 ? query.page : 1; // Default page 1
    const skip = (page - 1) * take; // Calculate offset

    // Query tasks và count total cùng lúc để tối ưu performance
    const [tasks, total] = await Promise.all([
      // Lấy danh sách tasks của user
      this.prisma.resTask.findMany({
        where: { user_id: userId }, // Chỉ lấy tasks của user này
        take, // Limit số lượng
        skip, // Offset cho pagination
        orderBy: { id: 'desc' }, // Sắp xếp theo ID giảm dần (task mới nhất trước)
      }),
      // Đếm tổng số tasks của user
      this.prisma.resTask.count({ where: { user_id: userId } }),
    ]);

    // Build response với pagination metadata
    return buildPaginatedResponse(tasks, total, page, take);
  }

  /**
   * Tạo task mới cho user
   * @param userId - ID của user
   * @param dto - DTO chứa thông tin task (title, is_done)
   * @returns Task đã tạo
   */
  async createTask(userId: string, dto: CreateTaskDto) {
    // Tạo task mới trong database
    return this.prisma.resTask.create({
      data: {
        user_id: userId, // ID của user sở hữu task
        title: dto.title, // Tiêu đề task
        is_done: dto.is_done ?? false, // Trạng thái hoàn thành (default: false)
      },
    });
  }

  /**
   * Cập nhật trạng thái task
   * @param userId - ID của user (để verify ownership)
   * @param taskId - ID của task cần update
   * @param dto - DTO chứa trạng thái mới (is_done)
   * @returns Task đã update
   * @throws NotFoundException nếu task không tồn tại hoặc không thuộc về user
   */
  async updateTask(userId: string, taskId: string, dto: UpdateTaskDto) {
    try {
      // Nếu không có is_done trong dto, giữ nguyên giá trị hiện tại
      if (dto.is_done === undefined) {
        // Query task hiện tại để lấy giá trị is_done
        const existing = await this.prisma.resTask.findFirst({
          where: { id: taskId, user_id: userId }, // Verify ownership
          select: { is_done: true },
        });
        
        // Nếu không tìm thấy task, throw exception
        if (!existing) throw new NotFoundException('Task not found');
        
        // Update với giá trị hiện tại (không thay đổi)
        return this.prisma.resTask.update({
          where: { id: taskId },
          data: { is_done: existing.is_done },
        });
      }

      // Update trạng thái is_done
      return await this.prisma.resTask.update({
        where: { id: taskId, user_id: userId }, // Verify ownership
        data: { is_done: dto.is_done }, // Update trạng thái mới
      });
    } catch (error) {
      // Prisma error code P2025 = Record not found
      if (error.code === 'P2025') {
        throw new NotFoundException('Task not found');
      }
      throw error;
    }
  }

  /**
   * Xóa task
   * @param userId - ID của user (để verify ownership)
   * @param taskId - ID của task cần xóa
   * @returns Message xác nhận đã xóa
   * @throws NotFoundException nếu task không tồn tại hoặc không thuộc về user
   */
  async deleteTask(userId: string, taskId: string) {
    try {
      // Xóa task khỏi database
      await this.prisma.resTask.delete({
        where: { id: taskId, user_id: userId }, // Verify ownership
      });
      
      // Trả về message xác nhận
      return { message: 'Task deleted' };
    } catch (error) {
      // Prisma error code P2025 = Record not found
      if (error.code === 'P2025') {
        throw new NotFoundException('Task not found');
      }
      throw error;
    }
  }
}
