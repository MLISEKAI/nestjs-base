// Import các decorator và class từ NestJS để tạo controller
import {
  Controller, // Decorator đánh dấu class là controller
  Get, // Decorator cho HTTP GET method
  Post, // Decorator cho HTTP POST method
  Patch, // Decorator cho HTTP PATCH method
  Delete, // Decorator cho HTTP DELETE method
  Param, // Decorator để lấy parameter từ URL
  Body, // Decorator để lấy body từ request
  Query, // Decorator để lấy query parameters từ URL
  UseGuards, // Decorator để sử dụng guard (authentication, authorization)
  Req, // Decorator để lấy request object
} from '@nestjs/common';
// Import các decorator từ Swagger để tạo API documentation
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
// Import AuthGuard từ Passport để xác thực JWT token
import { AuthGuard } from '@nestjs/passport';
// Import NotificationService để xử lý business logic
import { NotificationService } from '../service/notification.service';
// Import các DTO để validate và type-check dữ liệu
import {
  CreateNotificationDto,
  UpdateNotificationStatusDto,
  NotificationQueryDto,
} from '../dto/notification.dto';
// Import interface để type-check request có user authenticated
import type { AuthenticatedRequest } from '../../../common/interfaces/request.interface';

/**
 * @ApiTags('Notifications') - Nhóm các endpoints này trong Swagger UI
 * @Controller('notifications') - Định nghĩa base route là /notifications
 * @ApiBearerAuth('JWT-auth') - Yêu cầu JWT token trong header (Authorization: Bearer <token>)
 * @UseGuards(AuthGuard('account-auth')) - Áp dụng authentication guard cho tất cả endpoints trong controller này
 */
