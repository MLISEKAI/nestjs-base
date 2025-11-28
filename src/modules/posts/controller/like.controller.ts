// Import các decorator và class từ NestJS để tạo controller
import {
  Controller, // Decorator đánh dấu class là controller
  Get, // Decorator cho HTTP GET method
  Post, // Decorator cho HTTP POST method
  Delete, // Decorator cho HTTP DELETE method
  Param, // Decorator để lấy parameter từ URL
  Body, // Decorator để lấy body từ request
  Query, // Decorator để lấy query parameters từ URL
  UsePipes, // Decorator để sử dụng pipe (validation, transformation)
  ValidationPipe, // Pipe để validate và transform dữ liệu
  UseGuards, // Decorator để sử dụng guard (authentication, authorization)
  Req, // Decorator để lấy request object
} from '@nestjs/common';
// Import các decorator từ Swagger để tạo API documentation
import {
  ApiTags, // Nhóm các endpoints trong Swagger UI
  ApiOperation, // Mô tả operation
  ApiBody, // Mô tả request body
  ApiOkResponse, // Mô tả response thành công (200)
  ApiBearerAuth, // Yêu cầu JWT token trong header
  ApiParam, // Mô tả path parameter
  ApiQuery, // Mô tả query parameter
} from '@nestjs/swagger';
// Import AuthGuard từ Passport để xác thực JWT token
import { AuthGuard } from '@nestjs/passport';
// Import OptionalAuthGuard cho endpoints không bắt buộc authentication
import { OptionalAuthGuard } from '../../../common/guards/optional-auth.guard';
// Import LikeService để xử lý business logic
import { LikeService } from '../service/like.service';
// Import các DTO để validate và type-check dữ liệu
import { LikePostDto, PostLikeDto, LikeStatsDto, CheckUserLikedDto } from '../dto/likes.dto';
// Import BaseQueryDto cho pagination
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
// Import interface để type-check request có user authenticated
import type { AuthenticatedRequest } from '../../../common/interfaces/request.interface';

/**
 * @ApiTags('Post Likes') - Nhóm các endpoints này trong Swagger UI với tag "Post Likes"
 * @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
 *   - transform: true - Tự động transform dữ liệu
 *   - whitelist: true - Chỉ giữ lại các properties được định nghĩa trong DTO
 * @Controller('posts/:post_id/likes') - Định nghĩa base route là /posts/:post_id/likes
 * LikeController - Controller xử lý các HTTP requests liên quan đến likes của posts
 */
@ApiTags('Post Likes')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('posts/:post_id/likes')
export class LikeController {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject LikeService khi tạo instance của controller
   */
  constructor(private readonly likeService: LikeService) {}

  /**
   * @Get() - HTTP GET method, route: GET /posts/:post_id/likes
   * Lấy danh sách likes của một post (public endpoint, không cần authentication)
   * @Param('post_id') - Lấy post_id từ URL path
   * @Query() - Lấy query parameters (page, limit) cho pagination
   */
  @Get()
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Lấy danh sách likes của post (View activity)',
    description: 'Public endpoint - JWT token là optional. Nếu có token, sẽ trả về thêm is_following, is_friend, is_follower'
  })
  @ApiParam({ name: 'post_id', description: 'Post ID', example: 'post-1' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiOkResponse({ description: 'Danh sách likes với pagination', type: [PostLikeDto] })
  getLikes(
    @Param('post_id') postId: string,
    @Query() query?: BaseQueryDto,
    @Req() req?: AuthenticatedRequest,
  ) {
    // Lấy currentUserId nếu user đã đăng nhập (optional)
    const currentUserId = req?.user?.id;
    // Gọi service để lấy danh sách likes với pagination và follow status
    return this.likeService.getLikes(postId, query, currentUserId);
  }

  /**
   * @Get('stats') - HTTP GET method, route: GET /posts/:post_id/likes/stats
   * Lấy thống kê likes/reactions của post (tổng số likes, số lượng mỗi reaction type)
   * @Param('post_id') - Lấy post_id từ URL path
   */
  @Get('stats')
  @ApiOperation({ summary: 'Lấy thống kê likes/reactions của post' })
  @ApiParam({ name: 'post_id', description: 'Post ID', example: 'post-1' })
  @ApiOkResponse({ description: 'Thống kê reactions', type: LikeStatsDto })
  getLikeStats(@Param('post_id') postId: string) {
    // Gọi service để lấy thống kê likes
    // Trả về: { total: số, reactions: { like: số, love: số, haha: số, etc. } }
    return this.likeService.getLikeStats(postId);
  }

  /**
   * @Get('check') - HTTP GET method, route: GET /posts/:post_id/likes/check
   * Kiểm tra user đã like post chưa (cần authentication)
   * @Param('post_id') - Lấy post_id từ URL path
   */
  @Get('check')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Kiểm tra user đã like post chưa' })
  @ApiParam({ name: 'post_id', description: 'Post ID', example: 'post-1' })
  @ApiOkResponse({ description: 'Trạng thái like của user', type: CheckUserLikedDto })
  checkUserLiked(@Param('post_id') postId: string, @Req() req: AuthenticatedRequest) {
    // Lấy user_id từ JWT token (user đang kiểm tra)
    const user_id = req.user.id;
    // Gọi service để kiểm tra user đã like chưa
    // Trả về: { liked: boolean, reaction: string | null }
    return this.likeService.checkUserLiked(user_id, postId);
  }

  /**
   * @Post() - HTTP POST method, route: POST /posts/:post_id/likes
   * Like/React post (cần authentication)
   * @Param('post_id') - Lấy post_id từ URL path
   * @Body() - Lấy reaction type từ request body (like, love, haha, etc.)
   */
  @Post()
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Like/React post' })
  @ApiParam({ name: 'post_id', description: 'Post ID', example: 'post-1' })
  @ApiBody({ type: LikePostDto })
  @ApiOkResponse({ description: 'Post đã được like/react', type: PostLikeDto })
  likePost(
    @Param('post_id') postId: string,
    @Body() dto: LikePostDto,
    @Req() req: AuthenticatedRequest,
  ) {
    // Lấy user_id từ JWT token (user đang like)
    const user_id = req.user.id;
    // Gọi service để like post
    // Logic: Nếu đã like với cùng reaction => unlike (toggle)
    //        Nếu đã like với reaction khác => update reaction
    //        Nếu chưa like => tạo like mới
    //        Tự động tạo notification cho chủ bài viết
    return this.likeService.likePost(user_id, postId, dto);
  }

  /**
   * @Delete() - HTTP DELETE method, route: DELETE /posts/:post_id/likes
   * Unlike post (cần authentication)
   * @Param('post_id') - Lấy post_id từ URL path
   */
  @Delete()
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Unlike post' })
  @ApiParam({ name: 'post_id', description: 'Post ID', example: 'post-1' })
  @ApiOkResponse({ description: 'Post đã được unlike' })
  unlikePost(@Param('post_id') postId: string, @Req() req: AuthenticatedRequest) {
    // Lấy user_id từ JWT token (user đang unlike)
    const user_id = req.user.id;
    // Gọi service để unlike post
    // Xóa like record khỏi database
    return this.likeService.unlikePost(user_id, postId);
  }
}
