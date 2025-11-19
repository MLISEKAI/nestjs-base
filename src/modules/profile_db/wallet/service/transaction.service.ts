import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseQueryDto } from '../../dto/base-query.dto';
import { TransactionHistoryItemDto } from '../dto/diamond-wallet.dto';
import { buildPaginatedResponse } from '../../../../common/utils/pagination.util';
import { IPaginatedResponse } from '../../../../common/interfaces/pagination.interface';

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get transaction history with pagination
   */
  async getTransactionHistory(
    userId: string,
    query?: BaseQueryDto,
  ): Promise<IPaginatedResponse<TransactionHistoryItemDto>> {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    // Lấy tất cả wallets của user
    const wallets = await this.prisma.resWallet.findMany({
      where: { user_id: userId },
      select: { id: true },
    });

    const walletIds = wallets.map((w) => w.id);

    const [transactions, total] = await Promise.all([
      this.prisma.resWalletTransaction.findMany({
        where: { user_id: userId, wallet_id: { in: walletIds } },
        take,
        skip,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.resWalletTransaction.count({
        where: { user_id: userId, wallet_id: { in: walletIds } },
      }),
    ]);

    const data: TransactionHistoryItemDto[] = transactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      amount: Number(tx.amount),
      date: tx.created_at.toISOString(),
      status: tx.status,
      description: `${tx.type} - ${tx.reference_id || ''}`,
    }));

    return buildPaginatedResponse(data, total, page, take);
  }
}
