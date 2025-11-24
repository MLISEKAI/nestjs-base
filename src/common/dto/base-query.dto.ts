// Import decorators từ Swagger để tạo API documentation
import { ApiPropertyOptional } from '@nestjs/swagger';
// Import decorators từ class-transformer để transform dữ liệu
import { Type } from 'class-transformer';
// Import decorators từ class-validator để validate dữ liệu
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

/**
 * Base Query DTO cho pagination, search, và sorting
 * DTO này được extend bởi các DTO khác để thêm pagination và filtering
 * Tất cả các endpoints có pagination đều sử dụng DTO này hoặc extend từ nó
 */
export class BaseQueryDto {
  /**
   * @ApiPropertyOptional - Optional property trong Swagger documentation
   * @IsOptional() - Cho phép property này không bắt buộc
   * @Type(() => Number) - Transform string thành number (từ query string)
   * @IsNumber() - Validate phải là number
   * @Min(1) - Giá trị tối thiểu là 1
   * page - Số trang (bắt đầu từ 1, không phải 0)
   */
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number (starts from 1)',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page: number = 1;

  /**
   * limit - Số lượng items mỗi trang
   * Mặc định 20 items mỗi trang
   */
  @ApiPropertyOptional({
    example: 20,
    description: 'Number of items per page',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit: number = 20;

  /**
   * search - Từ khóa tìm kiếm (optional)
   * Dùng để search trong các fields như: title, content, name, etc.
   */
  @ApiPropertyOptional({
    example: '',
    description: 'Search keyword',
  })
  @IsOptional()
  @IsString()
  search?: string;

  /**
   * sort - Sắp xếp theo field và order (optional)
   * Format: "field:asc" hoặc "field:desc"
   * Ví dụ: "created_at:desc", "name:asc"
   */
  @ApiPropertyOptional({
    example: 'created_at:desc',
    description: 'Sort field and order (field:asc or field:desc)',
  })
  @IsOptional()
  @IsString()
  sort?: string;

  /**
   * since - Timestamp cho pull-to-refresh (optional)
   * Chỉ trả về các items được tạo sau thời điểm này
   * Hữu ích cho pull-to-refresh: chỉ lấy items mới
   */
  @ApiPropertyOptional({
    example: '2025-11-24T15:02:00Z',
    description: 'Timestamp for pull-to-refresh (only return posts created after this time)',
  })
  @IsOptional()
  @Type(() => Date) // Transform string thành Date object
  since?: Date;
}
