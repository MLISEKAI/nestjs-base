// Import các decorator và class từ NestJS để tạo controller
import {
  Controller,
  Get,
  Post,
  Put,
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
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
// Import AuthGuard từ Passport để xác thực JWT token
import { AuthGuard } from '@nestjs/passport';
// Import AdminGuard để kiểm tra quyền admin
import { AdminGuard } from '../../../common/guards/admin.guard';
// Import GiftItemAdminService để xử lý business logic
import { GiftItemAdminService } from '../service/gift-item-admin.service';
// Import các DTO để validate và type-check dữ liệu
import { CreateGiftItemDto, UpdateGiftItemDto } from '../dto/gift-item-admin.dto';

/**
 * @ApiTags('Gift Items (Admin)') - Nhóm các endpoints này trong Swagger UI với tag "Gift Items (Admin)"
 * @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
 *   - transform: true - Tự động transform dữ liệu
 *   - whitelist: true - Chỉ giữ lại các properties được định nghĩa trong DTO
 * @UseGuards(AuthGuard('account-auth'), AdminGuard) - Yêu cầu authentication và admin role
 * @ApiBearerAuth('JWT-auth') - Yêu cầu JWT token trong header
 * @Controller('admin/gifts/items') - Định nghĩa base route là /admin/gifts/items
 * GiftItemAdminController - Controller xử lý các HTTP requests liên quan đến gift items management (admin only)
 *
 * Chức năng chính:
 * - CRUD gift items (admin only)
 * - Quản lý gift catalog (thêm, sửa, xóa gift items)
 * - Validate category và event khi tạo gift item
 *
 * Lưu ý:
 * - Chỉ admin mới có quyền truy cập các endpoints này
 * - Tất cả operations đều invalidate cache để đảm bảo dữ liệu mới nhất
 * - Không thể xóa gift item nếu đã có gift nào sử dụng
 */
@ApiTags('Gift Items (Admin)')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard('account-auth'), AdminGuard)
@ApiBearerAuth('JWT-auth')
@Controller('admin/gifts/items')
export class GiftItemAdminController {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject GiftItemAdminService khi tạo instance của controller
   */
  constructor(private readonly adminService: GiftItemAdminService) {}

  @Post()
  @ApiOperation({ summary: '[ADMIN] Tạo gift item mới' })
  @ApiBody({ type: CreateGiftItemDto })
  @ApiCreatedResponse({ description: 'Gift item được tạo thành công' })
  create(@Body() dto: CreateGiftItemDto) {
    return this.adminService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '[ADMIN] Lấy danh sách gift items (trả về UUID, không format)' })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Lọc theo type: hot, event, lucky, friendship, vip, normal',
  })
  @ApiOkResponse({ description: 'Danh sách gift items' })
  findAll(@Query('type') type?: string) {
    return this.adminService.findAll(type);
  }

  @Get(':id')
  @ApiOperation({ summary: '[ADMIN] Lấy gift item theo ID (trả về UUID)' })
  @ApiParam({ name: 'id', description: 'Gift item ID (UUID)' })
  @ApiOkResponse({ description: 'Chi tiết gift item' })
  findOne(@Param('id') id: string) {
    return this.adminService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '[ADMIN] Cập nhật gift item' })
  @ApiParam({ name: 'id', description: 'Gift item ID (UUID)' })
  @ApiBody({ type: UpdateGiftItemDto })
  @ApiOkResponse({ description: 'Gift item được cập nhật thành công' })
  update(@Param('id') id: string, @Body() dto: UpdateGiftItemDto) {
    return this.adminService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '[ADMIN] Xóa gift item (chỉ xóa được nếu chưa có gift nào dùng)' })
  @ApiParam({ name: 'id', description: 'Gift item ID (UUID)' })
  @ApiOkResponse({ description: 'Gift item được xóa thành công' })
  remove(@Param('id') id: string) {
    return this.adminService.remove(id);
  }
}
