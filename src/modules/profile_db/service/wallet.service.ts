import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { BaseQueryDto } from '../dto/base-query.dto';
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
    const exist = await this.prisma.resWallet.findUnique({ where: { user_id: userId } });
    if (exist) return exist;
    return this.prisma.resWallet.create({
      data: {
        user_id: userId,
        currency: dto.currency ?? 'gem',
        balance:
          dto.balance !== undefined ? new Prisma.Decimal(dto.balance) : new Prisma.Decimal(0),
      },
    });
  }

  async updateWallet(userId: string, dto: UpdateWalletDto) {
    const existing = await this.prisma.resWallet.findUnique({ where: { user_id: userId } });
    if (!existing) throw new NotFoundException('Wallet not found');
    const updated = await this.prisma.resWallet.update({
      where: { user_id: userId },
      data: {
        balance:
          dto.balance !== undefined
            ? new Prisma.Decimal(dto.balance)
            : existing.balance,
        currency: dto.currency ?? existing.currency,
      },
    });
    return updated;
  }

  async deleteWallet(userId: string) {
    await this.prisma.resWallet.deleteMany({ where: { user_id: userId } });
    return { message: 'Wallet deleted' };
  }
}