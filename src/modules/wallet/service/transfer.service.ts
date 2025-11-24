// Import Injectable và exceptions từ NestJS
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
// Import PrismaService để query database
import { PrismaService } from 'src/prisma/prisma.service';
// Import Prisma types để type-check
import { Prisma } from '@prisma/client';
// Import các DTO để validate và type-check dữ liệu
import { TransferVexDto, TransferVexResponseDto } from '../dto/diamond-wallet.dto';

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * TransferService - Service xử lý business logic cho chuyển tiền (transfer)
 *
 * Chức năng chính:
 * - Chuyển VEX từ user này sang user khác
 * - Validate số dư và receiver
 * - Tạo transaction records cho cả sender và receiver
 *
 * Lưu ý:
 * - Chỉ hỗ trợ chuyển VEX, không hỗ trợ chuyển Diamond
 * - Không cho phép chuyển cho chính mình
 * - Phải có đủ số dư VEX để chuyển
 */
@Injectable()
export class TransferService {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject PrismaService khi tạo instance của service
   */
  constructor(private prisma: PrismaService) {}

  /**
   * Chuyển VEX từ user này sang user khác
   *
   * @param senderId - User ID của người gửi (từ JWT token)
   * @param dto - TransferVexDto chứa receiver_id và amount
   * @returns TransferVexResponseDto chứa thông tin transfer
   *
   * Quy trình:
   * 1. Validate không cho phép chuyển cho chính mình
   * 2. Validate receiver tồn tại
   * 3. Lấy hoặc tạo VEX wallet của sender
   * 4. Kiểm tra số dư VEX có đủ không
   * 5. Lấy hoặc tạo VEX wallet của receiver
   * 6. Trừ VEX từ sender wallet
   * 7. Cộng VEX vào receiver wallet
   * 8. Tạo transaction records cho cả sender và receiver
   * 9. Return thông tin transfer
   *
   * Lưu ý:
   * - Tự động tạo wallet nếu chưa có
   * - Tạo transaction với type 'transfer' cho cả sender và receiver
   * - Transaction của sender có amount âm, receiver có amount dương
   */
  async transferVex(senderId: string, dto: TransferVexDto): Promise<TransferVexResponseDto> {
    // Không cho phép chuyển cho chính mình
    if (senderId === dto.receiver_id) {
      throw new BadRequestException('Cannot transfer to yourself');
    }

    // Kiểm tra receiver tồn tại
    const receiver = await this.prisma.resUser.findUnique({
      where: { id: dto.receiver_id },
    });

    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }

    // Lấy hoặc tạo VEX wallet của sender
    let senderVexWallet = await this.prisma.resWallet.findFirst({
      where: { user_id: senderId, currency: 'vex' },
    });

    if (!senderVexWallet) {
      senderVexWallet = await this.prisma.resWallet.create({
        data: {
          user_id: senderId,
          currency: 'vex',
          balance: new Prisma.Decimal(0),
        },
      });
    }

    const senderBalance = Number(senderVexWallet.balance);
    if (senderBalance < dto.amount) {
      throw new BadRequestException('Insufficient VEX balance');
    }

    // Lấy hoặc tạo VEX wallet của receiver
    let receiverVexWallet = await this.prisma.resWallet.findFirst({
      where: { user_id: dto.receiver_id, currency: 'vex' },
    });

    if (!receiverVexWallet) {
      receiverVexWallet = await this.prisma.resWallet.create({
        data: {
          user_id: dto.receiver_id,
          currency: 'vex',
          balance: new Prisma.Decimal(0),
        },
      });
    }

    const transferId = `TRF${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Transfer trong transaction
    await this.prisma.$transaction(async (tx) => {
      // Trừ VEX từ sender
      const newSenderBalance = senderBalance - dto.amount;
      await tx.resWallet.update({
        where: { id: senderVexWallet.id },
        data: {
          balance: new Prisma.Decimal(newSenderBalance),
        },
      });

      // Cộng VEX cho receiver
      const receiverBalance = Number(receiverVexWallet.balance);
      const newReceiverBalance = receiverBalance + dto.amount;
      await tx.resWallet.update({
        where: { id: receiverVexWallet.id },
        data: {
          balance: new Prisma.Decimal(newReceiverBalance),
        },
      });

      // Tạo transaction record cho sender (outgoing)
      await tx.resWalletTransaction.create({
        data: {
          wallet_id: senderVexWallet.id,
          user_id: senderId,
          type: 'transfer',
          amount: new Prisma.Decimal(-dto.amount), // Negative for outgoing
          balance_before: senderVexWallet.balance,
          balance_after: new Prisma.Decimal(newSenderBalance),
          status: 'success',
          reference_id: transferId,
        },
      });

      // Tạo transaction record cho receiver (incoming)
      await tx.resWalletTransaction.create({
        data: {
          wallet_id: receiverVexWallet.id,
          user_id: dto.receiver_id,
          type: 'transfer',
          amount: new Prisma.Decimal(dto.amount), // Positive for incoming
          balance_before: receiverVexWallet.balance,
          balance_after: new Prisma.Decimal(newReceiverBalance),
          status: 'success',
          reference_id: transferId,
        },
      });
    });

    // Refresh wallets để lấy balance mới
    const updatedSenderWallet = await this.prisma.resWallet.findUnique({
      where: { id: senderVexWallet.id },
    });
    const updatedReceiverWallet = await this.prisma.resWallet.findUnique({
      where: { id: receiverVexWallet.id },
    });

    return {
      transferId,
      status: 'success',
      newSenderBalance: updatedSenderWallet ? Number(updatedSenderWallet.balance) : 0,
      newReceiverBalance: updatedReceiverWallet ? Number(updatedReceiverWallet.balance) : 0,
    };
  }
}
