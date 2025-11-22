import {
  Controller,
  Get,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { GiftCrudService } from '../service/gift-crud.service';
import { GiftSummaryService } from '../service/gift-summary.service';
import { UserGiftWallService } from '../../users/service/user-gift-wall.service';
import { InventoryService } from '../../profile/inventory/service/inventory.service';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

/**
 * Admin Gifts Controller - Chỉ admin mới truy cập được
 * Dùng để quản lý gifts của bất kỳ user nào
 */
@ApiTags('Gifts (Admin)')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard('account-auth'), AdminGuard)
@ApiBearerAuth('JWT-auth')
@Controller('admin/users/:user_id/gifts')
export class GiftsAdminController {
  constructor(
    private readonly crudService: GiftCrudService,
    private readonly summaryService: GiftSummaryService,
    private readonly giftWallService: UserGiftWallService,
    private readonly inventoryService: InventoryService,
  ) {}

  @Get('top')
  @ApiOperation({ summary: '[ADMIN] Xem top gifts của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiOkResponse({ description: 'Danh sách top supporter' })
  getTopGifts(@Param('user_id') userId: string) {
    return this.summaryService.getTopSupporters(userId);
  }

  @Get('gift-wall')
  @ApiOperation({ summary: '[ADMIN] Xem gift wall của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiOkResponse({ description: 'Thông tin Gift Wall' })
  getGiftWall(@Param('user_id') userId: string) {
    return this.giftWallService.getGiftWall(userId);
  }

  @Get('gift-wall/:milestone_id/givers')
  @ApiOperation({ summary: '[ADMIN] Xem milestones với progress của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiParam({
    name: 'milestone_id',
    description: 'ID của milestone (optional)',
    required: false,
    type: String,
  })
  @ApiOkResponse({ description: 'Danh sách milestones với progress' })
  getGiftWallMilestones(
    @Param('user_id') userId: string,
    @Param('milestone_id') milestoneId?: string,
  ) {
    return this.giftWallService.getGiftWallMilestones(userId);
  }

  @Get('recent-gifts')
  @ApiOperation({ summary: '[ADMIN] Xem recent gifts của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng mỗi trang (mặc định: 20)',
  })
  @ApiOkResponse({ description: 'Danh sách quà nhận gần đây' })
  getRecentGifts(@Param('user_id') userId: string, @Query() query: BaseQueryDto) {
    const page = query?.page && query.page > 0 ? query.page : 1;
    const limit = query?.limit && query.limit > 0 ? query.limit : 20;
    return this.giftWallService.getRecentGifts(userId, page, limit);
  }

  @Get('inventory')
  @ApiOperation({ summary: '[ADMIN] Xem inventory của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng mỗi trang (mặc định: 20)',
  })
  @ApiOkResponse({ description: 'Danh sách vật phẩm trong inventory' })
  getInventory(@Param('user_id') userId: string, @Query() query: BaseQueryDto) {
    return this.inventoryService.getInventory(userId, query);
  }

  @Get()
  @ApiOperation({ summary: '[ADMIN] Xem danh sách gifts của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng mỗi trang (mặc định: 20)',
  })
  @ApiOkResponse({ description: 'Danh sách quà tặng với pagination' })
  findAll(@Param('user_id') userId: string, @Query() query: BaseQueryDto) {
    return this.crudService.findAll(userId, query);
  }
}
