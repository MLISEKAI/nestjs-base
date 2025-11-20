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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { CommentService } from '../service/comment.service';
import { CreateCommentDto, UpdateCommentDto } from '../dto/comments.dto';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';

@ApiTags('Post Comments')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('profile/:user_id/posts/:post_id/comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách comments của post' })
  @ApiOkResponse({ description: 'Danh sách comments với pagination' })
  getComments(@Param('post_id') postId: string, @Query() query?: BaseQueryDto) {
    return this.commentService.getComments(postId, query);
  }

  @Get(':comment_id/replies')
  @ApiOperation({ summary: 'Lấy danh sách replies của comment' })
  @ApiOkResponse({ description: 'Danh sách replies với pagination' })
  getCommentReplies(@Param('comment_id') commentId: string, @Query() query?: BaseQueryDto) {
    return this.commentService.getCommentReplies(commentId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo comment mới' })
  @ApiBody({ type: CreateCommentDto })
  @ApiCreatedResponse({ description: 'Comment đã được tạo' })
  createComment(
    @Param('user_id') userId: string,
    @Param('post_id') postId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentService.createComment(userId, postId, dto);
  }

  @Patch(':comment_id')
  @ApiOperation({ summary: 'Cập nhật comment' })
  @ApiBody({ type: UpdateCommentDto })
  @ApiOkResponse({ description: 'Comment đã được cập nhật' })
  updateComment(
    @Param('user_id') userId: string,
    @Param('comment_id') commentId: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentService.updateComment(userId, commentId, dto);
  }

  @Delete(':comment_id')
  @ApiOperation({ summary: 'Xóa comment' })
  @ApiOkResponse({ description: 'Comment đã được xóa' })
  deleteComment(@Param('user_id') userId: string, @Param('comment_id') commentId: string) {
    return this.commentService.deleteComment(userId, commentId);
  }
}
