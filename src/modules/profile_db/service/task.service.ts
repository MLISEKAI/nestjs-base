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
    return this.prisma.resTask.create({ data: { user_id: userId, title: dto.title, is_done: dto.is_done ?? false } });
  }

  async updateTask(userId: string, taskId: string, dto: UpdateTaskDto) {
    const existing = await this.prisma.resTask.findFirst({ where: { id: taskId, user_id: userId } });
    if (!existing) throw new NotFoundException('Task not found');
    return this.prisma.resTask.update({ where: { id: taskId }, data: { is_done: dto.is_done ?? existing.is_done } });
  }

  async deleteTask(userId: string, taskId: string) {
    const existing = await this.prisma.resTask.findFirst({ where: { id: taskId, user_id: userId } });
    if (!existing) throw new NotFoundException('Task not found');
    await this.prisma.resTask.delete({ where: { id: taskId } });
    return { message: 'Task deleted' };
  }
}