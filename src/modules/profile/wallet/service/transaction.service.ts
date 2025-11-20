import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';
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

    // Lấy thông tin chi tiết cho gift transactions
    const giftReferenceIds = transactions
      .filter((tx) => tx.type === 'gift' && tx.reference_id)
      .map((tx) => tx.reference_id);

    const gifts =
      giftReferenceIds.length > 0
        ? await this.prisma.resGift.findMany({
            where: { id: { in: giftReferenceIds } },
            include: {
              sender: { select: { id: true, nickname: true } },
              receiver: { select: { id: true, nickname: true } },
              giftItem: { select: { id: true, name: true } },
            },
          })
        : [];

    const giftMap = new Map(gifts.map((g) => [g.id, g]));

    const data: TransactionHistoryItemDto[] = await Promise.all(
      transactions.map(async (tx) => {
        const baseData: TransactionHistoryItemDto = {
          id: tx.id,
          type: tx.type,
          amount: Number(tx.amount),
          date: tx.created_at.toISOString(),
          status: tx.status,
          description: this.buildDescription(tx),
        };

        // Thêm thông tin chi tiết cho gift
        if (tx.type === 'gift' && tx.reference_id) {
          const gift = giftMap.get(tx.reference_id);
          if (gift) {
            baseData.sender_name = gift.sender?.nickname;
            baseData.receiver_name = gift.receiver?.nickname;
            baseData.gift_name = gift.giftItem
              ? `${gift.giftItem.name} x${gift.quantity}`
              : undefined;
            // Nếu có live stream info (có thể thêm field vào ResGift sau)
            if (gift.message?.includes('Live:')) {
              baseData.live_stream_info = gift.message;
            }
          }
        }

        // Thêm thông tin cho transfer
        if (tx.type === 'transfer' && tx.reference_id) {
          // Tìm transaction tương ứng của receiver
          const relatedTx = await this.prisma.resWalletTransaction.findFirst({
            where: {
              reference_id: tx.reference_id,
              user_id: { not: userId },
            },
            include: {
              user: { select: { nickname: true } },
            },
          });

          if (relatedTx && relatedTx.user) {
            if (Number(tx.amount) > 0) {
              // Incoming transfer
              baseData.sender_name = relatedTx.user.nickname;
            } else {
              // Outgoing transfer
              baseData.receiver_name = relatedTx.user.nickname;
            }
          }
        }

        return baseData;
      }),
    );

    return buildPaginatedResponse(data, total, page, take);
  }

  /**
   * Build description for transaction
   */
  private buildDescription(tx: any): string {
    switch (tx.type) {
      case 'deposit':
        return 'Deposit diamonds from the app';
      case 'withdraw':
        return `Withdraw VEX - ${tx.reference_id || ''}`;
      case 'gift':
        return `Gift sent: ${tx.reference_id || ''}`;
      case 'convert':
        return `Exchange ${Math.abs(Number(tx.amount))} VEX for ${Math.abs(Number(tx.amount))} Diamonds`;
      case 'transfer':
        return Number(tx.amount) > 0 ? 'Received VEX transfer' : 'Sent VEX transfer';
      case 'subscription':
        return 'Monthly card subscription';
      default:
        return `${tx.type} - ${tx.reference_id || ''}`;
    }
  }
}
