// Import các decorator và class từ NestJS để tạo controller
import {
  Controller,
  Get,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
// Import các decorator từ Swagger để tạo API documentation
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
// Import AuthGuard từ Passport để xác thực JWT token
import { AuthGuard } from '@nestjs/passport';
// Import ReportService để xử lý business logic
import { ReportService } from '../service/report.service';
// Import các DTO để validate và type-check dữ liệu
import { CreateReportDto } from '../dto/report.dto';
// Import interface để type-check request có user authenticated
import type { AuthenticatedRequest } from '../../../common/interfaces/request.interface';

/**
 * @ApiTags('Reports') - Nhóm các endpoints này trong Swagger UI với tag "Reports"
 * @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
 *   - transform: true - Tự động transform dữ liệu
 *   - whitelist: true - Chỉ giữ lại các properties được định nghĩa trong DTO
 * @Controller('reports') - Định nghĩa base route là /reports
 * ReportController - Controller xử lý các HTTP requests liên quan đến reports
 *
 * Chức năng chính:
 * - Lấy danh sách lý do report (public)
 * - Gửi report (cần authentication)
 *
 * Lưu ý:
 * - Report có thể gửi cho post, user, hoặc comment
 * - Cần validate target tồn tại trước khi tạo report
 */
@ApiTags('Reports')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('reports')
export class ReportController {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject ReportService khi tạo instance của controller
   */
  constructor(private readonly reportService: ReportService) {}

  @Get('reasons')
  @ApiOperation({ summary: 'Lấy danh sách lý do report' })
  @ApiOkResponse({ description: 'Danh sách lý do report' })
  getReasons() {
    return this.reportService.getReasons();
  }

  @Post()
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Gửi report' })
  @ApiBody({ type: CreateReportDto })
  @ApiCreatedResponse({ description: 'Report đã được gửi' })
  createReport(@Body() dto: CreateReportDto, @Req() req: AuthenticatedRequest) {
    return this.reportService.createReport(req.user.id, dto);
  }
}
