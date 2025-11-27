// Import Injectable từ NestJS
import { Injectable } from '@nestjs/common';
// Import PrismaService để query database
import { PrismaService } from 'src/prisma/prisma.service';
// Import BaseQueryDto cho pagination
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
// Import utility để build paginated response
import { buildPaginatedResponse } from '../../../common/utils/pagination.util';

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * SupportService - Service xử lý business logic cho support/help center
 *
 * Chức năng chính:
 * - Lấy thông tin công ty (company info)
 * - Lấy thông tin hỗ trợ (support contact info)
 * - Lấy danh sách bài viết hướng dẫn (help articles) với pagination
 *
 * Lưu ý:
 * - Company info và support info là singleton (chỉ có 1 record)
 * - Help articles được sắp xếp theo thời gian tạo (mới nhất trước)
 * - Không cần authentication để truy cập support info
 */
@Injectable()
export class SupportService {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject PrismaService khi tạo instance của service
   */
  constructor(private prisma: PrismaService) {}

  /**
   * Lấy thông tin công ty
   * @returns Company info (name, address, phone)
   */
  async getCompanyInfo() {
    // Lấy record đầu tiên (chỉ có 1 company info)
    return this.prisma.resCompany.findFirst();
  }

  /**
   * Lấy thông tin hỗ trợ
   * @returns Support contact info (email, phone)
   */
  async getSupportInfo() {
    // Lấy record đầu tiên (chỉ có 1 support info)
    return this.prisma.resSupportInfo.findFirst();
  }

  /**
   * Lấy danh sách bài viết hướng dẫn với pagination
   * @param query - Query parameters cho pagination (page, limit)
   * @returns Paginated list of help articles
   */
  async getHelpArticles(query?: BaseQueryDto) {
    // Parse pagination parameters với default values
    const take = query?.limit && query.limit > 0 ? query.limit : 20; // Default 20 items per page
    const page = query?.page && query.page > 0 ? query.page : 1; // Default page 1
    const skip = (page - 1) * take; // Calculate offset

    // Query articles và count total cùng lúc để tối ưu performance
    const [articles, total] = await Promise.all([
      // Lấy danh sách help articles
      this.prisma.resHelpArticle.findMany({
        take, // Limit số lượng
        skip, // Offset cho pagination
        orderBy: { created_at: 'desc' }, // Sắp xếp theo thời gian tạo (mới nhất trước)
      }),
      // Đếm tổng số articles
      this.prisma.resHelpArticle.count(),
    ]);

    // Build response với pagination metadata
    return buildPaginatedResponse(articles, total, page, take);
  }
}
