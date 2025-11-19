import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FeedbackDto } from '../dto/feedback.dto';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';
import { buildPaginatedResponse } from '../../../../common/utils/pagination.util';

@Injectable()
export class FeedbackService {
  constructor(private prisma: PrismaService) {}

  async postFeedback(dto: FeedbackDto) {
    const { userId, message } = dto;
    return this.prisma.resFeedback.create({
      data: {
        content: message,
        user_id: userId || undefined,
      },
    });
  }

  async getFeedback(userId: string, query?: BaseQueryDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const [feedbacks, total] = await Promise.all([
      this.prisma.resFeedback.findMany({
        where: { user_id: userId },
        take,
        skip,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.resFeedback.count({ where: { user_id: userId } }),
    ]);

    return buildPaginatedResponse(feedbacks, total, page, take);
  }

  async updateFeedback(feedbackId: string, dto: FeedbackDto) {
    try {
      return await this.prisma.resFeedback.update({
        where: { id: feedbackId },
        data: { content: dto.message },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Feedback not found');
      }
      throw error;
    }
  }

  async deleteFeedback(feedbackId: string) {
    try {
      await this.prisma.resFeedback.delete({ where: { id: feedbackId } });
      return { message: 'Feedback deleted' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Feedback not found');
      }
      throw error;
    }
  }
}
