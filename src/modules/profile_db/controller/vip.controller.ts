import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { BaseQueryDto } from '../dto/base-query.dto';
import { CreateVipStatusDto, UpdateVipStatusDto } from '../dto/vip.dto';
import { VipService } from '../service/vip.service';

@ApiTags('VIP')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('profile/:user_id/vip-status')
export class VipController {
  constructor(private readonly vip: VipService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy trạng thái VIP của user' })
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
  @ApiOperation({ summary: 'Tạo trạng thái VIP cho user' })
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
  createVipStatus(@Param('user_id') userId: string, @Body() dto: CreateVipStatusDto) {
    return this.vip.createVipStatus(userId, dto);
  }

  @Patch()
  @ApiOperation({ summary: 'Cập nhật trạng thái VIP' })
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
  updateVipStatus(@Param('user_id') userId: string, @Body() dto: UpdateVipStatusDto) {
    return this.vip.updateVipStatus(userId, dto);
  }

  @Delete()
  @ApiOperation({ summary: 'Xóa trạng thái VIP' })
  deleteVipStatus(@Param('user_id') userId: string) {
    return this.vip.deleteVipStatus(userId);
  }
}