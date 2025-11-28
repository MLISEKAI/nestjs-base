import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';
import { CreateLoveSpaceDto, UpdateLoveSpaceDto } from '../dto/lovespace.dto';

@Injectable()
export class LoveSpaceService {
  constructor(private prisma: PrismaService) {}

  async getLoveSpace(user_id: string, query: BaseQueryDto) {
    const space = await this.prisma.resLoveSpace.findUnique({ where: { user_id: user_id } });
    if (!space) throw new NotFoundException('Love Space not found');
    return space;
  }

  async createLoveSpace(user_id: string, dto: CreateLoveSpaceDto) {
    return this.prisma.resLoveSpace.create({ data: { user_id: user_id, bio: dto.bio } });
  }

  async updateLoveSpace(user_id: string, dto: UpdateLoveSpaceDto) {
    try {
      if (dto.bio === undefined) {
        // Nếu không có bio, cần lấy giá trị hiện tại
        const existing = await this.prisma.resLoveSpace.findUnique({
          where: { user_id: user_id },
          select: { bio: true },
        });
        if (!existing) throw new NotFoundException('Love Space not found');
        return this.prisma.resLoveSpace.update({
          where: { user_id: user_id },
          data: { bio: existing.bio },
        });
      }
      return await this.prisma.resLoveSpace.update({
        where: { user_id: user_id },
        data: { bio: dto.bio },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Love Space not found');
      }
      throw error;
    }
  }

  async deleteLoveSpace(user_id: string) {
    await this.prisma.resLoveSpace.deleteMany({ where: { user_id: user_id } });
    return { message: 'Love Space deleted' };
  }
}
