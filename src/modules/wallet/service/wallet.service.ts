// Import các exception từ NestJS
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
// Import PrismaService để tương tác với database
import { PrismaService } from 'src/prisma/prisma.service';
// Import Prisma types
import { Prisma } from '@prisma/client';
// Import CacheService để cache data
import { CacheService } from 'src/common/cache/cache.service';
// Import BaseQueryDto cho pagination
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
// Import các DTO để validate và type-check dữ liệu
import { CreateWalletDto, UpdateWalletDto } from '../dto/wallet.dto';
// Import utility để build paginated response
import { buildPaginatedResponse } from '../../../common/utils/pagination.util';
// Import interface cho paginated response
import { IPaginatedResponse } from '../../../common/interfaces/pagination.interface';

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * WalletService - Service xử lý business logic cho wallet operations
 *
 * Chức năng chính:
 * - CRUD wallet (Diamond, VEX)
 * - Đảm bảo user có đủ 2 ví (diamond và vex)
 * - Migrate wallets cũ (gem, gold) sang diamond
 * - Cache wallet data để tối ưu performance
 */
@Injectable()
export class WalletService {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject các dependencies khi tạo instance của service
   */
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  /**
   * Lấy danh sách wallets của user với pagination
   *
   * @param userId - User ID
   * @param query - BaseQueryDto cho pagination và filtering
   * @returns Paginated response chứa danh sách wallets
   *
   * Quy trình:
   * 1. Đảm bảo user có đủ 2 ví (diamond và vex)
   * 2. Query wallets với pagination và filtering
   * 3. Trả về paginated response
   */
  async getWallet(userId: string, query: BaseQueryDto): Promise<IPaginatedResponse<any>> {
    // Đảm bảo user có cả 2 ví (diamond và vex)
    // Nếu thiếu, sẽ tự động tạo mới
    await this.ensureUserWallets(userId);

    // Pagination: lấy limit và page từ query, default limit = 20, page = 1
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    // Build where clause: filter theo user_id
    const where: Prisma.ResWalletWhereInput = {
      user_id: userId,
    };

    // Filter by currency nếu search chứa từ khóa currency (diamond hoặc vex)
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      if (searchLower === 'diamond' || searchLower === 'vex') {
        where.currency = searchLower;
      }
    }

    // Build orderBy: mặc định sắp xếp theo created_at desc (mới nhất trước)
    let orderBy: Prisma.ResWalletOrderByWithRelationInput = { created_at: 'desc' };
    if (query.sort) {
      // Parse sort string: "field:asc" hoặc "field:desc"
      const [field, order] = query.sort.split(':');
      if (field && (order === 'asc' || order === 'desc')) {
        orderBy = { [field]: order } as Prisma.ResWalletOrderByWithRelationInput;
      }
    }

    // Query wallets với pagination và count total
    // Sử dụng Promise.all để query song song, tối ưu performance
    const [wallets, total] = await Promise.all([
      this.prisma.resWallet.findMany({
        where,
        take,
        skip,
        orderBy,
      }),
      this.prisma.resWallet.count({ where }),
    ]);

    // Trả về paginated response với format chuẩn
    return buildPaginatedResponse(wallets, total, page, take);
  }

  /**
   * Đảm bảo user có cả 2 ví (diamond và vex)
   * Tự động tạo nếu chưa có
   *
   * @param userId - User ID
   *
   * Quy trình:
   * 1. Kiểm tra diamond wallet, tạo nếu chưa có
   * 2. Kiểm tra vex wallet, tạo nếu chưa có
   *
   * Lưu ý:
   * - Mỗi user phải có đủ 2 ví: diamond và vex
   * - Balance mặc định = 0 khi tạo mới
   * - Method này được gọi tự động trong getWallet() để đảm bảo data consistency
   */
  async ensureUserWallets(userId: string): Promise<void> {
    // Kiểm tra và tạo diamond wallet nếu chưa có
    const diamondWallet = await this.prisma.resWallet.findFirst({
      where: {
        user_id: userId,
        currency: 'diamond',
      },
    });

    if (!diamondWallet) {
      // Tạo diamond wallet mới với balance = 0
      await this.prisma.resWallet.create({
        data: {
          user_id: userId,
          currency: 'diamond',
          balance: new Prisma.Decimal(0),
        },
      });
    }

    // Kiểm tra và tạo vex wallet nếu chưa có
    const vexWallet = await this.prisma.resWallet.findFirst({
      where: {
        user_id: userId,
        currency: 'vex',
      },
    });

    if (!vexWallet) {
      // Tạo vex wallet mới với balance = 0
      await this.prisma.resWallet.create({
        data: {
          user_id: userId,
          currency: 'vex',
          balance: new Prisma.Decimal(0),
        },
      });
    }
  }

  async createWallet(userId: string, dto: CreateWalletDto) {
    const currency = dto.currency || 'diamond';

    // Validate currency: chỉ cho phép 'diamond' (Diamond) hoặc 'vex' (VEX)
    // CreateWalletDto đã validate enum, nên currency chỉ có thể là 'diamond' hoặc 'vex'
    const normalizedCurrency = currency;

    // Kiểm tra wallet với currency đã tồn tại chưa
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
