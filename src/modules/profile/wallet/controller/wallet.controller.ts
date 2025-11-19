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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';
import { WalletService } from '../service/wallet.service';
import { WalletSummaryService } from '../service/wallet-summary.service';
import { RechargeService } from '../service/recharge.service';
import { SubscriptionService } from '../service/subscription.service';
import { TransactionService } from '../service/transaction.service';
import { ConvertService } from '../service/convert.service';
import { DepositService } from '../service/deposit.service';
import { IapService } from '../service/iap.service';
import { CreateWalletDto, UpdateWalletDto } from '../dto/wallet.dto';
import {
  WalletSummaryResponseDto,
  RechargePackageDto,
  MonthlyCardDto,
  CheckoutRechargeDto,
  CheckoutRechargeResponseDto,
  PurchaseSubscriptionDto,
  PurchaseSubscriptionResponseDto,
  SubscriptionDetailsResponseDto,
  TransactionHistoryItemDto,
  ConvertVexToDiamondDto,
  ConvertVexToDiamondResponseDto,
  CreateDepositResponseDto,
  WithdrawVexDto,
  WithdrawVexResponseDto,
  DepositInfoResponseDto,
  IapVerifyReceiptDto,
  IapVerifyReceiptResponseDto,
} from '../dto/diamond-wallet.dto';
import { IPaginatedResponse } from '../../../../common/interfaces/pagination.interface';

