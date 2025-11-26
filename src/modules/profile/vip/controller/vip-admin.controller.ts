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
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../../../../common/guards/admin.guard';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';
import { CreateVipStatusDto, UpdateVipStatusDto } from '../dto/vip.dto';
import { VipService } from '../service/vip.service';

/**
 * Admin VIP Controller - Chỉ admin mới truy cập được
 * Dùng để quản lý VIP status của bất kỳ user nào
 */
@ApiTags('VIP (Admin)')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard('account-auth'), AdminGuard)
@ApiBearerAuth('JWT-auth')
@Controller('admin/users/:user_id/vip-status')
export class VipAdminController {
  constructor(private readonly vip: VipService) {}

  @Get()
  @ApiOperation({ summary: '[ADMIN] Lấy trạng thái VIP của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiOkResponse({
    description: 'VIP status theo schema Prisma',
    schema: {
      type: 'object',
      properties: {
        id: { example: 'vip-1' },
        user_id: { example: 'user-1' },
        is_vip: { example: true },
        expiry: { example: '2025-12-31T00:00:00.000Z' },
      },
    },
  })
  getVipStatus(@Param('user_id') userId: string, @Query() query: BaseQueryDto) {
    return this.vip.getVipStatus(userId, query);
  }

  @Post()
  @ApiOperation({ summary: '[ADMIN] Tạo trạng thái VIP cho user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user' })
  @ApiBody({ type: CreateVipStatusDto })
  @ApiCreatedResponse({
    description: 'VIP status được tạo theo schema Prisma',
  })
  createVipStatus(@Param('user_id') userId: string, @Body() dto: CreateVipStatusDto) {
    return this.vip.createVipStatus(userId, dto);
  }

  @Patch()
  @ApiOperation({ summary: '[ADMIN] Cập nhật trạng thái VIP của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user' })
  @ApiBody({ type: UpdateVipStatusDto })
  @ApiOkResponse({
    description: 'VIP status sau cập nhật theo schema Prisma',
  })
  updateVipStatus(@Param('user_id') userId: string, @Body() dto: UpdateVipStatusDto) {
    return this.vip.updateVipStatus(userId, dto);
  }

  @Delete()
  @ApiOperation({ summary: '[ADMIN] Xóa trạng thái VIP của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user' })
  deleteVipStatus(@Param('user_id') userId: string) {
    return this.vip.deleteVipStatus(userId);
  }
}
