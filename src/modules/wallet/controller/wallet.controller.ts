import {
  Controller,
  Get,
  Post,
  Patch,
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
  VexPackageDto,
  CreateDepositResponseDto,
  WithdrawVexDto,
  WithdrawVexResponseDto,
  DepositInfoResponseDto,
  IapVerifyReceiptDto,
  IapVerifyReceiptResponseDto,
  TransferVexDto,
  TransferVexResponseDto,
  UpdateDepositNetworkDto,
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
  ) {}

  // ========== 1. CRUD Basic Wallet ==========
  @Get()
  @ApiOperation({
    summary: 'Lấy thông tin ví của user hiện tại',
    description:
      'Lấy danh sách tất cả các ví (wallet) của user hiện tại. Hỗ trợ pagination và filter theo currency (diamond, vex). User sẽ luôn có 2 ví: diamond và vex (tự động tạo khi đăng ký).',
  })
  @ApiOkResponse({
    description: 'Danh sách ví của user với pagination',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'boolean', example: false },
        code: { type: 'number', example: 0 },
        message: { type: 'string', example: 'Success' },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'wallet-id' },
                  user_id: { type: 'string', example: 'user-id' },
                  currency: { type: 'string', enum: ['diamond', 'vex'], example: 'diamond' },
                  balance: { type: 'string', example: '1000' },
                  created_at: { type: 'string', format: 'date-time' },
                  updated_at: { type: 'string', format: 'date-time' },
                },
              },
            },
            meta: {
              type: 'object',
              properties: {
                item_count: { type: 'number', example: 2 },
                total_items: { type: 'number', example: 2 },
                items_per_page: { type: 'number', example: 20 },
                total_pages: { type: 'number', example: 1 },
                current_page: { type: 'number', example: 1 },
              },
            },
          },
        },
        traceId: { type: 'string', example: 'trace-id' },
      },
    },
  })
  getWallet(@Req() req: any, @Query() query: BaseQueryDto) {
    const userId = req.user.id;
    return this.walletService.getWallet(userId, query);
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
    summary: 'Lấy danh sách gói nạp tiền',
    description:
      'Lấy danh sách tất cả các gói nạp tiền đang active. Mỗi gói bao gồm: số Diamond, giá tiền (USD), và bonus (nếu có). Có thể dùng để nạp Diamond hoặc VEX qua PayPal.',
  })
  @ApiOkResponse({
    type: [RechargePackageDto],
    description: 'Danh sách các gói nạp tiền đang active',
  })
  getRechargePackages(): Promise<RechargePackageDto[]> {
    return this.rechargeService.getRechargePackages();
  }

  @Post('recharge/checkout')
  @ApiOperation({
    summary: 'Khởi tạo giao dịch nạp tiền (Diamond hoặc VEX)',
    description:
      'Tạo một giao dịch nạp tiền vào ví. Có thể nạp Diamond hoặc VEX qua PayPal. Hệ thống sẽ tạo transaction với status "pending" và trả về transactionId để user có thể thanh toán. Sau khi thanh toán thành công (qua PayPal), transaction sẽ được cập nhật thành "success" và tiền sẽ được cộng vào wallet tương ứng (Diamond hoặc VEX).\n\n- Nếu currency="diamond": Nhận số Diamond từ package\n- Nếu currency="vex": Nhận VEX với tỷ giá 1 USD = 1 VEX',
  })
  @ApiBody({ type: CheckoutRechargeDto })
  @ApiCreatedResponse({
    type: CheckoutRechargeResponseDto,
    description:
      'Giao dịch được tạo thành công. Trả về transactionId, price (USD), status (pending), và paymentUrl',
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

  @Post('recharge/monthly-cards')
  @ApiOperation({
    summary: 'Mua Thẻ Tháng (Monthly Card)',
    description:
      'Mua một Monthly Card subscription. Hệ thống sẽ kiểm tra số dư Diamond, trừ tiền từ wallet, tạo transaction record, và cập nhật VIP status. Nếu số dư không đủ, sẽ trả về lỗi với thông báo chi tiết.',
  })
  @ApiBody({ type: PurchaseSubscriptionDto })
  @ApiCreatedResponse({
    type: PurchaseSubscriptionResponseDto,
    description:
      'Mua Thẻ Tháng thành công. Trả về subscriptionId, status (active), startDate, và nextRenewal date',
  })
  @ApiBadRequestResponse({
    description:
      'Bad Request - Số dư không đủ, Monthly Card không tồn tại, không active, hoặc dữ liệu không hợp lệ',
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
  @Get('vex/packages')
  @ApiOperation({
    summary: 'Lấy danh sách gói mua Diamond bằng VEX',
    description:
      'Lấy danh sách tất cả các gói mua Diamond bằng VEX. Mỗi gói bao gồm: số VEX cần thanh toán, số Diamond nhận được (base), bonus Diamond, và tổng Diamond nhận được.',
  })
  @ApiOkResponse({
    type: [VexPackageDto],
    description: 'Danh sách các gói mua Diamond bằng VEX',
  })
  getVexPackages(): Promise<VexPackageDto[]> {
    return Promise.resolve(this.convertService.getVexPackages());
  }

  @Post('vex/checkout')
  @ApiOperation({
    summary: 'Mua Diamond bằng VEX',
    description:
      'Mua Diamond bằng số VEX đã có trong ví. Hệ thống hỗ trợ các gói cố định: 20, 50, 80, 120, 200, 420 VEX. Mỗi gói có bonus Diamond riêng (càng nhiều VEX thì bonus càng cao). Hệ thống sẽ trừ VEX từ ví và cộng Diamond vào ví. Transaction được thực hiện atomic để đảm bảo data consistency.',
  })
  @ApiBody({ type: ConvertVexToDiamondDto })
  @ApiOkResponse({
    type: ConvertVexToDiamondResponseDto,
    description:
      'Mua Diamond thành công. Trả về: diamondsReceived (base), bonusDiamonds, totalDiamondsReceived, và số dư mới của cả Diamond và VEX',
  })
  @ApiBadRequestResponse({
    description:
      'Bad Request - Số dư VEX không đủ để mua Diamond hoặc số lượng VEX không hợp lệ (chỉ hỗ trợ các gói: 20, 50, 80, 120, 200, 420 VEX)',
  })
  checkoutVexToDiamond(
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
    summary: 'Rút VEX về PayPal',
    description:
      'Rút VEX từ wallet về PayPal account. VEX là tiền ảo nội bộ, sẽ được convert sang USD (1 VEX = 1 USD) và gửi về email PayPal. Hệ thống sẽ trừ VEX từ wallet và tạo PayPal payout.',
  })
  @ApiBody({ type: WithdrawVexDto })
  @ApiCreatedResponse({
    type: WithdrawVexResponseDto,
    description:
      'Yêu cầu rút VEX thành công. Trả về withdrawalId, status, và message. Tiền sẽ được gửi về PayPal email.',
  })
  @ApiBadRequestResponse({
    description:
      'Bad Request - Số dư VEX không đủ, email PayPal không hợp lệ, hoặc lỗi khi tạo PayPal payout',
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

  // ========== 8. In-App Purchase (IAP) ==========
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
