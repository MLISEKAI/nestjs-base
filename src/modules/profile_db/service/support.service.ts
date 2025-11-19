import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseQueryDto } from '../dto/base-query.dto';
import { buildPaginatedResponse } from '../../../common/utils/pagination.util';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async getCompanyInfo() {
    return this.prisma.resCompany.findFirst();
  }

  async getSupportInfo() {
    return this.prisma.resSupportInfo.findFirst();
  }

  async getHelpArticles(query?: BaseQueryDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const [articles, total] = await Promise.all([
      this.prisma.resHelpArticle.findMany({
        take,
        skip,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.resHelpArticle.count(),
    ]);

    return buildPaginatedResponse(articles, total, page, take);
  }
}
