import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { BaseQueryDto } from '../../dto/base-query.dto';
import { CreateWalletDto, UpdateWalletDto } from '../dto/wallet.dto';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getWallet(userId: string, query: BaseQueryDto) {
    const wallet = await this.prisma.resWallet.findUnique({ where: { user_id: userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  async createWallet(userId: string, dto: CreateWalletDto) {
    // Kiểm tra wallet đã tồn tại chưa
    const exist = await this.prisma.resWallet.findUnique({ where: { user_id: userId } });

    if (exist) {
      // Nếu đã tồn tại, update với dữ liệu mới từ DTO (upsert behavior)
      return this.prisma.resWallet.update({
        where: { user_id: userId },
        data: {
          currency: dto.currency !== undefined ? dto.currency : exist.currency,
          balance:
            dto.balance !== undefined && dto.balance !== null
              ? new Prisma.Decimal(dto.balance)
              : exist.balance,
        },
      });
    }

    // Tạo wallet mới với dữ liệu từ DTO
    return this.prisma.resWallet.create({
      data: {
        user_id: userId,
        currency: dto.currency || 'gem', // Default 'gem' nếu không có
        balance:
          dto.balance !== undefined && dto.balance !== null
            ? new Prisma.Decimal(dto.balance)
            : new Prisma.Decimal(0),
      },
    });
  }

  async updateWallet(userId: string, dto: UpdateWalletDto) {
    // Tối ưu: Nếu có cả balance và currency, update trực tiếp
    // Nếu thiếu một trong hai, cần query để lấy giá trị hiện tại
    if (dto.balance !== undefined && dto.currency) {
      try {
        return await this.prisma.resWallet.update({
          where: { user_id: userId },
          data: {
            balance: new Prisma.Decimal(dto.balance),
            currency: dto.currency,
          },
        });
      } catch (error) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Wallet not found');
        }
        throw error;
      }
    }

    // Nếu thiếu một trong hai, query để lấy giá trị hiện tại
    const existing = await this.prisma.resWallet.findUnique({ where: { user_id: userId } });
    if (!existing) throw new NotFoundException('Wallet not found');
    return this.prisma.resWallet.update({
      where: { user_id: userId },
      data: {
        balance: dto.balance !== undefined ? new Prisma.Decimal(dto.balance) : existing.balance,
        currency: dto.currency ?? existing.currency,
      },
    });
  }

  async deleteWallet(userId: string) {
    await this.prisma.resWallet.deleteMany({ where: { user_id: userId } });
    return { message: 'Wallet deleted' };
  }
}
