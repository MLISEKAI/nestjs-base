import { Injectable, Logger } from '@nestjs/common';
import { Prisma, ResAssociate } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ResAssociateService {
  private logger = new Logger(ResAssociateService.name);
  constructor(private prismaService: PrismaService) {}

  async createAssociated(payload: Prisma.ResAssociateCreateInput): Promise<ResAssociate> {
    try {
      const associated = await this.prismaService.resAssociate.create({ data: payload });
      this.logger.log('✅ Func createAssociated Success: ' + JSON.stringify(associated));
      return associated;
    } catch (error: any) {
      this.logger.log('❌ Func createAssociated: ' + error?.message);
      throw new Error(error.message);
    }
  }
}
