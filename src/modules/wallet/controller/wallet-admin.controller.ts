// Import các decorator và class từ NestJS để tạo controller
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
// Import các decorator từ Swagger để tạo API documentation
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
// Import AuthGuard từ Passport để xác thực JWT token
import { AuthGuard } from '@nestjs/passport';
// Import AdminGuard để kiểm tra quyền admin
import { AdminGuard } from '../../../common/guards/admin.guard';
// Import BaseQueryDto cho pagination
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
// Import các services để xử lý business logic
import { WalletService } from '../service/wallet.service';
import { WalletSummaryService } from '../service/wallet-summary.service';
import { TransactionService } from '../service/transaction.service';
// Import các DTO để validate và type-check dữ liệu
import { CreateWalletDto, UpdateWalletDto } from '../dto/wallet.dto';
import {
  WalletSummaryResponseDto,
  TransactionHistoryItemDto,
  TransactionHistoryResponseDto,
} from '../dto/diamond-wallet.dto';

/**
 * @ApiTags('Wallet (Admin)') - Nhóm các endpoints này trong Swagger UI với tag "Wallet (Admin)"
 * @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
 *   - transform: true - Tự động transform dữ liệu
 *   - whitelist: true - Chỉ giữ lại các properties được định nghĩa trong DTO
 * @UseGuards(AuthGuard('account-auth'), AdminGuard) - Yêu cầu authentication và admin role
 * @ApiBearerAuth('JWT-auth') - Yêu cầu JWT token trong header
 * @Controller('admin/users/:user_id/wallet') - Định nghĩa base route là /admin/users/:user_id/wallet
 * WalletAdminController - Controller xử lý các HTTP requests liên quan đến wallet management (admin only)
 *
 * Chức năng chính:
 * - CRUD wallet của bất kỳ user nào (admin only)
 * - Xem wallet summary và transaction history của bất kỳ user nào
 *
 * Lưu ý:
 * - Chỉ admin mới có quyền truy cập các endpoints này
 * - Có thể quản lý wallet của bất kỳ user nào (không chỉ của chính mình)
 */
@ApiTags('Wallet (Admin)')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard('account-auth'), AdminGuard)
@ApiBearerAuth('JWT-auth')
@Controller('admin/users/:user_id/wallet')
export class WalletAdminController {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject các services khi tạo instance của controller
   */
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
  @ApiOperation({
    summary: '[ADMIN] Lấy số dư Kim Cương, VEX và trạng thái Thẻ Tháng của user bất kỳ',
  })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiOkResponse({ type: WalletSummaryResponseDto })
  getWalletSummary(@Param('user_id') userId: string): Promise<WalletSummaryResponseDto> {
    return this.walletSummaryService.getWalletSummary(userId);
  }

  @Get('transactions/history')
  @ApiOperation({ summary: '[ADMIN] Lấy lịch sử giao dịch của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiOkResponse({ type: TransactionHistoryResponseDto })
  getTransactionHistory(
    @Param('user_id') userId: string,
    @Query() query: BaseQueryDto,
  ): Promise<TransactionHistoryResponseDto> {
    return this.transactionService.getTransactionHistory(userId, query);
  }
}
