// Import các decorator và class từ NestJS để tạo controller
import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
// Import các decorator từ Swagger để tạo API documentation
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiOkResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
// Import AuthGuard từ Passport để xác thực JWT token
import { AuthGuard } from '@nestjs/passport';
// Import AdminGuard để kiểm tra quyền admin
import { AdminGuard } from '../../../common/guards/admin.guard';
// Import NotificationService để xử lý business logic
import { NotificationService } from '../service/notification.service';
// Import các DTO để validate và type-check dữ liệu
import { CreateNotificationDto } from '../dto/notification.dto';
// Import BaseQueryDto cho pagination
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

/**
 * @ApiTags('Notifications (Admin)') - Nhóm các endpoints này trong Swagger UI với tag "Notifications (Admin)"
 * @UseGuards(AuthGuard('account-auth'), AdminGuard) - Yêu cầu authentication và admin role
 * @ApiBearerAuth('JWT-auth') - Yêu cầu JWT token trong header
 * @Controller('admin/users/:user_id/notifications') - Định nghĩa base route là /admin/users/:user_id/notifications
 * NotificationAdminController - Controller xử lý các HTTP requests liên quan đến notifications management (admin only)
 *
 * Chức năng chính:
 * - Xem danh sách notifications của bất kỳ user nào (admin only)
 * - Tạo notification cho bất kỳ user nào (admin only)
 * - Xóa notification của bất kỳ user nào (admin only)
 *
 * Lưu ý:
 * - Chỉ admin mới có quyền truy cập các endpoints này
 * - Có thể quản lý notifications của bất kỳ user nào (không chỉ của chính mình)
 */
@ApiTags('Notifications (Admin)')
@UseGuards(AuthGuard('account-auth'), AdminGuard)
@ApiBearerAuth('JWT-auth')
@Controller('admin/users/:user_id/notifications')
export class NotificationAdminController {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject NotificationService khi tạo instance của controller
   */
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: '[ADMIN] Lấy danh sách notifications của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getNotifications(@Param('user_id') userId: string, @Query() query: BaseQueryDto) {
    return this.notificationService.getUserNotifications(userId, query);
  }

  @Post()
  @ApiOperation({ summary: '[ADMIN] Tạo notification cho user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user' })
  @ApiBody({ type: CreateNotificationDto })
  createNotification(@Param('user_id') userId: string, @Body() dto: CreateNotificationDto) {
    return this.notificationService.createNotification({ ...dto, user_id: userId });
  }

  @Delete(':id')
  @ApiOperation({ summary: '[ADMIN] Xóa notification của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  deleteNotification(@Param('user_id') userId: string, @Param('id') id: string) {
    return this.notificationService.deleteNotification(id, userId);
  }
}
