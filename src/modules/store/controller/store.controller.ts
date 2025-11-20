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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { StoreDto, CreateStoreItemDto, UpdateStoreItemDto } from '../dto/store.dto';
import { StoreService } from '../service/store.service';

/**
 * User Store Controller - Yêu cầu authentication
 * User chỉ có thể quản lý store của chính mình
 */
@ApiTags('Store (User)')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard('account-auth'))
@ApiBearerAuth('JWT-auth')
@Controller('store')
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
  getStore(@Req() req: any, @Query() query: BaseQueryDto) {
    const userId = req.user.id;
    return this.store.getStore(userId, query);
  }

  @Post('items')
  @ApiOperation({ summary: 'Thêm item vào store của user hiện tại' })
  @ApiBody({ type: CreateStoreItemDto })
  addStoreItem(@Req() req: any, @Body() dto: CreateStoreItemDto) {
    const userId = req.user.id;
    return this.store.addStoreItem(userId, dto);
  }

  @Patch('items/:item_id')
  @ApiOperation({ summary: 'Cập nhật item trong store của user hiện tại' })
  @ApiBody({ type: UpdateStoreItemDto })
  updateStoreItem(
    @Req() req: any,
    @Param('item_id') itemId: string,
    @Body() dto: UpdateStoreItemDto,
  ) {
    const userId = req.user.id;
    return this.store.updateStoreItem(userId, itemId, dto);
  }

  @Delete('items/:item_id')
  @ApiOperation({ summary: 'Xóa item trong store của user hiện tại' })
  deleteStoreItem(@Req() req: any, @Param('item_id') itemId: string) {
    const userId = req.user.id;
    return this.store.deleteStoreItem(userId, itemId);
  }
}
