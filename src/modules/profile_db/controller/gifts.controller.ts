import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiBody } from '@nestjs/swagger';
import { GiftsService } from '../service/gifts.service';
import {
  CreateGiftDto,
  GiftSummaryResponseDto,
  TopSupporterDto,
  UpdateGiftDto,
} from '../dto/gift.dto';

@ApiTags('Gifts')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('profile/:user_id/gifts')
export class GiftsController {
  constructor(private readonly service: GiftsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Tổng quan quà tặng của user' })
  @ApiOkResponse({ type: GiftSummaryResponseDto, description: 'Tổng quan quà tặng' })
  getGiftsSummary(@Param('user_id') userId: string) {
    return this.service.getGiftsSummary(userId);
  }

  @Get('top')
  @ApiOperation({ summary: 'Top quà tặng của user' })
  @ApiOkResponse({ type: [TopSupporterDto], description: 'Danh sách top supporter' })
  getTopGifts(@Param('user_id') userId: string) {
    return this.service.getTopSupporters(userId);
  }

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
          name: { example: 'Flowers' },
          icon: { example: 'https://icon.com/flower.png' },
        },
      },
    },
  })
  getCategories() {
    return this.service.getGiftCategories();
  }

  @Get('items')
  @ApiOperation({ summary: 'Danh sách item quà tặng' })
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
        },
      },
    },
  })
  getItems(@Query('category_id') categoryId?: string) {
    return this.service.getGiftItems(categoryId);
  }

  @Get('milestones')
  @ApiOperation({ summary: 'Mốc quà tặng của user' })
  @ApiOkResponse({
    description: 'Danh sách mốc quà tặng',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          milestone: { example: '100 gifts' },
          achieved: { example: true },
          achieved_at: { example: '2025-01-01T00:00:00.000Z' },
        },
      },
    },
  })
  getMilestones(@Param('user_id') userId: string) {
    return this.service.getGiftMilestones(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo mới quà tặng' })
  @ApiBody({ type: CreateGiftDto })
  @ApiCreatedResponse({ description: 'Quà tặng được tạo thành công' })
  create(@Body() dto: CreateGiftDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách toàn bộ quà tặng' })
  @ApiOkResponse({ description: 'Danh sách quà tặng', type: [CreateGiftDto] })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết 1 quà tặng' })
  @ApiOkResponse({ description: 'Chi tiết quà tặng', type: CreateGiftDto })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật quà tặng' })
  @ApiBody({ type: UpdateGiftDto })
  @ApiOkResponse({ description: 'Quà tặng cập nhật thành công', type: CreateGiftDto })
  update(@Param('id') id: string, @Body() dto: UpdateGiftDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa quà tặng' })
  @ApiOkResponse({
    description: 'Quà tặng đã bị xóa',
    schema: { type: 'object', properties: { message: { example: 'Gift deleted' } } },
  })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
