import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { BaseQueryDto } from '../dto/base-query.dto';
import { StoreDto, CreateStoreItemDto, UpdateStoreItemDto } from '../dto/store.dto';
import { StoreService } from '../service/store.service';

@ApiTags('Store')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('profile/:user_id/store')
export class StoreController {
  constructor(private readonly store: StoreService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách store của user' })
  @ApiOkResponse({
    description: 'Store items theo schema Prisma',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { example: 'item-1' },
              name: { example: 'Sword' },
              price: { example: 100 },
              user_id: { example: 'user-1' },
            },
          },
        },
      },
    },
  })
  getStore(@Param('user_id') userId: string, @Query() query: BaseQueryDto) {
    return this.store.getStore(userId);
  }

  @Post('items')
  @ApiOperation({ summary: 'Thêm item vào store' })
  @ApiBody({ type: CreateStoreItemDto })
  addStoreItem(@Param('user_id') userId: string, @Body() dto: CreateStoreItemDto) {
    return this.store.addStoreItem(userId, dto);
  }

  @Patch('items/:item_id')
  @ApiOperation({ summary: 'Cập nhật item trong store' })
  @ApiBody({ type: UpdateStoreItemDto })
  updateStoreItem(
    @Param('user_id') userId: string,
    @Param('item_id') itemId: string,
    @Body() dto: UpdateStoreItemDto,
  ) {
    return this.store.updateStoreItem(userId, itemId, dto);
  }

  @Delete('items/:item_id')
  @ApiOperation({ summary: 'Xóa item trong store' })
  deleteStoreItem(@Param('user_id') userId: string, @Param('item_id') itemId: string) {
    return this.store.deleteStoreItem(userId, itemId);
  }
}
