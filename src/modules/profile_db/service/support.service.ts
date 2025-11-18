import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async getCompanyInfo() {
    return this.prisma.resCompany.findFirst();
  }

  async getSupportInfo() {
    return this.prisma.resSupportInfo.findFirst();
  }

  async getHelpArticles() {
    return this.prisma.resHelpArticle.findMany();
  }
}
