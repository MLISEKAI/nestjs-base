// Import Injectable và exceptions từ NestJS
import { Injectable, BadRequestException } from '@nestjs/common';
// Import PrismaService để query database
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * ReportService - Service xử lý business logic cho reports (báo cáo nội dung không phù hợp)
 *
 * Chức năng chính:
 * - Lấy danh sách lý do report
 * - Tạo report cho post, user, hoặc comment
 * - Validate target tồn tại trước khi tạo report
 *
 * Lưu ý:
 * - Hiện tại chỉ return success message (chưa có ResReport model trong database)
 * - TODO: Tạo ResReport model và lưu vào database
 * - Report reasons: 1=Violent/offensive, 2=Distorted/provocative, 3=Irrelevant, 4=Inappropriate
 */
@Injectable()
export class ReportService {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject PrismaService khi tạo instance của service
   */
  constructor(private prisma: PrismaService) {}

  getReasons() {
    return [
      { id: 1, label: 'Violent / offensive language' },
      { id: 2, label: 'Distorted / provocative content' },
      { id: 3, label: 'Irrelevant content' },
      { id: 4, label: 'Inappropriate content' },
    ];
  }

  async createReport(reporterId: string, dto: any) {
    // Validate reasonId
    const reasons = this.getReasons();
    const reason = reasons.find((r) => r.id === dto.reasonId);
    if (!reason) {
      throw new BadRequestException('Invalid reason ID');
    }

    // Validate target exists
    if (dto.targetType === 'post') {
      const post = await this.prisma.resPost.findUnique({
        where: { id: dto.targetId },
      });
      if (!post) {
        throw new BadRequestException('Post not found');
      }
    } else if (dto.targetType === 'user') {
      const user = await this.prisma.resUser.findUnique({
        where: { id: dto.targetId },
      });
      if (!user) {
        throw new BadRequestException('User not found');
      }
    } else if (dto.targetType === 'comment') {
      const comment = await this.prisma.resComment.findUnique({
        where: { id: dto.targetId },
      });
      if (!comment) {
        throw new BadRequestException('Comment not found');
      }
    }

    // TODO: Tạo model ResReport trong schema và lưu vào database
    // Hiện tại chỉ return success message
    // Khi có model, uncomment code below:
    /*
    const report = await this.prisma.resReport.create({
      data: {
        reporter_id: reporterId,
        target_type: dto.targetType,
        target_id: dto.targetId,
        reason_id: dto.reasonId,
        comment: dto.comment,
      },
    });
    */

    return {
      success: true,
      message:
        'Report submitted successfully. We will review and handle it according to regulations.',
    };
  }
}
