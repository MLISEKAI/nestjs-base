import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CommentService } from '../service/comment.service';
import { CreateCommentDto, UpdateCommentDto, CommentDto } from '../dto/comments.dto';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

@ApiTags('Post Comments')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('posts/:post_id/comments')
export class CommentController {
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
  @ApiOperation({ summary: 'Tạo comment mới' })
  @ApiParam({ name: 'post_id', description: 'Post ID', example: 'post-1' })
  @ApiBody({ type: CreateCommentDto })
  @ApiCreatedResponse({ description: 'Comment đã được tạo', type: CommentDto })
  createComment(@Param('post_id') postId: string, @Body() dto: CreateCommentDto, @Req() req: any) {
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
    @Req() req: any,
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
    @Req() req: any,
  ) {
    // Lấy user_id từ JWT token
    const userId = req.user.id;
    return this.commentService.deleteComment(userId, commentId);
  }
}
