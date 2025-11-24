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
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';
import {
  InventoryItemDto,
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
} from '../dto/inventory.dto';
import { InventoryService } from '../service/inventory.service';
import type { AuthenticatedRequest } from '../../../../common/interfaces/request.interface';

/**
 * User Inventory Controller - Yêu cầu authentication
 * User chỉ có thể xem/sửa inventory của chính mình
 */
@ApiTags('Inventory (User)')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard('account-auth'))
@ApiBearerAuth('JWT-auth')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách vật phẩm của user' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng mỗi trang (mặc định: 20)',
  })
  @ApiOkResponse({
    description: 'Danh sách vật phẩm với pagination (chuẩn format)',
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
                  id: { example: 'inv-1' },
                  user_id: { example: 'user-1' },
                  item_id: { example: 'res-item-1' },
                  quantity: { example: 1 },
                },
              },
            },
            meta: { type: 'object' },
          },
        },
        traceId: { type: 'string' },
      },
    },
  })
  getInventory(@Req() req: AuthenticatedRequest, @Query() query: BaseQueryDto) {
    const userId = req.user.id;
    return this.inventory.getInventory(userId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Thêm vật phẩm vào inventory của user hiện tại' })
  @ApiBody({ type: CreateInventoryItemDto })
  addInventoryItem(@Req() req: AuthenticatedRequest, @Body() dto: CreateInventoryItemDto) {
    const userId = req.user.id;
    return this.inventory.addInventoryItem(userId, dto);
  }

  @Patch(':item_id')
  @ApiOperation({ summary: 'Cập nhật vật phẩm inventory của user hiện tại' })
  @ApiBody({ type: UpdateInventoryItemDto })
  updateInventoryItem(
    @Req() req: AuthenticatedRequest,
    @Param('item_id') itemId: string,
    @Body() dto: UpdateInventoryItemDto,
  ) {
    const userId = req.user.id;
    return this.inventory.updateInventoryItem(userId, itemId, dto);
  }

  @Delete(':item_id')
  @ApiOperation({ summary: 'Xóa vật phẩm inventory của user hiện tại' })
  deleteInventoryItem(@Req() req: AuthenticatedRequest, @Param('item_id') itemId: string) {
    const userId = req.user.id;
    return this.inventory.deleteInventoryItem(userId, itemId);
  }
}
