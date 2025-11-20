import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaymentMethodDto } from '../dto/diamond-wallet.dto';

@Injectable()
export class PaymentMethodService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get available payment methods from database
   */
  async getPaymentMethods(): Promise<PaymentMethodDto[]> {
    const methods = await this.prisma.resPaymentMethod.findMany({
      where: { is_active: true },
      orderBy: { created_at: 'asc' },
    });

    // Nếu chưa có data trong DB, trả về empty array
    // Admin có thể seed data sau
    return methods.map((method) => ({
      id: method.method_id,
      name: method.name,
      type: method.type,
      masked_info: method.masked_info || undefined,
      is_active: method.is_active,
    }));
  }
}
