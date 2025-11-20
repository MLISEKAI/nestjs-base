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
  ApiParam,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../../../../common/guards/admin.guard';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';
import { WalletService } from '../service/wallet.service';
import { WalletSummaryService } from '../service/wallet-summary.service';
import { TransactionService } from '../service/transaction.service';
import { CreateWalletDto, UpdateWalletDto } from '../dto/wallet.dto';
import {
  WalletSummaryResponseDto,
  TransactionHistoryItemDto,
} from '../dto/diamond-wallet.dto';
import { IPaginatedResponse } from '../../../../common/interfaces/pagination.interface';

/**
 * Admin Wallet Controller - Chỉ admin mới truy cập được
 * Dùng để quản lý wallet của bất kỳ user nào
 */
@ApiTags('Wallet (Admin)')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard('account-auth'), AdminGuard)
@ApiBearerAuth('JWT-auth')
@Controller('admin/users/:user_id/wallet')
export class WalletAdminController {
  constructor(
    private readonly walletService: WalletService,
    private readonly walletSummaryService: WalletSummaryService,
    private readonly transactionService: TransactionService,
  ) {}

  @Get()
  @ApiOperation({ summary: '[ADMIN] Lấy thông tin ví của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiOkResponse({ description: 'Ví của user theo schema Prisma' })
  getWallet(@Param('user_id') userId: string, @Query() query: BaseQueryDto) {
    return this.walletService.getWallet(userId, query);
  }

  @Post()
  @ApiOperation({ summary: '[ADMIN] Tạo ví cho user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user' })
  @ApiBody({ type: CreateWalletDto })
  @ApiCreatedResponse({ description: 'Ví được tạo theo schema Prisma' })
  createWallet(@Param('user_id') userId: string, @Body() dto: CreateWalletDto) {
    return this.walletService.createWallet(userId, dto);
  }

  @Patch()
  @ApiOperation({ summary: '[ADMIN] Cập nhật ví của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user' })
  @ApiBody({ type: UpdateWalletDto })
  @ApiOkResponse({ description: 'Ví sau cập nhật theo schema Prisma' })
  updateWallet(@Param('user_id') userId: string, @Body() dto: UpdateWalletDto) {
    return this.walletService.updateWallet(userId, dto);
  }

  @Delete()
  @ApiOperation({ summary: '[ADMIN] Xóa ví của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user' })
  deleteWallet(@Param('user_id') userId: string) {
    return this.walletService.deleteWallet(userId);
  }

  @Get('summary')
  @ApiOperation({ summary: '[ADMIN] Lấy số dư Kim Cương, VEX và trạng thái Thẻ Tháng của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiOkResponse({ type: WalletSummaryResponseDto })
  getWalletSummary(@Param('user_id') userId: string): Promise<WalletSummaryResponseDto> {
    return this.walletSummaryService.getWalletSummary(userId);
  }

  @Get('transactions/history')
  @ApiOperation({ summary: '[ADMIN] Lấy lịch sử giao dịch của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiOkResponse({ type: [TransactionHistoryItemDto] })
  getTransactionHistory(
    @Param('user_id') userId: string,
    @Query() query: BaseQueryDto,
  ): Promise<IPaginatedResponse<TransactionHistoryItemDto>> {
    return this.transactionService.getTransactionHistory(userId, query);
  }
}

