import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { TransferVexDto, TransferVexResponseDto } from '../dto/diamond-wallet.dto';

@Injectable()
export class TransferService {
  constructor(private prisma: PrismaService) {}

  /**
   * Transfer VEX from one user to another
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

    // Lấy VEX wallet của sender
    const senderVexWallet = await this.prisma.resWallet.findFirst({
      where: { user_id: senderId, currency: 'vex' },
    });

    if (!senderVexWallet) {
      throw new NotFoundException('Sender VEX wallet not found');
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
