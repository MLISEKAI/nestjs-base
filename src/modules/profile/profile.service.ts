// Import Injectable từ NestJS
import { Injectable } from '@nestjs/common';
// Import PrismaService để query database
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * ProfileServiceDb - Service xử lý business logic cho profile operations
 *
 * Chức năng chính:
 * - Scan quest QR code
 * - Lấy user location
 * - Lấy user contribution
 * - Lấy user interests
 *
 * Lưu ý:
 * - Service này xử lý các profile features như quest, location, contribution, interests
 */
@Injectable()
export class ProfileServiceDb {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject PrismaService khi tạo instance của service
   */
  constructor(private prisma: PrismaService) {}

  async postQuestScan(user_id: string, dto: { qrCode: string }) {
    return { message: `Quest scanned successfully: ${dto.qrCode}` };
  }

  async getUserLocation(user_id: string) {
    return this.prisma.resLocation.findUnique({ where: { user_id: user_id } });
  }

  async getUserContribution(user_id: string) {
    return this.prisma.resContribution.findUnique({ where: { user_id: user_id } });
  }

  async getUserInterests(user_id: string) {
    return this.prisma.resInterest.findMany({ where: { user_id: user_id } });
  }
}
