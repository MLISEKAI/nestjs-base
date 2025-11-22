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
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { GiftItemAdminService } from '../service/gift-item-admin.service';
import { CreateGiftItemDto, UpdateGiftItemDto } from '../dto/gift-item-admin.dto';

/**
 * Admin Gift Items Controller - Chỉ admin mới truy cập được
 * Dùng để quản lý gift items (CRUD)
 */
@ApiTags('Gift Items (Admin)')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard('account-auth'), AdminGuard)
@ApiBearerAuth('JWT-auth')
@Controller('admin/gifts/items')
export class GiftItemAdminController {
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
