import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { CreateWalletDto, UpdateWalletDto } from '../dto/wallet.dto';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getWallet(userId: string, query: BaseQueryDto) {
    // Lấy tất cả wallets của user
    const wallets = await this.prisma.resWallet.findMany({
      where: { user_id: userId },
    });

    // Nếu user chưa có wallet nào, tạo wallet mặc định (gem)
    if (wallets.length === 0) {
      return await this.prisma.resWallet.create({
        data: {
          user_id: userId,
          currency: 'gem',
          balance: new Prisma.Decimal(0),
        },
      });
    }

    // Trả về wallet đầu tiên (hoặc có thể trả về tất cả wallets)
    return wallets[0];
  }

  async createWallet(userId: string, dto: CreateWalletDto) {
    const currency = dto.currency || 'gem';

    // Kiểm tra wallet với currency đã tồn tại chưa
    const exist = await this.prisma.resWallet.findUnique({
      where: {
        user_id_currency: {
          user_id: userId,
          currency: currency,
        },
      },
    });

    if (exist) {
      // Nếu đã tồn tại, update với dữ liệu mới từ DTO (upsert behavior)
      return this.prisma.resWallet.update({
        where: {
          user_id_currency: {
            user_id: userId,
            currency: currency,
          },
        },
        data: {
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
        currency: currency,
        balance:
          dto.balance !== undefined && dto.balance !== null
            ? new Prisma.Decimal(dto.balance)
            : new Prisma.Decimal(0),
      },
    });
  }

  async updateWallet(userId: string, dto: UpdateWalletDto) {
    // Cần currency để xác định wallet cần update
    if (!dto.currency) {
      throw new NotFoundException('Currency is required to update wallet');
    }

    // Tìm wallet với currency
    const existing = await this.prisma.resWallet.findUnique({
      where: {
        user_id_currency: {
          user_id: userId,
          currency: dto.currency,
        },
      },
    });

    // Nếu wallet chưa tồn tại, tạo mới (upsert behavior)
    if (!existing) {
      return await this.prisma.resWallet.create({
        data: {
          user_id: userId,
          currency: dto.currency,
          balance:
            dto.balance !== undefined ? new Prisma.Decimal(dto.balance) : new Prisma.Decimal(0),
        },
      });
    }

    // Update wallet nếu đã tồn tại
    try {
      return await this.prisma.resWallet.update({
        where: {
          user_id_currency: {
            user_id: userId,
            currency: dto.currency,
          },
        },
        data: {
          balance: dto.balance !== undefined ? new Prisma.Decimal(dto.balance) : existing.balance,
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Wallet not found');
      }
      throw error;
    }
  }

  async deleteWallet(userId: string) {
    await this.prisma.resWallet.deleteMany({ where: { user_id: userId } });
    return { message: 'Wallet deleted' };
  }
}
