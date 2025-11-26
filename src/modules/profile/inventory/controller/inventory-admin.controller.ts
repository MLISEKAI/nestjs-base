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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../../../../common/guards/admin.guard';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';
import { CreateInventoryItemDto, UpdateInventoryItemDto } from '../dto/inventory.dto';
import { InventoryService } from '../service/inventory.service';

/**
 * Admin Inventory Controller - Chỉ admin mới truy cập được
 * Dùng để quản lý inventory của bất kỳ user nào
 */
@ApiTags('Inventory (Admin)')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard('account-auth'), AdminGuard)
@ApiBearerAuth('JWT-auth')
@Controller('admin/users/:user_id/inventory')
export class InventoryAdminController {
  constructor(private readonly inventory: InventoryService) {}

  @Get()
  @ApiOperation({ summary: '[ADMIN] Danh sách vật phẩm của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng mỗi trang (mặc định: 20)',
  })
  @ApiOkResponse({ description: 'Danh sách vật phẩm với pagination' })
  getInventory(@Param('user_id') userId: string, @Query() query: BaseQueryDto) {
    return this.inventory.getInventory(userId, query);
  }

  @Post()
  @ApiOperation({ summary: '[ADMIN] Thêm vật phẩm vào inventory của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user' })
  @ApiBody({ type: CreateInventoryItemDto })
  addInventoryItem(@Param('user_id') userId: string, @Body() dto: CreateInventoryItemDto) {
    return this.inventory.addInventoryItem(userId, dto);
  }

  @Patch(':item_id')
  @ApiOperation({ summary: '[ADMIN] Cập nhật vật phẩm inventory của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user' })
  @ApiParam({ name: 'item_id', description: 'ID của item' })
  @ApiBody({ type: UpdateInventoryItemDto })
  updateInventoryItem(
    @Param('user_id') userId: string,
    @Param('item_id') itemId: string,
    @Body() dto: UpdateInventoryItemDto,
  ) {
    return this.inventory.updateInventoryItem(userId, itemId, dto);
  }

  @Delete(':item_id')
  @ApiOperation({ summary: '[ADMIN] Xóa vật phẩm inventory của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user' })
  @ApiParam({ name: 'item_id', description: 'ID của item' })
  deleteInventoryItem(@Param('user_id') userId: string, @Param('item_id') itemId: string) {
    return this.inventory.deleteInventoryItem(userId, itemId);
  }
}
