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
  @ApiOperation({
    summary: 'Lấy danh sách comments của post',
    description:
      'Lấy comments với thông tin user, relationship status (following/friend/follower), và post reactions. Nếu authenticated, sẽ hiển thị relationship với user đang xem.',
  })
  @ApiParam({ name: 'post_id', description: 'Post ID', example: 'post-1' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiOkResponse({
    description: 'Danh sách comments với pagination, relationship status, và post reactions',
    schema: {
      type: 'object',
      properties: {
        post_reactions: {
          type: 'object',
          properties: {
            like_count: { type: 'number', example: 150 },
            comment_count: { type: 'number', example: 25 },
          },
        },
        comments: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  content: { type: 'string' },
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      nickname: { type: 'string' },
                      avatar: { type: 'string' },
                      bio: { type: 'string' },
                      is_following: { type: 'boolean', description: 'Current user is following this user' },
                      is_friend: { type: 'boolean', description: 'Current user is friend with this user' },
                      is_follower: { type: 'boolean', description: 'This user is following current user' },
                    },
                  },
                  media: { type: 'array' },
                  replies_count: { type: 'number' },
                  created_at: { type: 'string' },
                },
              },
            },
            meta: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                page: { type: 'number' },
                limit: { type: 'number' },
                totalPages: { type: 'number' },
              },
            },
          },
        },
      },
    },
  })
  getComments(
    @Param('post_id') postId: string,
    @Query() query?: BaseQueryDto,
    @Req() req?: AuthenticatedRequest,
  ) {
    // Lấy currentUserId nếu user đã authenticated (optional)
    const currentUserId = req?.user?.id;
    return this.commentService.getComments(postId, query, currentUserId);
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
      'Tạo comment đầu tiên: chỉ cần content, KHÔNG cần parent_id.\n' +
      'Tạo reply: cần content + parent_id (UUID của comment muốn reply).\n' +
      'Có thể thêm media (image, video, audio) vào comment.\n\n' +
      '⚠️ FACEBOOK STYLE: Chỉ có 2 cấp comment (giống Facebook):\n' +
      '- Cấp 1: Comment trực tiếp trên post (parent_id = null)\n' +
      '- Cấp 2: Tất cả replies đều ngang hàng (parent_id = comment cấp 1)\n' +
      '- Khi reply vào reply cấp 2, hệ thống tự động gán parent_id về comment gốc cấp 1\n' +
      '- Không có cấp 3, 4, 5... (khác với nested comments)',
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
        },
      },
      'reply-comment': {
        summary: 'Reply một comment',
        description: 'Reply comment đã có (cần UUID của comment cha)',
        value: {
          content: 'I agree with you!',
          parent_id: 'top-level-comment-ID',
        },
      },
      'comment-with-image': {
        summary: 'Comment với image',
        description: 'Comment có kèm ảnh',
        value: {
          content: 'Check out this image!',
          media: [
            {
              media_url: 'https://cloudinary.com/image.jpg',
              media_type: 'image',
              width: 1920,
              height: 1080,
              order: 0,
            },
          ],
        },
      },
      'comment-with-video': {
        summary: 'Comment với video',
        description: 'Comment có kèm video',
        value: {
          content: 'Watch this video!',
          media: [
            {
              media_url: 'https://cloudinary.com/video.mp4',
              thumbnail_url: 'https://cloudinary.com/video-thumb.jpg',
              media_type: 'video',
              order: 0,
            },
          ],
        },
      },
      'comment-with-audio': {
        summary: 'Comment với audio',
        description: 'Comment có kèm audio',
        value: {
          content: 'Listen to this!',
          media: [
            {
              media_url: 'https://cloudinary.com/audio.mp3',
              media_type: 'audio',
              duration: 120,
              order: 0,
            },
          ],
        },
      },
      'comment-media-only': {
        summary: 'Comment chỉ có media (không có text)',
        description: 'Comment không có text, chỉ có media',
        value: {
          media: [
            {
              media_url: 'https://cloudinary.com/image.jpg',
              media_type: 'image',
              width: 1920,
              height: 1080,
              order: 0,
            },
          ],
        },
      },
      'comment-multiple-media': {
        summary: 'Comment với nhiều media',
        description: 'Comment có nhiều ảnh/video/audio',
        value: {
          content: 'Multiple attachments',
          media: [
            {
              media_url: 'https://cloudinary.com/image1.jpg',
              media_type: 'image',
              width: 1920,
              height: 1080,
              order: 0,
            },
            {
              media_url: 'https://cloudinary.com/image2.jpg',
              media_type: 'image',
              width: 1280,
              height: 720,
              order: 1,
            },
            {
              media_url: 'https://cloudinary.com/video.mp4',
              thumbnail_url: 'https://cloudinary.com/video-thumb.jpg',
              media_type: 'video',
              order: 2,
            },
          ],
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
  @ApiOperation({
    summary: 'Cập nhật comment',
    description:
      'Cập nhật content và/hoặc media của comment.\nNếu gửi media array, sẽ thay thế toàn bộ media cũ.\nNếu không gửi media field, media cũ được giữ nguyên.',
  })
  @ApiParam({ name: 'post_id', description: 'Post ID', example: 'post-1' })
  @ApiParam({ name: 'comment_id', description: 'Comment ID', example: 'comment-1' })
  @ApiBody({
    type: UpdateCommentDto,
    examples: {
      'update-content-only': {
        summary: 'Chỉ update content',
        description: 'Chỉ thay đổi text, giữ nguyên media',
        value: {
          content: 'Updated comment text',
        },
      },
      'update-media-only': {
        summary: 'Chỉ update media',
        description: 'Thay đổi media, giữ nguyên content',
        value: {
          media: [
            {
              media_url: 'https://cloudinary.com/new-image.jpg',
              media_type: 'image',
              width: 1920,
              height: 1080,
              order: 0,
            },
          ],
        },
      },
      'update-both': {
        summary: 'Update cả content và media',
        description: 'Thay đổi cả text và media',
        value: {
          content: 'Updated with new media',
          media: [
            {
              media_url: 'https://cloudinary.com/new-video.mp4',
              thumbnail_url: 'https://cloudinary.com/new-thumb.jpg',
              media_type: 'video',
              order: 0,
            },
          ],
        },
      },
      'remove-all-media': {
        summary: 'Xóa tất cả media',
        description: 'Xóa hết media, chỉ giữ text',
        value: {
          content: 'Text only now',
          media: [],
        },
      },
      'add-media-to-text': {
        summary: 'Thêm media vào comment text-only',
        description: 'Comment ban đầu chỉ có text, giờ thêm media',
        value: {
          media: [
            {
              media_url: 'https://cloudinary.com/image.jpg',
              media_type: 'image',
              width: 1920,
              height: 1080,
              order: 0,
            },
          ],
        },
      },
    },
  })
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

