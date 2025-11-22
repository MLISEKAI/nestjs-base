import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import { GiftCatalogService } from '../service/gift-catalog.service';

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
  @ApiOkResponse({
    description: 'Danh sách item quà tặng',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'boolean', example: false },
        code: { type: 'number', example: 0 },
        message: { type: 'string', example: 'Success' },
        data: {
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
              image_url: { example: 'https://img.com/rose.png', description: 'URL hình ảnh gift' },
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
        traceId: { type: 'string', example: 'trace-123456' },
      },
    },
  })
  getItems(@Query('type') type?: string) {
    return this.catalogService.getGiftItems(type);
  }
}
