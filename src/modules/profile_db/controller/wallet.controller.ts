import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { BaseQueryDto } from '../dto/base-query.dto';
import { CreateWalletDto, UpdateWalletDto } from '../dto/wallet.dto';
import { WalletService } from '../service/wallet.service';

@ApiTags('Wallet')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('profile/:user_id/wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy thông tin ví của user' })
  @ApiOkResponse({
    description: 'Ví của user theo schema Prisma',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'wallet-1' },
        user_id: { type: 'string', example: 'user-1' },
        balance: { type: 'number', example: 1000 },
        currency: { type: 'string', example: 'gem' },
      },
    },
  })
  getWallet(@Param('user_id') userId: string, @Query() query: BaseQueryDto) {
    return this.wallet.getWallet(userId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo ví cho user' })
  @ApiBody({ type: CreateWalletDto })
  @ApiCreatedResponse({
    description: 'Ví được tạo theo schema Prisma',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'wallet-1' },
        user_id: { type: 'string', example: 'user-1' },
        balance: { type: 'number', example: 0 },
        currency: { type: 'string', example: 'gem' },
      },
    },
  })
  createWallet(@Param('user_id') userId: string, @Body() dto: CreateWalletDto) {
    return this.wallet.createWallet(userId, dto);
  }

  @Patch()
  @ApiOperation({ summary: 'Cập nhật ví của user' })
  @ApiBody({ type: UpdateWalletDto })
  @ApiOkResponse({
    description: 'Ví sau cập nhật theo schema Prisma',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'wallet-1' },
        user_id: { type: 'string', example: 'user-1' },
        balance: { type: 'number', example: 1500 },
        currency: { type: 'string', example: 'gold' },
      },
    },
  })
  updateWallet(@Param('user_id') userId: string, @Body() dto: UpdateWalletDto) {
    return this.wallet.updateWallet(userId, dto);
  }

  @Delete()
  @ApiOperation({ summary: 'Xóa ví của user' })
  deleteWallet(@Param('user_id') userId: string) {
    return this.wallet.deleteWallet(userId);
  }
}