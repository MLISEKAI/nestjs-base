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
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { CreateStoreItemDto, UpdateStoreItemDto } from '../dto/store.dto';
import { StoreService } from '../service/store.service';

/**
 * Admin Store Controller - Chỉ admin mới truy cập được
 * Dùng để quản lý store của bất kỳ user nào
 */
@ApiTags('Store (Admin)')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard('account-auth'), AdminGuard)
@ApiBearerAuth('JWT-auth')
@Controller('admin/users/:user_id/store')
export class StoreAdminController {
  constructor(private readonly store: StoreService) {}

  @Get()
  @ApiOperation({ summary: '[ADMIN] Lấy danh sách store của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiOkResponse({ description: 'Store items theo schema Prisma' })
  getStore(@Param('user_id') user_id: string, @Query() query: BaseQueryDto) {
    return this.store.getStore(user_id, query);
  }

  @Post('items')
  @ApiOperation({ summary: '[ADMIN] Thêm item vào store của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user' })
  @ApiBody({ type: CreateStoreItemDto })
  addStoreItem(@Param('user_id') user_id: string, @Body() dto: CreateStoreItemDto) {
    return this.store.addStoreItem(user_id, dto);
  }

  @Patch('items/:item_id')
  @ApiOperation({ summary: '[ADMIN] Cập nhật item trong store của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user' })
  @ApiParam({ name: 'item_id', description: 'ID của item' })
  @ApiBody({ type: UpdateStoreItemDto })
  updateStoreItem(
    @Param('user_id') user_id: string,
    @Param('item_id') itemId: string,
    @Body() dto: UpdateStoreItemDto,
  ) {
    return this.store.updateStoreItem(user_id, itemId, dto);
  }

  @Delete('items/:item_id')
  @ApiOperation({ summary: '[ADMIN] Xóa item trong store của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user' })
  @ApiParam({ name: 'item_id', description: 'ID của item' })
  deleteStoreItem(@Param('user_id') user_id: string, @Param('item_id') itemId: string) {
    return this.store.deleteStoreItem(user_id, itemId);
  }
}
