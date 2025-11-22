import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CacheService } from 'src/common/cache/cache.service';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { CreateWalletDto, UpdateWalletDto } from '../dto/wallet.dto';

@Injectable()
export class WalletService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async getWallet(userId: string, query: BaseQueryDto) {
    // Migrate tất cả wallets cũ với currency "gem" hoặc "gold" sang "diamond"
    const oldWallets = await this.prisma.resWallet.findMany({
      where: {
        user_id: userId,
        currency: { in: ['gem', 'gold'] },
      },
    });

    // Migrate tất cả wallets cũ sang "diamond"
    if (oldWallets.length > 0) {
      // Nếu có nhiều wallets cũ, merge balance vào wallet đầu tiên và xóa các wallet còn lại
      if (oldWallets.length > 1) {
        const totalBalance = oldWallets.reduce((sum, wallet) => sum + Number(wallet.balance), 0);

        // Update wallet đầu tiên
        await this.prisma.resWallet.update({
          where: { id: oldWallets[0].id },
          data: {
            currency: 'diamond',
            balance: new Prisma.Decimal(totalBalance),
          },
        });

        // Xóa các wallet còn lại
        const idsToDelete = oldWallets.slice(1).map((w) => w.id);
        await this.prisma.resWallet.deleteMany({
          where: { id: { in: idsToDelete } },
        });
      } else {
        // Chỉ có 1 wallet cũ, migrate trực tiếp
        await this.prisma.resWallet.update({
          where: { id: oldWallets[0].id },
          data: {
            currency: 'diamond',
          },
        });
      }

      // Invalidate cache
      await this.cacheService.del(`wallet:${userId}:summary`);
      await this.cacheService.delPattern(`wallet:${userId}:*`);
    }

    // Tìm wallet với currency "diamond"
    let diamondWallet = await this.prisma.resWallet.findFirst({
      where: {
        user_id: userId,
        currency: 'diamond',
      },
    });

    // Nếu vẫn không có wallet, tạo wallet mặc định (diamond)
    if (!diamondWallet) {
      diamondWallet = await this.prisma.resWallet.create({
        data: {
          user_id: userId,
          currency: 'diamond',
          balance: new Prisma.Decimal(0),
        },
      });
    }