@ApiTags('Wallet')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('users/:user_id/wallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly walletSummaryService: WalletSummaryService,
    private readonly rechargeService: RechargeService,
    private readonly subscriptionService: SubscriptionService,
    private readonly transactionService: TransactionService,
    private readonly convertService: ConvertService,
    private readonly depositService: DepositService,
    private readonly iapService: IapService,
  ) {}

  // ========== CRUD Basic Wallet ==========
  @Get()
  @ApiOperation({ summary: 'Lấy thông tin ví của user' })
  @ApiParam({ name: 'user_id', description: 'User ID' })
  @ApiOkResponse({ description: 'Ví của user theo schema Prisma' })
  getWallet(@Param('user_id') userId: string, @Query() query: BaseQueryDto) {
    return this.walletService.getWallet(userId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo ví cho user' })
  @ApiParam({ name: 'user_id', description: 'User ID' })
  @ApiBody({ type: CreateWalletDto })
  @ApiCreatedResponse({ description: 'Ví được tạo theo schema Prisma' })
  createWallet(@Param('user_id') userId: string, @Body() dto: CreateWalletDto) {
    return this.walletService.createWallet(userId, dto);
  }

  @Patch()
  @ApiOperation({ summary: 'Cập nhật ví của user' })
  @ApiParam({ name: 'user_id', description: 'User ID' })
  @ApiBody({ type: UpdateWalletDto })
  @ApiOkResponse({ description: 'Ví sau cập nhật theo schema Prisma' })
  updateWallet(@Param('user_id') userId: string, @Body() dto: UpdateWalletDto) {
    return this.walletService.updateWallet(userId, dto);
  }

  @Delete()
  @ApiOperation({ summary: 'Xóa ví của user' })
  @ApiParam({ name: 'user_id', description: 'User ID' })
  deleteWallet(@Param('user_id') userId: string) {
    return this.walletService.deleteWallet(userId);
  }

  // ========== Diamond Wallet Features ==========
  @Get('summary')
  @ApiOperation({ summary: 'Lấy số dư Kim Cương, VEX và trạng thái Thẻ Tháng' })
  @ApiParam({ name: 'user_id', description: 'User ID' })
  @ApiOkResponse({ type: WalletSummaryResponseDto })
  getWalletSummary(@Param('user_id') userId: string): Promise<WalletSummaryResponseDto> {
    return this.walletSummaryService.getWalletSummary(userId);
  }

  @Get('recharge/packages')
  @ApiOperation({ summary: 'Lấy danh sách gói nạp Kim Cương' })
  @ApiParam({ name: 'user_id', description: 'User ID' })
  @ApiOkResponse({ type: [RechargePackageDto] })
  getRechargePackages(@Param('user_id') userId: string): Promise<RechargePackageDto[]> {
    return this.rechargeService.getRechargePackages();
  }

  @Get('recharge/monthly-cards')
  @ApiOperation({ summary: 'Lấy danh sách Thẻ Tháng (Monthly Cards)' })
  @ApiParam({ name: 'user_id', description: 'User ID' })
  @ApiOkResponse({ type: [MonthlyCardDto] })
  getMonthlyCards(@Param('user_id') userId: string): Promise<MonthlyCardDto[]> {
    return this.subscriptionService.getMonthlyCards();
  }

  @Post('recharge/checkout')
  @ApiOperation({ summary: 'Khởi tạo giao dịch mua gói nạp Kim Cương' })
  @ApiParam({ name: 'user_id', description: 'User ID' })
  @ApiBody({ type: CheckoutRechargeDto })
  @ApiCreatedResponse({ type: CheckoutRechargeResponseDto })
  checkoutRecharge(
    @Param('user_id') userId: string,
    @Body() dto: CheckoutRechargeDto,
  ): Promise<CheckoutRechargeResponseDto> {
    return this.rechargeService.checkoutRecharge(userId, dto);
  }

  @Post('subscription/purchase')
  @ApiOperation({ summary: 'Đăng ký Thẻ Tháng' })
  @ApiParam({ name: 'user_id', description: 'User ID' })
  @ApiBody({ type: PurchaseSubscriptionDto })
  @ApiCreatedResponse({ type: PurchaseSubscriptionResponseDto })
  purchaseSubscription(
    @Param('user_id') userId: string,
    @Body() dto: PurchaseSubscriptionDto,
  ): Promise<PurchaseSubscriptionResponseDto> {
    return this.subscriptionService.purchaseSubscription(userId, dto);
  }

  @Get('subscription/details')
  @ApiOperation({ summary: 'Lấy chi tiết đăng ký Thẻ Tháng' })
  @ApiParam({ name: 'user_id', description: 'User ID' })
  @ApiOkResponse({ type: SubscriptionDetailsResponseDto })
  getSubscriptionDetails(
    @Param('user_id') userId: string,
  ): Promise<SubscriptionDetailsResponseDto> {
    return this.subscriptionService.getSubscriptionDetails(userId);
  }

  @Get('transactions/history')
  @ApiOperation({ summary: 'Lấy lịch sử giao dịch (nạp, rút, quà tặng)' })
  @ApiParam({ name: 'user_id', description: 'User ID' })
  @ApiOkResponse({ type: [TransactionHistoryItemDto] })
  getTransactionHistory(
    @Param('user_id') userId: string,
    @Query() query: BaseQueryDto,
  ): Promise<IPaginatedResponse<TransactionHistoryItemDto>> {
    return this.transactionService.getTransactionHistory(userId, query);
  }

  @Post('vex/convert')
  @ApiOperation({ summary: 'Chuyển đổi VEX sang Kim Cương' })
  @ApiParam({ name: 'user_id', description: 'User ID' })
  @ApiBody({ type: ConvertVexToDiamondDto })
  @ApiOkResponse({ type: ConvertVexToDiamondResponseDto })
  convertVexToDiamond(
    @Param('user_id') userId: string,
    @Body() dto: ConvertVexToDiamondDto,
  ): Promise<ConvertVexToDiamondResponseDto> {
    return this.convertService.convertVexToDiamond(userId, dto);
  }

  @Post('deposit/create')
  @ApiOperation({ summary: 'Tạo địa chỉ Deposit, trả về QR Code và địa chỉ ví' })
  @ApiParam({ name: 'user_id', description: 'User ID' })
  @ApiCreatedResponse({ type: CreateDepositResponseDto })
  createDeposit(@Param('user_id') userId: string): Promise<CreateDepositResponseDto> {
    return this.depositService.createDeposit(userId);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Khởi tạo yêu cầu rút VEX' })
  @ApiParam({ name: 'user_id', description: 'User ID' })
  @ApiBody({ type: WithdrawVexDto })
  @ApiCreatedResponse({ type: WithdrawVexResponseDto })
  withdrawVex(
    @Param('user_id') userId: string,
    @Body() dto: WithdrawVexDto,
  ): Promise<WithdrawVexResponseDto> {
    return this.depositService.withdrawVex(userId, dto);
  }

  @Get('deposit/info')
  @ApiOperation({ summary: 'Lấy thông tin địa chỉ Deposit hiện tại' })
  @ApiParam({ name: 'user_id', description: 'User ID' })
  @ApiOkResponse({ type: DepositInfoResponseDto })
  getDepositInfo(@Param('user_id') userId: string): Promise<DepositInfoResponseDto> {
    return this.depositService.getDepositInfo(userId);
  }

  @Post('iap/verify-receipt')
  @ApiOperation({ summary: 'Xác minh giao dịch In-App Purchase' })
  @ApiParam({ name: 'user_id', description: 'User ID' })
  @ApiBody({ type: IapVerifyReceiptDto })
  @ApiOkResponse({ type: IapVerifyReceiptResponseDto })
  verifyIapReceipt(
    @Param('user_id') userId: string,
    @Body() dto: IapVerifyReceiptDto,
  ): Promise<IapVerifyReceiptResponseDto> {
    return this.iapService.verifyIapReceipt(userId, dto);
  }
}
