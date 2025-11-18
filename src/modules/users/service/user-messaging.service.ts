import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SendMessageDto } from '../dto/send-message.dto';

@Injectable()
export class UserMessagingService {
  constructor(private prisma: PrismaService) {}

  async sendMessage(senderId: string, dto: SendMessageDto) {
    const message = await this.prisma.resMessage.create({
      data: { sender_id: senderId, receiver_id: dto.recipientId, content: dto.content },
    });
    return { message: 'Message sent', data: message };
  }
}
