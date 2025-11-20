import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { LikeService } from '../service/like.service';
import { LikePostDto } from '../dto/likes.dto';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';

@ApiTags('Post Likes')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('profile/:user_id/posts/:post_id/likes')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách likes của post' })
  @ApiOkResponse({ description: 'Danh sách likes với pagination' })
  getLikes(@Param('post_id') postId: string, @Query() query?: BaseQueryDto) {
    return this.likeService.getLikes(postId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Lấy thống kê likes/reactions của post' })
  @ApiOkResponse({ description: 'Thống kê reactions' })
  getLikeStats(@Param('post_id') postId: string) {
    return this.likeService.getLikeStats(postId);
  }

  @Get('check')
  @ApiOperation({ summary: 'Kiểm tra user đã like post chưa' })
  @ApiOkResponse({ description: 'Trạng thái like của user' })
  checkUserLiked(@Param('user_id') userId: string, @Param('post_id') postId: string) {
    return this.likeService.checkUserLiked(userId, postId);
  }

  @Post()
  @ApiOperation({ summary: 'Like/React post' })
  @ApiBody({ type: LikePostDto })
  @ApiOkResponse({ description: 'Post đã được like/react' })
  likePost(
    @Param('user_id') userId: string,
    @Param('post_id') postId: string,
    @Body() dto: LikePostDto,
  ) {
    return this.likeService.likePost(userId, postId, dto);
  }

  @Delete()
  @ApiOperation({ summary: 'Unlike post' })
  @ApiOkResponse({ description: 'Post đã được unlike' })
  unlikePost(@Param('user_id') userId: string, @Param('post_id') postId: string) {
    return this.likeService.unlikePost(userId, postId);
  }
}
