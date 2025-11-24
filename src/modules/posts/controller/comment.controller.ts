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
  ApiOkResponse, // Mô tả response thành công (200)
  ApiCreatedResponse, // Mô tả response khi tạo thành công (201)
  ApiBearerAuth, // Yêu cầu JWT token trong header
  ApiParam, // Mô tả path parameter
  ApiQuery, // Mô tả query parameter
} from '@nestjs/swagger';
// Import AuthGuard từ Passport để xác thực JWT token
import { AuthGuard } from '@nestjs/passport';
// Import CommentService để xử lý business logic
import { CommentService } from '../service/comment.service';
// Import các DTO để validate và type-check dữ liệu
import { CreateCommentDto, UpdateCommentDto, CommentDto } from '../dto/comments.dto';
// Import BaseQueryDto cho pagination
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
// Import interface để type-check request có user authenticated
import type { AuthenticatedRequest } from '../../../common/interfaces/request.interface';

/**
 * @ApiTags('Post Comments') - Nhóm các endpoints này trong Swagger UI với tag "Post Comments"
 * @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
 *   - transform: true - Tự động transform dữ liệu
 *   - whitelist: true - Chỉ giữ lại các properties được định nghĩa trong DTO
 * @Controller('posts/:post_id/comments') - Định nghĩa base route là /posts/:post_id/comments
 * CommentController - Controller xử lý các HTTP requests liên quan đến comments của posts
 */
@ApiTags('Post Comments')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('posts/:post_id/comments')
export class CommentController {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject CommentService khi tạo instance của controller
   */
  constructor(private readonly commentService: CommentService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách comments của post' })
  @ApiParam({ name: 'post_id', description: 'Post ID', example: 'post-1' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiOkResponse({ description: 'Danh sách comments với pagination', type: [CommentDto] })
  getComments(@Param('post_id') postId: string, @Query() query?: BaseQueryDto) {
    return this.commentService.getComments(postId, query);
  }

  @Get(':comment_id/replies')
  @ApiOperation({ summary: 'Lấy danh sách replies của comment' })
  @ApiParam({ name: 'post_id', description: 'Post ID', example: 'post-1' })
  @ApiParam({ name: 'comment_id', description: 'Comment ID', example: 'comment-1' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiOkResponse({ description: 'Danh sách replies với pagination', type: [CommentDto] })
  getCommentReplies(
    @Param('post_id') postId: string,
    @Param('comment_id') commentId: string,
    @Query() query?: BaseQueryDto,
  ) {
    return this.commentService.getCommentReplies(commentId, query);
  }

  @Post()
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Tạo comment mới',
    description:
      'Tạo comment đầu tiên: chỉ cần content, KHÔNG cần parent_id.\nTạo reply: cần content + parent_id (UUID của comment muốn reply).',
  })
  @ApiParam({ name: 'post_id', description: 'Post ID', example: 'post-1' })
  @ApiBody({
    type: CreateCommentDto,
    examples: {
      'top-level-comment': {
        summary: 'Tạo comment đầu tiên (top-level)',
        description: 'Comment trực tiếp trên post, không reply ai cả',
        value: {
          content: 'Great post!',
          // parent_id: không cần gửi hoặc để null
        },
      },
      'reply-comment': {
        summary: 'Reply một comment',
        description: 'Reply comment đã có (cần UUID của comment cha)',
        value: {
          content: 'I agree with you!',
          parent_id: 'top-level-comment-ID', // UUID của comment muốn reply
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Comment đã được tạo', type: CommentDto })
  createComment(
    @Param('post_id') postId: string,
    @Body() dto: CreateCommentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    // Lấy user_id từ JWT token
    const userId = req.user.id;
    return this.commentService.createComment(userId, postId, dto);
  }

  @Patch(':comment_id')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cập nhật comment' })
  @ApiParam({ name: 'post_id', description: 'Post ID', example: 'post-1' })
  @ApiParam({ name: 'comment_id', description: 'Comment ID', example: 'comment-1' })
  @ApiBody({ type: UpdateCommentDto })
  @ApiOkResponse({ description: 'Comment đã được cập nhật', type: CommentDto })
  updateComment(
    @Param('post_id') postId: string,
    @Param('comment_id') commentId: string,
    @Body() dto: UpdateCommentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    // Lấy user_id từ JWT token
    const userId = req.user.id;
    return this.commentService.updateComment(userId, commentId, dto);
  }

  @Delete(':comment_id')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Xóa comment' })
  @ApiParam({ name: 'post_id', description: 'Post ID', example: 'post-1' })
  @ApiParam({ name: 'comment_id', description: 'Comment ID', example: 'comment-1' })
  @ApiOkResponse({ description: 'Comment đã được xóa' })
  deleteComment(
    @Param('post_id') postId: string,
    @Param('comment_id') commentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    // Lấy user_id từ JWT token
    const userId = req.user.id;
    return this.commentService.deleteComment(userId, commentId);
  }
}
