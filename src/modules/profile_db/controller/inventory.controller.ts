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
import {
  InventoryItemDto,
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
} from '../dto/inventory.dto';
import { InventoryService } from '../service/inventory.service';

@ApiTags('Inventory')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('profile/:user_id/inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách vật phẩm của user' })
  @ApiOkResponse({
    description: 'Danh sách vật phẩm theo schema Prisma',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { example: 'inv-1' },
          user_id: { example: 'user-1' },
          item_id: { example: 'res-item-1' },
          quantity: { example: 1 },
        },
      },
    },
  })
  getInventory(@Param('user_id') userId: string, @Query() query: BaseQueryDto) {
    return this.inventory.getInventory(userId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Thêm vật phẩm vào inventory' })
  @ApiBody({ type: CreateInventoryItemDto })
  addInventoryItem(@Param('user_id') userId: string, @Body() dto: CreateInventoryItemDto) {
    return this.inventory.addInventoryItem(userId, dto);
  }

  @Patch(':item_id')
  @ApiOperation({ summary: 'Cập nhật vật phẩm inventory' })
  @ApiBody({ type: UpdateInventoryItemDto })
  updateInventoryItem(
    @Param('user_id') userId: string,
    @Param('item_id') itemId: string,
    @Body() dto: UpdateInventoryItemDto,
  ) {
    return this.inventory.updateInventoryItem(userId, itemId, dto);
  }

  @Delete(':item_id')
  @ApiOperation({ summary: 'Xóa vật phẩm inventory' })
  deleteInventoryItem(@Param('user_id') userId: string, @Param('item_id') itemId: string) {
    return this.inventory.deleteInventoryItem(userId, itemId);
  }
}
