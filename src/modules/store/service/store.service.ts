// Import Injectable và exceptions từ NestJS
import { Injectable, NotFoundException } from '@nestjs/common';
// Import PrismaService để query database
import { PrismaService } from 'src/prisma/prisma.service';
// Import các DTO để validate và type-check dữ liệu
import { StoreDto, CreateStoreItemDto, UpdateStoreItemDto } from '../dto/store.dto';
// Import BaseQueryDto cho pagination
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
// Import utility để build paginated response
import { buildPaginatedResponse } from '../../../common/utils/pagination.util';

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * StoreService - Service xử lý business logic cho store (cửa hàng/shop)
 *
 * Chức năng chính:
 * - Lấy danh sách items trong store của user với pagination
 * - Thêm item mới vào store
 * - Cập nhật thông tin item (name, price)
 * - Xóa item khỏi store
 *
 * Lưu ý:
 * - Mỗi user có store riêng
 * - Store items có name và price (Decimal type)
 * - Chỉ owner mới có thể quản lý items trong store của mình
 */
@Injectable()
export class StoreService {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject PrismaService khi tạo instance của service
   */
  constructor(private prisma: PrismaService) {}

  /**
   * Lấy danh sách items trong store của user với pagination
   * @param userId - ID của user
   * @param query - Query parameters cho pagination (page, limit)
   * @returns Paginated list of store items
   */
  async getStore(userId: string, query?: BaseQueryDto): Promise<any> {
    // Parse pagination parameters với default values
    const take = query?.limit && query.limit > 0 ? query.limit : 20; // Default 20 items per page
    const page = query?.page && query.page > 0 ? query.page : 1; // Default page 1
    const skip = (page - 1) * take; // Calculate offset

    // Query store items và count total cùng lúc để tối ưu performance
    const [items, total] = await Promise.all([
      // Lấy danh sách store items của user
      this.prisma.resStoreItem.findMany({
        where: { user_id: userId }, // Chỉ lấy items của user này
        take, // Limit số lượng
        skip, // Offset cho pagination
        orderBy: { id: 'desc' }, // Sắp xếp theo ID giảm dần (item mới nhất trước)
      }),
      // Đếm tổng số items của user
      this.prisma.resStoreItem.count({ where: { user_id: userId } }),
    ]);

    // Convert Decimal price to Number để dễ xử lý ở frontend
    const itemsWithPrice = items.map((item) => ({ ...item, price: Number(item.price) }));
    
    // Build response với pagination metadata
    return buildPaginatedResponse(itemsWithPrice, total, page, take);
  }

  /**
   * Thêm item mới vào store
   * @param userId - ID của user (owner của store)
   * @param dto - DTO chứa thông tin item (name, price)
   * @returns Store item đã tạo
   */
  async addStoreItem(userId: string, dto: CreateStoreItemDto) {
    // Tạo store item mới trong database
    return this.prisma.resStoreItem.create({
      data: {
        user_id: userId, // ID của user sở hữu item
        name: dto.name, // Tên item
        price: dto.price, // Giá item (Decimal)
      },
    });
  }

  /**
   * Cập nhật thông tin store item
   * @param userId - ID của user (để verify ownership)
   * @param itemId - ID của item cần update
   * @param dto - DTO chứa thông tin mới (name, price)
   * @returns Store item đã update
   * @throws NotFoundException nếu item không tồn tại hoặc không thuộc về user
   */
  async updateStoreItem(userId: string, itemId: string, dto: UpdateStoreItemDto) {
    try {
      // Nếu thiếu một trong hai field (name hoặc price), cần lấy giá trị hiện tại
      if (dto.name === undefined || dto.price === undefined) {
        // Query item hiện tại để lấy giá trị
        const existing = await this.prisma.resStoreItem.findFirst({
          where: { id: itemId, user_id: userId }, // Verify ownership
          select: { name: true, price: true },
        });
        
        // Nếu không tìm thấy item, throw exception
        if (!existing) throw new NotFoundException('Store item not found');
        
        // Update với giá trị mới hoặc giữ nguyên giá trị cũ
        return this.prisma.resStoreItem.update({
          where: { id: itemId },
          data: {
            name: dto.name ?? existing.name, // Dùng giá trị mới hoặc giữ nguyên
            price: dto.price !== undefined ? dto.price : existing.price, // Dùng giá trị mới hoặc giữ nguyên
          },
        });
      }
      
      // Update cả name và price
      return await this.prisma.resStoreItem.update({
        where: { id: itemId, user_id: userId }, // Verify ownership
        data: { name: dto.name, price: dto.price }, // Update cả 2 fields
      });
    } catch (error) {
      // Prisma error code P2025 = Record not found
      if (error.code === 'P2025') {
        throw new NotFoundException('Store item not found');
      }
      throw error;
    }
  }

  /**
   * Xóa item khỏi store
   * @param userId - ID của user (để verify ownership)
   * @param itemId - ID của item cần xóa
   * @returns Message xác nhận đã xóa
   * @throws NotFoundException nếu item không tồn tại hoặc không thuộc về user
   */
  async deleteStoreItem(userId: string, itemId: string) {
    try {
      // Xóa store item khỏi database
      await this.prisma.resStoreItem.delete({
        where: { id: itemId, user_id: userId }, // Verify ownership
      });
      
      // Trả về message xác nhận
      return { message: 'Store item deleted' };
    } catch (error) {
      // Prisma error code P2025 = Record not found
      if (error.code === 'P2025') {
        throw new NotFoundException('Store item not found');
      }
      throw error;
    }
  }
}
