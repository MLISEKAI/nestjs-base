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
  ApiCreatedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';
import { CreateVipStatusDto, UpdateVipStatusDto } from '../dto/vip.dto';
import { VipService } from '../service/vip.service';
import type { AuthenticatedRequest } from '../../../../common/interfaces/request.interface';

/**
 * User VIP Controller - Yêu cầu authentication
 * User chỉ có thể xem/sửa VIP status của chính mình
 */
@ApiTags('VIP (User)')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard('account-auth'))
@ApiBearerAuth('JWT-auth')
@Controller('vip-status')
export class VipController {
  constructor(private readonly vip: VipService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy trạng thái VIP của user hiện tại' })
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
  getVipStatus(@Req() req: AuthenticatedRequest, @Query() query: BaseQueryDto) {
    const user_id = req.user.id;
    return this.vip.getVipStatus(user_id, query);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo trạng thái VIP cho user hiện tại' })
  @ApiBody({ type: CreateVipStatusDto })
  @ApiCreatedResponse({
    description: 'VIP status được tạo theo schema Prisma',
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
  createVipStatus(@Req() req: AuthenticatedRequest, @Body() dto: CreateVipStatusDto) {
    const user_id = req.user.id;
    return this.vip.createVipStatus(user_id, dto);
  }

  @Patch()
  @ApiOperation({ summary: 'Cập nhật trạng thái VIP của user hiện tại' })
  @ApiBody({ type: UpdateVipStatusDto })
  @ApiOkResponse({
    description: 'VIP status sau cập nhật theo schema Prisma',
    schema: {
      type: 'object',
      properties: {
        id: { example: 'vip-1' },
        user_id: { example: 'user-1' },
        is_vip: { example: false },
        expiry: { example: '2026-12-31T00:00:00.000Z' },
      },
    },
  })
  updateVipStatus(@Req() req: AuthenticatedRequest, @Body() dto: UpdateVipStatusDto) {
    const user_id = req.user.id;
    return this.vip.updateVipStatus(user_id, dto);
  }

  @Delete()
  @ApiOperation({ summary: 'Xóa trạng thái VIP của user hiện tại' })
  deleteVipStatus(@Req() req: AuthenticatedRequest) {
    const user_id = req.user.id;
    return this.vip.deleteVipStatus(user_id);
  }
}
