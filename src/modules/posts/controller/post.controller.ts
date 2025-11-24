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
  ApiCreatedResponse, // Mô tả response khi tạo thành công (201)
  ApiOkResponse, // Mô tả response thành công (200)
  ApiBearerAuth, // Yêu cầu JWT token trong header
  ApiParam, // Mô tả path parameter
  ApiQuery, // Mô tả query parameter
} from '@nestjs/swagger';
// Import AuthGuard từ Passport để xác thực JWT token
import { AuthGuard } from '@nestjs/passport';
// Import các DTO để validate và type-check dữ liệu
import { CreatePostDto, UpdatePostDto, PostDto } from '../dto';
// Import PostService để xử lý business logic
import { PostService } from '../service/post.service';
// Import BaseQueryDto cho pagination
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
// Import interface để type-check request có user authenticated
import type { AuthenticatedRequest } from '../../../common/interfaces/request.interface';

/**
 * @ApiTags('Posts') - Nhóm các endpoints này trong Swagger UI với tag "Posts"
 * @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
 *   - transform: true - Tự động transform dữ liệu (ví dụ: string "123" -> number 123)
 *   - whitelist: true - Chỉ giữ lại các properties được định nghĩa trong DTO, loại bỏ các properties khác
 * @Controller('posts') - Định nghĩa base route là /posts
 * PostController - Controller xử lý các HTTP requests liên quan đến posts
 */
@ApiTags('Posts')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('posts')
export class PostController {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject PostService khi tạo instance của controller
   */
  constructor(private readonly posts: PostService) {}

  /**
   * @Get() - HTTP GET method, route: GET /posts
   * Lấy danh sách posts của user hiện tại (user đang đăng nhập)
   * @UseGuards(AuthGuard('account-auth')) - Yêu cầu authentication (JWT token)
   * @ApiBearerAuth('JWT-auth') - Yêu cầu JWT token trong header (Authorization: Bearer <token>)
   */
  @Get()
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy danh sách posts của user hiện tại' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Danh sách posts với pagination', type: [PostDto] })
  getPosts(@Req() req: AuthenticatedRequest, @Query() query?: BaseQueryDto) {
    // Lấy user_id từ JWT token (user đã được authenticate bởi AuthGuard)
    // req.user được set bởi JWT strategy sau khi verify token thành công
    const userId = req.user.id;
    // Gọi service để lấy danh sách posts của user này với pagination
    return this.posts.getPosts(userId, query);
  }

  /**
   * @Get('feed') - HTTP GET method, route: GET /posts/feed
   * Lấy danh sách bài viết trong feed (bài viết từ tất cả users, sắp xếp theo thời gian)
   */
  @Get('feed')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy danh sách bài viết trong feed' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Danh sách posts trong feed với pagination', type: [PostDto] })
  getFeed(@Req() req: AuthenticatedRequest, @Query() query?: BaseQueryDto) {
    // Gọi service để lấy feed posts với pagination
    // userId được dùng để filter posts (ví dụ: không hiển thị posts của user đã block)
    return this.posts.getFeed(req.user.id, query);
  }

  /**
   * @Get(':post_id') - HTTP GET method, route: GET /posts/:post_id
   * Lấy chi tiết 1 bài viết (public endpoint, không cần authentication)
   * @Param('post_id') - Lấy post_id từ URL path
   */
  @Get(':post_id')
  @ApiOperation({ summary: 'Lấy chi tiết 1 bài viết' })
  @ApiParam({ name: 'post_id', description: 'Post ID' })
  @ApiOkResponse({ description: 'Chi tiết post', type: PostDto })
  getPost(@Param('post_id') postId: string, @Req() req?: AuthenticatedRequest) {
    // userId có thể undefined nếu user chưa đăng nhập (optional authentication)
    // Nếu có userId, service sẽ trả về thêm thông tin như: user đã like chưa, user đã comment chưa, etc.
    const userId = req?.user?.id;
    // Gọi service để lấy chi tiết post
    return this.posts.getPostById(postId, userId);
  }

  /**
   * @Post() - HTTP POST method, route: POST /posts
   * Tạo bài viết mới
   * @Body() - Lấy dữ liệu từ request body (content, media, hashtags, privacy, etc.)
   */
  @Post()
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Tạo bài viết' })
  @ApiBody({ type: CreatePostDto })
  @ApiCreatedResponse({
    description: 'Bài viết được tạo thành công',
    type: PostDto,
  })
  createPost(@Body() dto: CreatePostDto, @Req() req: AuthenticatedRequest) {
    // Lấy user_id từ JWT token (user đang tạo post)
    const userId = req.user.id;
    // Gọi service để tạo post mới
    // Service sẽ xử lý: tạo post, upload media, tạo/link hashtags, etc.
    return this.posts.createPost(userId, dto);
  }

  /**
   * @Patch(':post_id') - HTTP PATCH method, route: PATCH /posts/:post_id
   * Cập nhật bài viết (chỉ chủ bài viết mới được update)
   * @Param('post_id') - Lấy post_id từ URL path
   * @Body() - Lấy dữ liệu cần update từ request body
   */
  @Patch(':post_id')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cập nhật bài viết' })
  @ApiBody({ type: UpdatePostDto })
  @ApiOkResponse({
    description: 'Bài viết đã được cập nhật',
    type: PostDto,
  })
  updatePost(
    @Param('post_id') postId: string,
    @Body() dto: UpdatePostDto,
    @Req() req: AuthenticatedRequest,
  ) {
    // Lấy user_id từ JWT token
    // Service sẽ kiểm tra: chỉ cho phép update nếu user_id === post.user_id
    const userId = req.user.id;
    // Gọi service để update post
    return this.posts.updatePost(userId, postId, dto);
  }

  /**
   * @Delete(':post_id') - HTTP DELETE method, route: DELETE /posts/:post_id
   * Xóa bài viết (chỉ chủ bài viết mới được delete)
   * @Param('post_id') - Lấy post_id từ URL path
   */
  @Delete(':post_id')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Xóa bài viết' })
  @ApiOkResponse({
    description: 'Kết quả xóa',
    schema: { type: 'object', properties: { message: { example: 'Post deleted' } } },
  })
  deletePost(@Param('post_id') postId: string, @Req() req: AuthenticatedRequest) {
    // Lấy user_id từ JWT token
    // Service sẽ kiểm tra: chỉ cho phép delete nếu user_id === post.user_id
    const userId = req.user.id;
    // Gọi service để delete post
    // Service sẽ xóa: post, media, hashtags, likes, comments (cascade delete)
    return this.posts.deletePost(userId, postId);
  }
}
