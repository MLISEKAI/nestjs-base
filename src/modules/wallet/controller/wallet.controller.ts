import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
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
  VexBalanceResponseDto,
  DiamondBalanceResponseDto,
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
@ApiUnauthorizedResponse({ description: 'Unauthorized - Token không hợp lệ hoặc đã hết hạn' })
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

  // ========== 1. CRUD Basic Wallet ==========
  @Get()
  @ApiOperation({
    summary: 'Lấy thông tin ví của user hiện tại',
    description:
      'Lấy danh sách tất cả các ví (wallet) của user hiện tại. Hỗ trợ pagination và filter theo currency (diamond, vex).',
  })
  @ApiOkResponse({
    description: 'Danh sách ví của user theo schema Prisma với pagination',
  })
  getWallet(@Req() req: any, @Query() query: BaseQueryDto) {
    const userId = req.user.id;
    return this.walletService.getWallet(userId, query);
  }

  @Post()
  @ApiOperation({
    summary: 'Tạo ví mới cho user hiện tại',
    description:
      'Tạo một ví mới với currency được chỉ định (diamond, vex). Nếu ví với currency đó đã tồn tại sẽ trả về lỗi.',
  })
  @ApiBody({ type: CreateWalletDto })
  @ApiCreatedResponse({
    description: 'Ví mới được tạo thành công theo schema Prisma',
  })
  @ApiBadRequestResponse({
    description: 'Bad Request - Ví với currency này đã tồn tại hoặc dữ liệu không hợp lệ',
  })
  createWallet(@Req() req: any, @Body() dto: CreateWalletDto) {
    const userId = req.user.id;
    return this.walletService.createWallet(userId, dto);
  }

  @Patch()
  @ApiOperation({
    summary: 'Cập nhật thông tin ví của user hiện tại',
    description: 'Cập nhật số dư (balance) của ví. Chỉ có thể cập nhật ví của chính mình.',
  })
  @ApiBody({ type: UpdateWalletDto })
  @ApiOkResponse({
    description: 'Ví sau khi cập nhật thành công theo schema Prisma',
  })
  @ApiBadRequestResponse({ description: 'Bad Request - Dữ liệu không hợp lệ hoặc số dư không đủ' })
  @ApiNotFoundResponse({ description: 'Not Found - Không tìm thấy ví cần cập nhật' })
  updateWallet(@Req() req: any, @Body() dto: UpdateWalletDto) {
    const userId = req.user.id;
    return this.walletService.updateWallet(userId, dto);
  }

  @Delete()
  @ApiOperation({
    summary: 'Xóa ví của user hiện tại',
    description:
      'Xóa một ví cụ thể. Lưu ý: Chỉ nên xóa ví khi không còn giao dịch nào liên quan. Hệ thống sẽ kiểm tra trước khi xóa.',
  })
  @ApiOkResponse({ description: 'Xóa ví thành công' })
  @ApiBadRequestResponse({
    description: 'Bad Request - Không thể xóa ví do còn giao dịch liên quan',
  })
  @ApiNotFoundResponse({ description: 'Not Found - Không tìm thấy ví cần xóa' })
  deleteWallet(@Req() req: any) {
    const userId = req.user.id;
    return this.walletService.deleteWallet(userId);
  }

  // ========== 2. Wallet Balance & Summary ==========
  @Get('summary')
  @ApiOperation({
    summary: 'Lấy tổng quan số dư và trạng thái',
    description:
      'Lấy tổng quan về số dư Diamond, số dư VEX và trạng thái Monthly Card (active/inactive) của user hiện tại. Đây là endpoint chính để hiển thị dashboard wallet.',
  })
  @ApiOkResponse({
    type: WalletSummaryResponseDto,
    description: 'Thông tin tổng quan về wallet: Diamond balance, VEX balance, Monthly card status',
  })
  getWalletSummary(@Req() req: any): Promise<WalletSummaryResponseDto> {
    const userId = req.user.id;
    return this.walletSummaryService.getWalletSummary(userId);
  }

  @Get('vex/balance')
  @ApiOperation({
    summary: 'Lấy số dư VEX chi tiết',
    description:
      'Lấy số dư VEX với đầy đủ thông tin: số dư hiện tại, giá trị quy đổi sang USD, tỷ giá exchange rate, và giới hạn giao dịch còn lại trong ngày (deposit, withdraw, transfer).',
  })
  @ApiOkResponse({
    type: VexBalanceResponseDto,
    description:
      'Thông tin chi tiết VEX balance: số dư, giá trị USD, tỷ giá, và daily limits còn lại',
  })
  getVexBalance(@Req() req: any): Promise<VexBalanceResponseDto> {
    const userId = req.user.id;
    return this.walletSummaryService.getVexBalance(userId);
  }

  @Get('diamond/balance')
  @ApiOperation({
    summary: 'Lấy số dư Diamond',
    description:
      'Lấy số dư Diamond (Kim Cương) hiện tại của user. Đây là đơn vị tiền tệ chính trong ứng dụng.',
  })
  @ApiOkResponse({
    type: DiamondBalanceResponseDto,
    description: 'Số dư Diamond hiện tại của user',
  })
  getDiamondBalance(@Req() req: any): Promise<DiamondBalanceResponseDto> {
    const userId = req.user.id;
    return this.walletSummaryService.getDiamondBalance(userId);
  }

  // ========== 3. Recharge & Packages ==========
  @Get('recharge/packages')
  @ApiOperation({
    summary: 'Lấy danh sách gói nạp Diamond',
    description:
      'Lấy danh sách tất cả các gói nạp Diamond đang active. Mỗi gói bao gồm: số Diamond, giá tiền, và bonus (nếu có).',
  })
  @ApiOkResponse({
    type: [RechargePackageDto],
    description: 'Danh sách các gói nạp Diamond đang active',
  })
  getRechargePackages(): Promise<RechargePackageDto[]> {
    return this.rechargeService.getRechargePackages();
  }

  @Post('recharge/checkout')
  @ApiOperation({
    summary: 'Khởi tạo giao dịch mua gói nạp Diamond',
    description:
      'Tạo một giao dịch mua gói nạp Diamond. Hệ thống sẽ tạo transaction với status "pending" và trả về transactionId để user có thể thanh toán. Sau khi thanh toán thành công (qua payment gateway), transaction sẽ được cập nhật thành "success" và Diamond sẽ được cộng vào wallet.',
  })
  @ApiBody({ type: CheckoutRechargeDto })
  @ApiCreatedResponse({
    type: CheckoutRechargeResponseDto,
    description:
      'Giao dịch được tạo thành công. Trả về transactionId, amount, status (pending), và paymentUrl (sau khi tích hợp payment gateway)',
  })
  @ApiBadRequestResponse({
    description: 'Bad Request - Gói nạp không tồn tại, không active, hoặc dữ liệu không hợp lệ',
  })
  @ApiNotFoundResponse({
    description: 'Not Found - Không tìm thấy gói nạp với packageId được chỉ định',
  })
  checkoutRecharge(
    @Req() req: any,
    @Body() dto: CheckoutRechargeDto,
  ): Promise<CheckoutRechargeResponseDto> {
    const userId = req.user.id;
    return this.rechargeService.checkoutRecharge(userId, dto);
  }

  // ========== 4. Subscription (Monthly Card) ==========
  @Get('recharge/monthly-cards')
  @ApiOperation({
    summary: 'Lấy danh sách Thẻ Tháng (Monthly Cards)',
    description:
      'Lấy danh sách tất cả các Monthly Card subscription đang active. Mỗi card bao gồm: giá tiền, số Diamond nhận được mỗi ngày, và thời hạn (duration).',
  })
  @ApiOkResponse({
    type: [MonthlyCardDto],
    description: 'Danh sách các Monthly Card đang active',
  })
  getMonthlyCards(): Promise<MonthlyCardDto[]> {
    return this.subscriptionService.getMonthlyCards();
  }

  @Post('subscription/purchase')
  @ApiOperation({
    summary: 'Đăng ký Thẻ Tháng (Monthly Card)',
    description:
      'Đăng ký một Monthly Card subscription. Hệ thống sẽ cập nhật VIP status của user với is_vip = true và expiry date = startDate + duration. User sẽ nhận Diamond mỗi ngày trong thời hạn subscription.',
  })
  @ApiBody({ type: PurchaseSubscriptionDto })
  @ApiCreatedResponse({
    type: PurchaseSubscriptionResponseDto,
    description:
      'Đăng ký thành công. Trả về subscriptionId, status (active), startDate, và nextRenewal date',
  })
  @ApiBadRequestResponse({
    description:
      'Bad Request - Monthly Card không tồn tại, không active, hoặc dữ liệu không hợp lệ',
  })
  @ApiNotFoundResponse({
    description: 'Not Found - Không tìm thấy Monthly Card với cardId được chỉ định',
  })
  purchaseSubscription(
    @Req() req: any,
    @Body() dto: PurchaseSubscriptionDto,
  ): Promise<PurchaseSubscriptionResponseDto> {
    const userId = req.user.id;
    return this.subscriptionService.purchaseSubscription(userId, dto);
  }

  @Get('subscription/details')
  @ApiOperation({
    summary: 'Lấy chi tiết đăng ký Thẻ Tháng',
    description:
      'Lấy thông tin chi tiết về Monthly Card subscription hiện tại của user: subscriptionId, status (active/expired), nextRenewal date, và username.',
  })
  @ApiOkResponse({
    type: SubscriptionDetailsResponseDto,
    description: 'Thông tin chi tiết về subscription hiện tại',
  })
  @ApiNotFoundResponse({
    description: 'Not Found - User chưa đăng ký Monthly Card hoặc subscription đã hết hạn',
  })
  getSubscriptionDetails(@Req() req: any): Promise<SubscriptionDetailsResponseDto> {
    const userId = req.user.id;
    return this.subscriptionService.getSubscriptionDetails(userId);
  }

  // ========== 5. VEX Operations ==========
  @Post('vex/convert')
  @ApiOperation({
    summary: 'Chuyển đổi VEX sang Diamond',
    description:
      'Chuyển đổi VEX coins sang Diamond với tỷ giá 1 VEX = 0.1 Diamond. Hệ thống sẽ tính bonus Diamond dựa trên số lượng VEX đổi (càng nhiều VEX thì bonus càng cao). Transaction được thực hiện atomic để đảm bảo data consistency.',
  })
  @ApiBody({ type: ConvertVexToDiamondDto })
  @ApiOkResponse({
    type: ConvertVexToDiamondResponseDto,
    description:
      'Chuyển đổi thành công. Trả về: diamondsReceived (base), bonusDiamonds, totalDiamondsReceived, và số dư mới của cả Diamond và VEX',
  })
  @ApiBadRequestResponse({
    description: 'Bad Request - Số dư VEX không đủ để chuyển đổi hoặc số lượng VEX không hợp lệ',
  })
  convertVexToDiamond(
    @Req() req: any,
    @Body() dto: ConvertVexToDiamondDto,
  ): Promise<ConvertVexToDiamondResponseDto> {
    const userId = req.user.id;
    return this.convertService.convertVexToDiamond(userId, dto);
  }

  @Post('vex/transfer')
  @ApiOperation({
    summary: 'Chuyển VEX từ user hiện tại sang user khác',
    description:
      'Chuyển VEX từ wallet của user hiện tại sang wallet của user khác. Hệ thống sẽ tạo 2 transaction records: một cho sender (amount < 0) và một cho receiver (amount > 0). Transaction được thực hiện atomic để đảm bảo data consistency.',
  })
  @ApiBody({ type: TransferVexDto })
  @ApiCreatedResponse({
    type: TransferVexResponseDto,
    description:
      'Chuyển VEX thành công. Trả về transferId, status (success), và số dư mới của cả sender và receiver',
  })
  @ApiBadRequestResponse({
    description:
      'Bad Request - Số dư VEX không đủ, không thể chuyển cho chính mình, hoặc số lượng VEX không hợp lệ',
  })
  @ApiNotFoundResponse({
    description: 'Not Found - Không tìm thấy receiver với receiver_id được chỉ định',
  })
  transferVex(@Req() req: any, @Body() dto: TransferVexDto): Promise<TransferVexResponseDto> {
    const userId = req.user.id;
    return this.transferService.transferVex(userId, dto);
  }

  // ========== 6. Deposit & Withdraw ==========
  @Post('deposit/create')
  @ApiOperation({
    summary: 'Tạo địa chỉ Deposit để nhận VEX',
    description:
      'Tạo hoặc lấy địa chỉ deposit address để user có thể nạp VEX vào wallet. Hệ thống sẽ tạo một địa chỉ ví blockchain (Ethereum, Polygon, BSC, etc.) và QR code tương ứng. Nếu đã có deposit address với network tương tự, sẽ trả về address hiện tại.',
  })
  @ApiBody({ type: CreateDepositDto, required: false })
  @ApiCreatedResponse({
    type: CreateDepositResponseDto,
    description: 'Tạo deposit address thành công. Trả về deposit_address, qr_code, và network',
  })
  @ApiBadRequestResponse({
    description:
      'Bad Request - Không thể thay đổi network của deposit address hiện có, hoặc blockchain service chưa được tích hợp',
  })
  createDeposit(
    @Req() req: any,
    @Body() dto?: CreateDepositDto,
  ): Promise<CreateDepositResponseDto> {
    const userId = req.user.id;
    return this.depositService.createDeposit(userId, dto);
  }

  @Get('deposit/info')
  @ApiOperation({
    summary: 'Lấy thông tin địa chỉ Deposit hiện tại',
    description:
      'Lấy thông tin deposit address hiện tại của user: địa chỉ ví, QR code, và network. Nếu chưa có deposit address, hệ thống sẽ tự động tạo mới.',
  })
  @ApiOkResponse({
    type: DepositInfoResponseDto,
    description: 'Thông tin deposit address: deposit_address, qr_code, và network',
  })
  getDepositInfo(@Req() req: any): Promise<DepositInfoResponseDto> {
    const userId = req.user.id;
    return this.depositService.getDepositInfo(userId);
  }

  @Patch('deposit/network')
  @ApiOperation({
    summary: 'Cập nhật network cho deposit address',
    description:
      'Cập nhật network blockchain cho deposit address (Polygon, BSC, Ethereum, Arbitrum). Nếu đã có deposit address với network khác, hệ thống sẽ tạo address mới với network được chỉ định.',
  })
  @ApiBody({ type: UpdateDepositNetworkDto })
  @ApiOkResponse({
    type: CreateDepositResponseDto,
    description: 'Cập nhật network thành công. Trả về deposit_address, qr_code, và network mới',
  })
  @ApiBadRequestResponse({
    description: 'Bad Request - Network không hợp lệ hoặc blockchain service chưa được tích hợp',
  })
  updateDepositNetwork(
    @Req() req: any,
    @Body() dto: UpdateDepositNetworkDto,
  ): Promise<CreateDepositResponseDto> {
    const userId = req.user.id;
    return this.depositService.updateDepositNetwork(userId, dto);
  }

  @Post('withdraw')
  @ApiOperation({
    summary: 'Khởi tạo yêu cầu rút VEX',
    description:
      'Tạo yêu cầu rút VEX từ wallet ra địa chỉ blockchain bên ngoài. Hệ thống sẽ tạo transaction với status "pending" và gửi request đến blockchain service để xử lý. Sau khi blockchain service xác nhận, transaction sẽ được cập nhật thành "success" và số dư VEX sẽ bị trừ.',
  })
  @ApiBody({ type: WithdrawVexDto })
  @ApiCreatedResponse({
    type: WithdrawVexResponseDto,
    description:
      'Yêu cầu rút VEX được tạo thành công. Trả về withdrawalId, status (pending), và message. Transaction sẽ được xử lý bởi blockchain service.',
  })
  @ApiBadRequestResponse({
    description:
      'Bad Request - Số dư VEX không đủ, địa chỉ không hợp lệ, hoặc vượt quá daily limit',
  })
  withdrawVex(@Req() req: any, @Body() dto: WithdrawVexDto): Promise<WithdrawVexResponseDto> {
    const userId = req.user.id;
    return this.depositService.withdrawVex(userId, dto);
  }

  // ========== 7. Transaction History ==========
  @Get('transactions/history')
  @ApiOperation({
    summary: 'Lấy lịch sử giao dịch',
    description:
      'Lấy lịch sử tất cả các giao dịch của user: deposit, withdraw, gift, convert, transfer, subscription. Hỗ trợ pagination (page, limit) và sắp xếp theo thời gian (mới nhất trước). Mỗi transaction bao gồm: type, amount, date, status, description, và thông tin chi tiết (sender_name, receiver_name, gift_name) nếu có.',
  })
  @ApiOkResponse({
    description: 'Danh sách lịch sử giao dịch với pagination',
    type: [TransactionHistoryItemDto],
  })
  getTransactionHistory(
    @Req() req: any,
    @Query() query: BaseQueryDto,
  ): Promise<IPaginatedResponse<TransactionHistoryItemDto>> {
    const userId = req.user.id;
    return this.transactionService.getTransactionHistory(userId, query);
  }

  // ========== 8. Payment Methods ==========
  @Get('payment-methods')
  @ApiOperation({
    summary: 'Lấy danh sách phương thức thanh toán',
    description:
      'Lấy danh sách tất cả các phương thức thanh toán đang active: Visa, Dolfie, Apple Pay, Google Pay, etc. Mỗi phương thức bao gồm: id, name, type (card, subscription, crypto), và masked_info (nếu có).',
  })
  @ApiOkResponse({
    type: [PaymentMethodDto],
    description: 'Danh sách các phương thức thanh toán đang active',
  })
  getPaymentMethods(): Promise<PaymentMethodDto[]> {
    return this.paymentMethodService.getPaymentMethods();
  }

  // ========== 9. In-App Purchase (IAP) ==========
  @Post('iap/verify-receipt')
  @ApiOperation({
    summary: 'Xác minh giao dịch In-App Purchase',
    description:
      'Xác minh receipt từ Apple App Store (iOS) hoặc Google Play Store (Android) sau khi user mua Diamond qua In-App Purchase. Hệ thống sẽ verify receipt với Apple/Google API, sau đó cộng Diamond vào wallet nếu verification thành công.',
  })
  @ApiBody({ type: IapVerifyReceiptDto })
  @ApiOkResponse({
    type: IapVerifyReceiptResponseDto,
    description:
      'Xác minh thành công. Trả về status (success), diamondsAdded, và newDiamondBalance',
  })
  @ApiBadRequestResponse({
    description:
      'Bad Request - Receipt không hợp lệ, platform không đúng, hoặc receipt đã được sử dụng',
  })
  verifyIapReceipt(
    @Req() req: any,
    @Body() dto: IapVerifyReceiptDto,
  ): Promise<IapVerifyReceiptResponseDto> {
    const userId = req.user.id;
    return this.iapService.verifyIapReceipt(userId, dto);
  }
}
