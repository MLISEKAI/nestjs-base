// Import các decorator và class từ NestJS để tạo controller
import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
// Import các decorator từ Swagger để tạo API documentation
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
// Import GiftCatalogService để xử lý business logic
import { GiftCatalogService } from '../service/gift-catalog.service';
// Import DTO để validate và type-check dữ liệu
import { GiftItemsQueryDto } from '../dto/gift-items-query.dto';
// Import interface để type-check
import { IPaginatedResponse } from '../../../common/interfaces/pagination.interface';

/**
 * @ApiTags('Gift Catalog') - Nhóm các endpoints này trong Swagger UI với tag "Gift Catalog"
 * @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
 *   - transform: true - Tự động transform dữ liệu
 *   - whitelist: true - Chỉ giữ lại các properties được định nghĩa trong DTO
 * @Controller('gifts') - Định nghĩa base route là /gifts
 * GiftCatalogController - Controller xử lý các HTTP requests liên quan đến gift catalog
 *
 * Chức năng chính:
 * - Lấy danh sách gift items với pagination, filtering, và sorting
 * - Public endpoint (không cần authentication)
 */
@ApiTags('Gift Catalog')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('gifts')
export class GiftCatalogController {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject GiftCatalogService khi tạo instance của controller
   */
  constructor(private readonly catalogService: GiftCatalogService) {}

  @Get('items')
  @ApiOperation({ summary: 'Danh sách item quà tặng' })
  @ApiOkResponse({
    description: 'Danh sách item quà tặng với pagination',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'boolean', example: false },
        code: { type: 'number', example: 0 },
        message: { type: 'string', example: 'Success' },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    example: 'gift-item-uuid',
                    type: 'string',
                    description: 'ID của gift item (UUID)',
                  },
                  name: { example: 'Rose', description: 'Tên gift' },
                  image_url: {
                    example: 'https://img.com/rose.png',
                    description: 'URL hình ảnh gift',
                  },
                  price: { example: 10, type: 'number', description: 'Giá gift' },
                  type: {
                    example: 'normal',
                    description: 'Loại: hot, event, lucky, friendship, vip, normal',
                  },
                  is_event: {
                    example: true,
                    type: 'boolean',
                    description: 'Có phải gift của event không',
                  },
                  event_end_date: {
                    example: '2025-12-31T23:59:59Z',
                    nullable: true,
                    description: 'Ngày kết thúc event (nếu là event gift)',
                  },
                },
              },
            },
            meta: {
              type: 'object',
              properties: {
                item_count: { type: 'number', example: 10 },
                total_items: { type: 'number', example: 20 },
                items_per_page: { type: 'number', example: 10 },
                total_pages: { type: 'number', example: 2 },
                current_page: { type: 'number', example: 1 },
              },
            },
          },
        },
        traceId: { type: 'string', example: 'trace-123456' },
      },
    },
  })
  getItems(@Query() query: GiftItemsQueryDto): Promise<IPaginatedResponse<any>> {
    return this.catalogService.getGiftItems(query.type, query);
  }
}