    return diamondWallet;
  }

  async createWallet(userId: string, dto: CreateWalletDto) {
    const currency = dto.currency || 'diamond';

    // Validate currency: chỉ cho phép 'diamond' (Diamond) hoặc 'vex' (VEX)
    // Nếu là 'gem' hoặc 'gold', tự động convert sang 'diamond'
    let normalizedCurrency = currency;
    if (currency === 'gem' || currency === 'gold') {
      normalizedCurrency = 'diamond';
    } else if (currency !== 'diamond' && currency !== 'vex') {
      throw new BadRequestException(
        `Invalid currency: ${currency}. Chỉ hỗ trợ 'diamond' (Diamond) hoặc 'vex' (VEX).`,
      );
    }

    // Kiểm tra wallet với currency đã tồn tại chưa (tìm cả 'gem' và 'gold' nếu normalize sang 'diamond')
    let exist = null;
    if (normalizedCurrency === 'diamond') {
      exist = await this.prisma.resWallet.findFirst({
        where: {
          user_id: userId,
          currency: { in: ['diamond'] },
        },
      });
    } else {
      // Tìm wallet với vex
      exist = await this.prisma.resWallet.findUnique({
        where: {
          user_id_currency: {
            user_id: userId,
            currency: normalizedCurrency,
          },
        },
      });
    }

    if (exist) {
      // Nếu đã tồn tại, update với dữ liệu mới từ DTO (upsert behavior)
      // Nếu currency khác, migrate sang normalizedCurrency
      const updatedWallet = await (exist.currency !== normalizedCurrency
        ? // Update currency và balance
          this.prisma.resWallet.update({
            where: { id: exist.id },
            data: {
              currency: normalizedCurrency,
              balance:
                dto.balance !== undefined && dto.balance !== null
                  ? new Prisma.Decimal(dto.balance)
                  : exist.balance,
            },
          })
        : // Chỉ update balance
          this.prisma.resWallet.update({
            where: { id: exist.id },
            data: {
              balance:
                dto.balance !== undefined && dto.balance !== null
                  ? new Prisma.Decimal(dto.balance)
                  : exist.balance,
            },
          }));

      // Invalidate cache khi update wallet
      await this.cacheService.del(`wallet:${userId}:summary`);
      await this.cacheService.del(`wallet:${userId}:vex:balance`);
      await this.cacheService.del(`wallet:${userId}:diamond:balance`);
      await this.cacheService.delPattern(`wallet:${userId}:*`);

      return updatedWallet;
    }

    // Tạo wallet mới với dữ liệu từ DTO
    const newWallet = await this.prisma.resWallet.create({
      data: {
        user_id: userId,
        currency: normalizedCurrency,
        balance:
          dto.balance !== undefined && dto.balance !== null
            ? new Prisma.Decimal(dto.balance)
            : new Prisma.Decimal(0),
      },
    });

    // Invalidate cache khi tạo wallet mới
    await this.cacheService.del(`wallet:${userId}:summary`);
    await this.cacheService.del(`wallet:${userId}:vex:balance`);
    await this.cacheService.del(`wallet:${userId}:diamond:balance`);
    await this.cacheService.delPattern(`wallet:${userId}:*`);

    return newWallet;
  }

  async updateWallet(userId: string, dto: UpdateWalletDto) {
    // Nếu không có currency, tìm diamond wallet mặc định
    if (!dto.currency) {
      // Tìm diamond wallet (diamond, gem, hoặc gold - sẽ migrate sang diamond)
      const diamondWallet = await this.prisma.resWallet.findFirst({
        where: {
          user_id: userId,
          currency: { in: ['diamond', 'gem', 'gold'] },
        },
      });

      if (!diamondWallet) {
        throw new NotFoundException(
          'Không tìm thấy wallet. Vui lòng chỉ định currency hoặc tạo wallet mới.',
        );
      }

      // Update diamond wallet (migrate 'gold' hoặc 'gem' sang 'diamond' nếu cần)
      const normalizedCurrency =
        diamondWallet.currency === 'gold' || diamondWallet.currency === 'gem'
          ? 'diamond'
          : diamondWallet.currency;

      const updatedWallet = await this.prisma.resWallet.update({
        where: { id: diamondWallet.id },
        data: {
          currency: normalizedCurrency,
          balance:
            dto.balance !== undefined ? new Prisma.Decimal(dto.balance) : diamondWallet.balance,
        },
      });

      // Invalidate cache khi update wallet
      await this.cacheService.del(`wallet:${userId}:summary`);
      await this.cacheService.del(`wallet:${userId}:vex:balance`);
      await this.cacheService.del(`wallet:${userId}:diamond:balance`);
      await this.cacheService.delPattern(`wallet:${userId}:*`);

      return updatedWallet;
    }

    // Normalize currency: 'gold' hoặc 'gem' -> 'diamond'
    let normalizedCurrency = dto.currency;
    if (dto.currency === 'gold' || dto.currency === 'gem') {
      normalizedCurrency = 'diamond';
    } else if (dto.currency !== 'diamond' && dto.currency !== 'vex') {
      throw new BadRequestException(
        `Invalid currency: ${dto.currency}. Chỉ hỗ trợ 'diamond' (Diamond) hoặc 'vex' (VEX).`,
      );
    }

    // Tìm wallet với currency (có thể là 'gold' hoặc 'gem' cũ, cần migrate)
    let existing = null;
    if (normalizedCurrency === 'diamond') {
      // Tìm wallet với diamond, gem, hoặc gold
      existing = await this.prisma.resWallet.findFirst({
        where: {
          user_id: userId,
          currency: { in: ['diamond', 'gem', 'gold'] },
        },
      });
    } else {
      // Tìm wallet với vex
      existing = await this.prisma.resWallet.findUnique({
        where: {
          user_id_currency: {
            user_id: userId,
            currency: normalizedCurrency,
          },
        },
      });
    }

    // Nếu wallet chưa tồn tại, tạo mới (upsert behavior)
    if (!existing) {
      const newWallet = await this.prisma.resWallet.create({
        data: {
          user_id: userId,
          currency: normalizedCurrency,
          balance:
            dto.balance !== undefined ? new Prisma.Decimal(dto.balance) : new Prisma.Decimal(0),
        },
      });

      // Invalidate cache khi tạo wallet mới
      await this.cacheService.del(`wallet:${userId}:summary`);
      await this.cacheService.del(`wallet:${userId}:vex:balance`);
      await this.cacheService.del(`wallet:${userId}:diamond:balance`);
      await this.cacheService.delPattern(`wallet:${userId}:*`);

      return newWallet;
    }

    // Update wallet nếu đã tồn tại (migrate currency nếu cần)
    try {
      const updatedWallet = await this.prisma.resWallet.update({
        where: { id: existing.id },
        data: {
          currency: normalizedCurrency, // Migrate 'gold' hoặc 'gem' sang 'diamond'
          balance: dto.balance !== undefined ? new Prisma.Decimal(dto.balance) : existing.balance,
        },
      });

      // Invalidate cache khi update wallet
      await this.cacheService.del(`wallet:${userId}:summary`);
      await this.cacheService.del(`wallet:${userId}:vex:balance`);
      await this.cacheService.del(`wallet:${userId}:diamond:balance`);
      await this.cacheService.delPattern(`wallet:${userId}:*`);

      return updatedWallet;
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
