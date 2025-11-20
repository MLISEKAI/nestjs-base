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
  ApiParam,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { WalletService } from '../service/wallet.service';
import { WalletSummaryService } from '../service/wallet-summary.service';
import { RechargeService } from '../service/recharge.service';
import { SubscriptionService } from '../service/subscription.service';
import { TransactionService } from '../service/transaction.service';
import { ConvertService } from '../service/convert.service';
import { DepositService } from '../service/deposit.service';
import { IapService } from '../service/iap.service';
import { TransferService } from '../service/transfer.service';
import { PaymentMethodService } from '../service/payment-method.service';
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
  CreateDepositDto,
  CreateDepositResponseDto,
  WithdrawVexDto,
  WithdrawVexResponseDto,
  DepositInfoResponseDto,
  IapVerifyReceiptDto,
  IapVerifyReceiptResponseDto,
  TransferVexDto,
  TransferVexResponseDto,
  UpdateDepositNetworkDto,
  PaymentMethodDto,
} from '../dto/diamond-wallet.dto';
import { IPaginatedResponse } from '../../../common/interfaces/pagination.interface';

/**
 * User Wallet Controller - Yêu cầu authentication
 * User chỉ có thể xem/sửa wallet của chính mình
 */
@ApiTags('Wallet (User)')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard('account-auth'))
@ApiBearerAuth('JWT-auth')
@Controller('wallet')
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
    private readonly transferService: TransferService,
    private readonly paymentMethodService: PaymentMethodService,
  ) {}

  // ========== CRUD Basic Wallet ==========
  @Get()
  @ApiOperation({ summary: 'Lấy thông tin ví của user hiện tại' })
  @ApiOkResponse({ description: 'Ví của user theo schema Prisma' })
  getWallet(@Req() req: any, @Query() query: BaseQueryDto) {
    const userId = req.user.id;
    return this.walletService.getWallet(userId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo ví cho user hiện tại' })
  @ApiBody({ type: CreateWalletDto })
  @ApiCreatedResponse({ description: 'Ví được tạo theo schema Prisma' })
  createWallet(@Req() req: any, @Body() dto: CreateWalletDto) {
    const userId = req.user.id;
    return this.walletService.createWallet(userId, dto);
  }

  @Patch()
  @ApiOperation({ summary: 'Cập nhật ví của user hiện tại' })
  @ApiBody({ type: UpdateWalletDto })
  @ApiOkResponse({ description: 'Ví sau cập nhật theo schema Prisma' })
  updateWallet(@Req() req: any, @Body() dto: UpdateWalletDto) {
    const userId = req.user.id;
    return this.walletService.updateWallet(userId, dto);
  }

  @Delete()
  @ApiOperation({ summary: 'Xóa ví của user hiện tại' })
  deleteWallet(@Req() req: any) {
    const userId = req.user.id;
    return this.walletService.deleteWallet(userId);
  }

  // ========== Diamond Wallet Features ==========
  @Get('summary')
  @ApiOperation({ summary: 'Lấy số dư Kim Cương, VEX và trạng thái Thẻ Tháng của user hiện tại' })
  @ApiOkResponse({ type: WalletSummaryResponseDto })
  getWalletSummary(@Req() req: any): Promise<WalletSummaryResponseDto> {
    const userId = req.user.id;
    return this.walletSummaryService.getWalletSummary(userId);
  }

  @Get('recharge/packages')
  @ApiOperation({ summary: 'Lấy danh sách gói nạp Kim Cương' })
  @ApiOkResponse({ type: [RechargePackageDto] })
  getRechargePackages(): Promise<RechargePackageDto[]> {
    return this.rechargeService.getRechargePackages();
  }

  @Get('recharge/monthly-cards')
  @ApiOperation({ summary: 'Lấy danh sách Thẻ Tháng (Monthly Cards)' })
  @ApiOkResponse({ type: [MonthlyCardDto] })
  getMonthlyCards(): Promise<MonthlyCardDto[]> {
    return this.subscriptionService.getMonthlyCards();
  }

  @Post('recharge/checkout')
  @ApiOperation({ summary: 'Khởi tạo giao dịch mua gói nạp Kim Cương' })
  @ApiBody({ type: CheckoutRechargeDto })
  @ApiCreatedResponse({ type: CheckoutRechargeResponseDto })
  checkoutRecharge(
    @Req() req: any,
    @Body() dto: CheckoutRechargeDto,
  ): Promise<CheckoutRechargeResponseDto> {
    const userId = req.user.id;
    return this.rechargeService.checkoutRecharge(userId, dto);
  }

  @Post('subscription/purchase')
  @ApiOperation({ summary: 'Đăng ký Thẻ Tháng' })
  @ApiBody({ type: PurchaseSubscriptionDto })
  @ApiCreatedResponse({ type: PurchaseSubscriptionResponseDto })
  purchaseSubscription(
    @Req() req: any,
    @Body() dto: PurchaseSubscriptionDto,
  ): Promise<PurchaseSubscriptionResponseDto> {
    const userId = req.user.id;
    return this.subscriptionService.purchaseSubscription(userId, dto);
  }

  @Get('subscription/details')
  @ApiOperation({ summary: 'Lấy chi tiết đăng ký Thẻ Tháng của user hiện tại' })
  @ApiOkResponse({ type: SubscriptionDetailsResponseDto })
  getSubscriptionDetails(@Req() req: any): Promise<SubscriptionDetailsResponseDto> {
    const userId = req.user.id;
    return this.subscriptionService.getSubscriptionDetails(userId);
  }

  @Get('transactions/history')
  @ApiOperation({ summary: 'Lấy lịch sử giao dịch (nạp, rút, quà tặng) của user hiện tại' })
  @ApiOkResponse({ type: [TransactionHistoryItemDto] })
  getTransactionHistory(
    @Req() req: any,
    @Query() query: BaseQueryDto,
  ): Promise<IPaginatedResponse<TransactionHistoryItemDto>> {
    const userId = req.user.id;
    return this.transactionService.getTransactionHistory(userId, query);
  }

  @Post('vex/convert')
  @ApiOperation({ summary: 'Chuyển đổi VEX sang Kim Cương' })
  @ApiBody({ type: ConvertVexToDiamondDto })
  @ApiOkResponse({ type: ConvertVexToDiamondResponseDto })
  convertVexToDiamond(
    @Req() req: any,
    @Body() dto: ConvertVexToDiamondDto,
  ): Promise<ConvertVexToDiamondResponseDto> {
    const userId = req.user.id;
    return this.convertService.convertVexToDiamond(userId, dto);
  }

  @Post('deposit/create')
  @ApiOperation({ summary: 'Tạo địa chỉ Deposit, trả về QR Code và địa chỉ ví' })
  @ApiBody({ type: CreateDepositDto, required: false })
  @ApiCreatedResponse({ type: CreateDepositResponseDto })
  createDeposit(
    @Req() req: any,
    @Body() dto?: CreateDepositDto,
  ): Promise<CreateDepositResponseDto> {
    const userId = req.user.id;
    return this.depositService.createDeposit(userId, dto);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Khởi tạo yêu cầu rút VEX' })
  @ApiBody({ type: WithdrawVexDto })
  @ApiCreatedResponse({ type: WithdrawVexResponseDto })
  withdrawVex(
    @Req() req: any,
    @Body() dto: WithdrawVexDto,
  ): Promise<WithdrawVexResponseDto> {
    const userId = req.user.id;
    return this.depositService.withdrawVex(userId, dto);
  }

  @Get('deposit/info')
  @ApiOperation({ summary: 'Lấy thông tin địa chỉ Deposit hiện tại của user hiện tại' })
  @ApiOkResponse({ type: DepositInfoResponseDto })
  getDepositInfo(@Req() req: any): Promise<DepositInfoResponseDto> {
    const userId = req.user.id;
    return this.depositService.getDepositInfo(userId);
  }

  @Post('iap/verify-receipt')
  @ApiOperation({ summary: 'Xác minh giao dịch In-App Purchase' })
  @ApiBody({ type: IapVerifyReceiptDto })
  @ApiOkResponse({ type: IapVerifyReceiptResponseDto })
  verifyIapReceipt(
    @Req() req: any,
    @Body() dto: IapVerifyReceiptDto,
  ): Promise<IapVerifyReceiptResponseDto> {
    const userId = req.user.id;
    return this.iapService.verifyIapReceipt(userId, dto);
  }

  // ========== Transfer VEX ==========
  @Post('vex/transfer')
  @ApiOperation({ summary: 'Chuyển VEX từ user hiện tại sang user khác' })
  @ApiBody({ type: TransferVexDto })
  @ApiCreatedResponse({ type: TransferVexResponseDto })
  transferVex(
    @Req() req: any,
    @Body() dto: TransferVexDto,
  ): Promise<TransferVexResponseDto> {
    const userId = req.user.id;
    return this.transferService.transferVex(userId, dto);
  }

  // ========== Update Deposit Network ==========
  @Patch('deposit/network')
  @ApiOperation({ summary: 'Cập nhật network cho deposit address (Polygon, BSC, Ethereum, etc.)' })
  @ApiBody({ type: UpdateDepositNetworkDto })
  @ApiOkResponse({ type: CreateDepositResponseDto })
  updateDepositNetwork(
    @Req() req: any,
    @Body() dto: UpdateDepositNetworkDto,
  ): Promise<CreateDepositResponseDto> {
    const userId = req.user.id;
    return this.depositService.updateDepositNetwork(userId, dto);
  }

  // ========== Payment Methods ==========
  @Get('payment-methods')
  @ApiOperation({ summary: 'Lấy danh sách phương thức thanh toán (Visa, Dolfie, etc.)' })
  @ApiOkResponse({ type: [PaymentMethodDto] })
  getPaymentMethods(): Promise<PaymentMethodDto[]> {
    return this.paymentMethodService.getPaymentMethods();
  }
}
