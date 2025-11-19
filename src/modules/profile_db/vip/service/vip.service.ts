import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';
import { CreateVipStatusDto, UpdateVipStatusDto } from '../dto/vip.dto';

@Injectable()
export class VipService {
  constructor(private prisma: PrismaService) {}

  async getVipStatus(userId: string, query: BaseQueryDto) {
    const vip = await this.prisma.resVipStatus.findUnique({ where: { user_id: userId } });
    if (!vip) throw new NotFoundException('VIP status not found');
    return vip;
  }

  async createVipStatus(userId: string, dto: CreateVipStatusDto) {
    return this.prisma.resVipStatus.create({
      data: { user_id: userId, is_vip: dto.is_vip, expiry: dto.expiry },
    });
  }

  async updateVipStatus(userId: string, dto: UpdateVipStatusDto) {
    // Tối ưu: Nếu có cả is_vip và expiry, update trực tiếp
    if (dto.is_vip !== undefined && dto.expiry) {
      const tmpDate = new Date(dto.expiry);
      if (isNaN(tmpDate.getTime())) throw new BadRequestException('Invalid expiry date');
      try {
        return await this.prisma.resVipStatus.update({
          where: { user_id: userId },
          data: { is_vip: dto.is_vip, expiry: tmpDate },
        });
      } catch (error) {
        if (error.code === 'P2025') {
          throw new NotFoundException('VIP status not found');
        }
        throw error;
      }
    }

    // Nếu thiếu một trong hai, query để lấy giá trị hiện tại
    const existing = await this.prisma.resVipStatus.findUnique({ where: { user_id: userId } });
    if (!existing) throw new NotFoundException('VIP status not found');

    let expiryDate = existing.expiry;
    if (dto.expiry) {
      const tmpDate = new Date(dto.expiry);
      if (isNaN(tmpDate.getTime())) throw new BadRequestException('Invalid expiry date');
      expiryDate = tmpDate;
    }

    return this.prisma.resVipStatus.update({
      where: { user_id: userId },
      data: { is_vip: dto.is_vip ?? existing.is_vip, expiry: expiryDate },
    });
  }

  async deleteVipStatus(userId: string) {
    await this.prisma.resVipStatus.deleteMany({ where: { user_id: userId } });
    return { message: 'VIP status deleted' };
  }
}
