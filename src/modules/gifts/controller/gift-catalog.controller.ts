import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import { GiftCatalogService } from '../service/gift-catalog.service';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { IPaginatedResponse } from '../../../common/interfaces/pagination.interface';

@ApiTags('Gift Catalog')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('gifts')
export class GiftCatalogController {
  constructor(private readonly catalogService: GiftCatalogService) {}

  @Get('items')
  @ApiOperation({ summary: 'Danh sách item quà tặng' })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Loại quà: hot, event, lucky, friendship, vip, normal',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Số trang (mặc định: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng mỗi trang (mặc định: 10)',
  })
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
  getItems(
    @Query('type') type?: string,
    @Query() query?: BaseQueryDto,
  ): Promise<IPaginatedResponse<any>> {
    return this.catalogService.getGiftItems(type, query);
  }
}
