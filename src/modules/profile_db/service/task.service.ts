import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseQueryDto } from '../dto/base-query.dto';
import { CreateTaskDto, UpdateTaskDto } from '../dto/task-summary.dto';

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  async getTaskSummary(userId: string, query?: BaseQueryDto) {
    return this.prisma.resTask.findMany({ where: { user_id: userId } });
  }

  async createTask(userId: string, dto: CreateTaskDto) {
    return this.prisma.resTask.create({
      data: { user_id: userId, title: dto.title, is_done: dto.is_done ?? false },
    });
  }

  async updateTask(userId: string, taskId: string, dto: UpdateTaskDto) {
    // Tối ưu: Dùng update trực tiếp với where condition, không cần query trước
    try {
      // Nếu không có is_done trong dto, cần lấy giá trị hiện tại
      if (dto.is_done === undefined) {
        const existing = await this.prisma.resTask.findFirst({
          where: { id: taskId, user_id: userId },
          select: { is_done: true },
        });
        if (!existing) throw new NotFoundException('Task not found');
        return this.prisma.resTask.update({
          where: { id: taskId },
          data: { is_done: existing.is_done },
        });
      }

      return await this.prisma.resTask.update({
        where: { id: taskId, user_id: userId },
        data: { is_done: dto.is_done },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Task not found');
      }
      throw error;
    }
  }

  async deleteTask(userId: string, taskId: string) {
    // Tối ưu: Dùng delete trực tiếp với where condition
    try {
      await this.prisma.resTask.delete({
        where: { id: taskId, user_id: userId },
      });
      return { message: 'Task deleted' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Task not found');
      }
      throw error;
    }
  }
}