@ApiTags('Notifications')
@Controller('notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('account-auth'))
export class NotificationController {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject NotificationService khi tạo instance của controller
   */
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * @Get('unread/count') - Route cụ thể phải được định nghĩa TRƯỚC route parametrized @Get(':id') và generic @Get()
   * Lý do: NestJS match routes theo thứ tự, nếu @Get(':id') hoặc @Get() đứng trước, chúng sẽ match '/unread/count'
   * và treat 'unread' như là :id parameter hoặc không match đúng route
   */
  @Get('unread/count')
  @ApiOperation({ summary: 'Số lượng thông báo chưa đọc - Hiển thị badge đỏ' })
  getUnreadCount(@Req() req: AuthenticatedRequest) {
    return this.notificationService.getUnreadCount(req.user.id);
  }

  /**
   * @Get(':id') - Route parametrized phải được định nghĩa SAU các route cụ thể nhưng TRƯỚC generic @Get()
   * Lý do: Nếu đặt trước route cụ thể, nó sẽ match tất cả paths và override các route cụ thể.
   * Nếu đặt sau generic @Get(), generic route sẽ match trước và override route này.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết thông báo - Lấy chi tiết thông báo khi người dùng nhấn vào' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  getNotification(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.notificationService.getNotificationById(id, req.user.id);
  }

  /**
   * @Get() - HTTP GET method, route: GET /notifications
   * Generic route phải được định nghĩa CUỐI CÙNG sau tất cả các route cụ thể và parametrized
   * Lý do: NestJS match routes theo thứ tự. Nếu đặt trước, generic route sẽ intercept tất cả requests
   * và ngăn các route cụ thể như @Get('unread/count') và @Get(':id') từ việc được match.
   * @ApiOperation - Mô tả endpoint trong Swagger documentation
   * @ApiQuery - Định nghĩa query parameters trong Swagger
   * @Req() - Lấy request object, có chứa user đã authenticated (từ JWT token)
   * @Query() - Lấy query parameters từ URL (page, limit, type, status)
   */
  @Get()
  @ApiOperation({
    summary: 'Danh sách thông báo - Lấy danh sách thông báo (phân trang)',
    description:
      'Lấy danh sách notifications của user đang đăng nhập (từ JWT token).\n\n**Lưu ý:** Chỉ trả về notifications mà `user_id` = user đang authenticated. Nếu bạn tạo notification cho user khác, bạn sẽ không thấy notification đó khi GET.\n\nHỗ trợ filter theo type và status. Type có thể truyền nhiều giá trị (comma-separated)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20)',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    type: String,
    description: 'Filter theo notification type (comma-separated, ví dụ: LIKE,COMMENT,FOLLOW)',
    enum: ['MESSAGE', 'FOLLOW', 'LIKE', 'COMMENT', 'GIFT', 'POST', 'SYSTEM'],
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['READ', 'UNREAD'],
    description: 'Filter theo status (READ hoặc UNREAD)',
  })
  getNotifications(@Req() req: AuthenticatedRequest, @Query() query?: NotificationQueryDto) {
    // Lấy user_id từ JWT token (user đã được authenticate bởi AuthGuard)
    // req.user được set bởi JWT strategy sau khi verify token thành công
    const user_id = req.user.id;
    // Gọi service để lấy notifications của user này với filters (nếu có)
    return this.notificationService.getUserNotifications(user_id, query);
  }

  /**
   * @Post() - HTTP POST method, route: POST /notifications
   * Tạo notification mới cho user khác
   * @param dto - DTO chứa thông tin notification (user_id, type, title, content, etc.)
   * @param req - Request object chứa user đã authenticated
   * @returns Thông tin notification đã tạo
   */
  @Post()
  @ApiOperation({
    summary:
      'Push thông báo sự kiện - Server tạo notification mới khi có like/comment/share/follow',
    description:
      'Tạo notification cho user khác.\n\n**Ví dụ:** User A (đang đăng nhập) like post của User B:\n- `user_id` = User B (người nhận notification "User A liked your post")\n- `sender_id` = User A (tự động lấy từ JWT token - user đang authenticated)\n\n**Logic:** Khi có hành động (like/comment/follow), người thực hiện hành động (user đang authenticated) sẽ tạo notification cho người bị tác động (`user_id`).',
  })
  @ApiBody({
    description:
      'Ví dụ: User A (đang đăng nhập) like post của User B\n- user_id: "user-b-id" (User B nhận notification)\n- sender_id: Tự động lấy từ JWT token (User A - user đang authenticated)',
    examples: {
      like: {
        summary: 'User A like post của User B',
        value: {
          user_id: 'user-b-id',
          type: 'LIKE',
          title: 'New Like',
          content: 'User A liked your post',
        },
      },
      comment: {
        summary: 'User A comment post của User B',
        value: {
          user_id: 'user-b-id',
          type: 'COMMENT',
          title: 'New Comment',
          content: 'User A commented on your post',
        },
      },
      follow: {
        summary: 'User A follow User B',
        value: {
          user_id: 'user-b-id',
          type: 'FOLLOW',
          title: 'New Follower',
          content: 'User A started following you',
        },
      },
    },
  })
  createNotification(@Body() dto: CreateNotificationDto, @Req() req: AuthenticatedRequest) {
    // sender_id luôn tự động lấy từ JWT token
    // User đang authenticated (từ JWT) = người thực hiện hành động (sender)
    // Không cần truyền sender_id trong request body
    dto.sender_id = req.user.id;
    // Gọi service để tạo notification
    return this.notificationService.createNotification(dto);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Đánh dấu 1 thông báo đã đọc - Đổi trạng thái is_read = true' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  markAsRead(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.notificationService.markAsRead(id, req.user.id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Đánh dấu tất cả là đã đọc - Dùng khi user bấm "Mark all as read"' })
  markAllAsRead(@Req() req: AuthenticatedRequest) {
    return this.notificationService.markAllAsRead(req.user.id);
  }

  /**
   * @Delete() - Generic route phải được định nghĩa TRƯỚC route parametrized @Delete(':id')
   * Lý do: NestJS match routes theo thứ tự. Nếu @Delete(':id') đứng trước, nó sẽ match '/notifications'
   * (treating empty string as :id parameter) và ngăn @Delete() từ việc được match.
   */
  @Delete()
  @ApiOperation({ summary: 'Xoá tất cả thông báo - Clear All Notifications' })
  deleteAllNotifications(@Req() req: AuthenticatedRequest) {
    return this.notificationService.deleteAllNotifications(req.user.id);
  }

  /**
   * @Delete(':id') - Route parametrized phải được định nghĩa SAU generic @Delete()
   * Lý do: Nếu đặt trước generic route, nó sẽ match tất cả paths và override generic route.
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Xoá 1 thông báo' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  deleteNotification(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.notificationService.deleteNotification(id, req.user.id);
  }
}
