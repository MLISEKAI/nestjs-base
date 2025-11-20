import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import { GiftCatalogService } from '../service/gift-catalog.service';

@ApiTags('Gift Catalog')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('gifts')
export class GiftCatalogController {
  constructor(private readonly catalogService: GiftCatalogService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Danh mục quà tặng' })
  @ApiOkResponse({
    description: 'Danh sách danh mục quà tặng',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { example: 'cat-1' },
          name: { example: 'Hot' },
        },
      },
    },
  })
  getCategories() {
    return this.catalogService.getGiftCategories();
  }

  @Get('items')
  @ApiOperation({ summary: 'Danh sách item quà tặng' })
  @ApiQuery({ name: 'category', required: false, description: 'ID của category' })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Loại quà: hot, event, lucky, friendship, vip, normal',
  })
  @ApiOkResponse({
    description: 'Danh sách item quà tặng',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { example: 'gift-item-1' },
          name: { example: 'Rose' },
          price: { example: 100 },
          category_id: { example: 'cat-1' },
          image_url: { example: 'https://img.com/rose.png' },
          type: { example: 'normal' },
        },
      },
    },
  })
  getItems(@Query('category') categoryId?: string, @Query('type') type?: string) {
    return this.catalogService.getGiftItems(categoryId, type);
  }
}
