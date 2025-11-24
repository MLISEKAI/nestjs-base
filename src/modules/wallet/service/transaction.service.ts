import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/cache/cache.service';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import {
  TransactionHistoryItemDto,
  TransactionHistoryResponseDto,
  TransactionModelDto,
  TransactionType,
  TransactionStatus,
  CurrencyType,
  TransactionItemDto,
  RelatedUserDto,
  ExchangeDetailsDto,
} from '../dto/diamond-wallet.dto';
import type {
  TransactionForDescription,
  GiftForDescription,
} from '../interfaces/transaction.interface';

@Injectable()
export class TransactionService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  /**
   * Get transaction history with pagination (Flutter compatible format)
   * Cached for 1 minute (transactions change frequently)
   */
  async getTransactionHistory(
    userId: string,
    query?: BaseQueryDto,
  ): Promise<TransactionHistoryResponseDto> {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const cacheKey = `wallet:${userId}:transactions:page:${page}:limit:${take}`;
    const cacheTtl = 60; // 1 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return this.fetchTransactionHistory(userId, take, skip, page);
      },
      cacheTtl,
    );
  }

  /**
   * Fetch transaction history from database (Flutter compatible format)
   */
  private async fetchTransactionHistory(
    userId: string,
    take: number,
    skip: number,
    page: number,
  ): Promise<TransactionHistoryResponseDto> {
    // Lấy tất cả wallets của user với currency info
    const wallets = await this.prisma.resWallet.findMany({
      where: { user_id: userId },
      select: { id: true, currency: true },
    });

    const walletIds = wallets.map((w) => w.id);
    const walletMap = new Map(wallets.map((w) => [w.id, w]));

    const [transactions, total] = await Promise.all([
      this.prisma.resWalletTransaction.findMany({
        where: { user_id: userId, wallet_id: { in: walletIds } },
        take,
        skip,
        orderBy: { created_at: 'desc' },
        include: {
          wallet: { select: { currency: true } },
        },
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
              sender: { select: { id: true, nickname: true, avatar: true } },
              receiver: { select: { id: true, nickname: true, avatar: true } },
              giftItem: { select: { id: true, name: true, image_url: true, price: true } },
            },
          })
        : [];

    const giftMap = new Map(gifts.map((g) => [g.id, g]));

    // Lấy VEX transactions cho convert để tính exchange details chính xác
    const convertReferenceIds = transactions
      .filter((tx) => tx.type === 'convert' && tx.reference_id)
      .map((tx) => tx.reference_id);

    const vexTransactions =
      convertReferenceIds.length > 0
        ? await this.prisma.resWalletTransaction.findMany({
            where: {
              user_id: userId,
              type: 'convert',
              reference_id: { in: convertReferenceIds },
              wallet: { currency: 'vex' },
            },
            select: { reference_id: true, amount: true },
          })
        : [];

    const vexAmountMap = new Map(
      vexTransactions.map((vt) => [vt.reference_id, Math.abs(Number(vt.amount))]),
    );

    // Lấy thông tin user cho transfer transactions
    const transferReferenceIds = transactions
      .filter((tx) => tx.type === 'transfer' && tx.reference_id)
      .map((tx) => tx.reference_id);

    const relatedTransactions =
      transferReferenceIds.length > 0
        ? await this.prisma.resWalletTransaction.findMany({
            where: {
              reference_id: { in: transferReferenceIds },
              user_id: { not: userId },
            },
            include: {
              user: { select: { id: true, nickname: true, avatar: true } },
            },
          })
        : [];

    const relatedTxMap = new Map(relatedTransactions.map((rtx) => [rtx.reference_id, rtx]));

    const data: TransactionModelDto[] = await Promise.all(
      transactions.map(async (tx) => {
        // Map transaction type
        let transactionType: TransactionType;
        let isGiftSent = false;

        if (tx.type === 'deposit') {
          transactionType = TransactionType.deposit;
        } else if (tx.type === 'withdraw') {
          transactionType = TransactionType.withdrawal;
        } else if (tx.type === 'convert') {
          transactionType = TransactionType.exchange;
        } else if (tx.type === 'gift') {
          // Determine if gift sent or received
          const gift = giftMap.get(tx.reference_id || '');
          if (gift) {
            isGiftSent = gift.sender_id === userId;
            transactionType = isGiftSent
              ? TransactionType.gift_sent
              : TransactionType.gift_received;
          } else {
            transactionType = TransactionType.gift_sent; // Default
          }
        } else if (tx.type === 'subscription') {
          transactionType = TransactionType.reward;
        } else if (tx.type === 'transfer') {
          // Transfer có thể là deposit (incoming) hoặc withdrawal (outgoing)
          transactionType =
            Number(tx.amount) > 0 ? TransactionType.deposit : TransactionType.withdrawal;
        } else {
          transactionType = TransactionType.deposit; // Default
        }

        // Map status
        let transactionStatus: TransactionStatus;
        switch (tx.status) {
          case 'success':
            transactionStatus = TransactionStatus.completed;
            break;
          case 'pending':
            transactionStatus = TransactionStatus.pending;
            break;
          case 'failed':
            transactionStatus = TransactionStatus.failed;
            break;
          default:
            transactionStatus = TransactionStatus.pending;
        }

        // Prepare exchange details for convert
        let exchangeDetails: { fromAmount: number; toAmount: number } | undefined;
        if (tx.type === 'convert' && tx.reference_id) {
          const vexAmount = vexAmountMap.get(tx.reference_id) || Math.abs(Number(tx.amount));
          const diamondAmount = Math.abs(Number(tx.amount));
          exchangeDetails = { fromAmount: vexAmount, toAmount: diamondAmount };
        }

        // Get gift info for description
        const gift =
          tx.type === 'gift' && tx.reference_id ? giftMap.get(tx.reference_id) : undefined;

        const transaction: TransactionModelDto = {
          id: tx.id,
          type: transactionType,
          amount: Number(tx.amount),
          balanceAfter: tx.balance_after ? Number(tx.balance_after) : undefined,
          timestamp: tx.created_at.toISOString(),
          description: this.buildDescription(tx, gift, isGiftSent, exchangeDetails),
          status: transactionStatus,
        };

        // Add item for gift transactions
        if (tx.type === 'gift' && tx.reference_id && gift && gift.giftItem) {
          transaction.item = {
            name: gift.giftItem.name,
            quantity: gift.quantity,
            icon: gift.giftItem.image_url || undefined,
            value: gift.giftItem.price ? Number(gift.giftItem.price) : undefined,
          };
        }

        // Add relatedUser for gift/transfer transactions
        if (tx.type === 'gift' && tx.reference_id && gift) {
          const relatedUser = isGiftSent ? gift.receiver : gift.sender;
          if (relatedUser) {
            transaction.relatedUser = {
              id: relatedUser.id,
              username: relatedUser.nickname || '',
              displayName: relatedUser.nickname || '',
              avatar: relatedUser.avatar || '',
              isVerified: false, // TODO: Add is_verified field to ResUser if needed
            };
          }
        } else if (tx.type === 'transfer' && tx.reference_id) {
          const relatedTx = relatedTxMap.get(tx.reference_id);
          if (relatedTx && relatedTx.user) {
            transaction.relatedUser = {
              id: relatedTx.user.id,
              username: relatedTx.user.nickname || '',
              displayName: relatedTx.user.nickname || '',
              avatar: relatedTx.user.avatar || '',
              isVerified: false,
            };
          }
        }

        // Add exchange details for convert transactions
        if (exchangeDetails) {
          const rate =
            exchangeDetails.fromAmount > 0
              ? exchangeDetails.toAmount / exchangeDetails.fromAmount
              : 1;
          transaction.exchange = {
            fromCurrency: CurrencyType.VEX,
            fromAmount: exchangeDetails.fromAmount,
            toCurrency: CurrencyType.Diamonds,
            toAmount: exchangeDetails.toAmount,
            rate: rate,
          };
        }

        return transaction;
      }),
    );

    // Build pagination metadata (Flutter format: limit, offset, total)
    const pagination = {
      limit: take,
      offset: skip,
      total: total,
    };

    return {
      data,
      pagination,
    };
  }

  /**
   * Build description for transaction (matching UI format)
   */
  private buildDescription(
    tx: TransactionForDescription,
    gift?: GiftForDescription,
    isGiftSent?: boolean,
    exchange?: { fromAmount: number; toAmount: number },
  ): string {
    switch (tx.type) {
      case 'deposit':
      case 'recharge':
        return 'Deposit diamonds from the app';
      case 'withdraw':
        return `Withdraw VEX - ${tx.reference_id || ''}`;
      case 'gift':
        if (gift && gift.giftItem) {
          const itemName = gift.giftItem.name;
          const quantity = gift.quantity;
          const isLive = gift.message?.includes('Live:');
          if (isGiftSent) {
            return `Gift sent: ${itemName} x${quantity}`;
          } else {
            return isLive
              ? `Received from Live: ${itemName} x${quantity}`
              : `Received: ${itemName} x${quantity}`;
          }
        }
        return `Gift transaction - ${tx.reference_id || ''}`;
      case 'convert':
        if (exchange) {
          return `Exchange ${exchange.fromAmount} VEX for ${exchange.toAmount} Diamonds`;
        }
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
