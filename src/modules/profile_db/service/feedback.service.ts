import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FeedbackDto } from '../dto/feedback.dto';

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

  async getFeedback(userId: string) {
    return this.prisma.resFeedback.findMany({ where: { user_id: userId } });
  }

  async updateFeedback(feedbackId: string, dto: FeedbackDto) {
    const existing = await this.prisma.resFeedback.findUnique({ where: { id: feedbackId } });
    if (!existing) throw new NotFoundException('Feedback not found');
    return this.prisma.resFeedback.update({
      where: { id: feedbackId },
      data: { content: dto.message },
    });
  }

  async deleteFeedback(feedbackId: string) {
    await this.prisma.resFeedback.delete({ where: { id: feedbackId } });
    return { message: 'Feedback deleted' };
  }
}
