import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { NotificationService } from '../service/notification.service';
import { CreateNotificationDto, UpdateNotificationStatusDto } from '../dto/notification.dto';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import type { AuthenticatedRequest } from '../../../common/interfaces/request.interface';

@ApiTags('Notifications')
@Controller('notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('account-auth'))
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách notifications của user hiện tại' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getNotifications(@Req() req: AuthenticatedRequest, @Query() query: BaseQueryDto) {
    return this.notificationService.getUserNotifications(req.user.id, query);
  }

  @Get('unread/count')
  @ApiOperation({ summary: 'Lấy số lượng unread notifications' })
  getUnreadCount(@Req() req: AuthenticatedRequest) {
    return this.notificationService.getUnreadCount(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo notification mới (admin/system only)' })
  createNotification(@Body() dto: CreateNotificationDto) {
    return this.notificationService.createNotification(dto);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Cập nhật status của notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateNotificationStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.notificationService.updateNotificationStatus(id, dto);
  }

  @Put('mark-all-read')
  @ApiOperation({ summary: 'Đánh dấu tất cả notifications là đã đọc' })
  markAllAsRead(@Req() req: AuthenticatedRequest) {
    return this.notificationService.markAllAsRead(req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  deleteNotification(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.notificationService.deleteNotification(id, req.user.id);
  }
}
