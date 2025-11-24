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
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LikeService } from '../service/like.service';
import { LikePostDto, PostLikeDto, LikeStatsDto, CheckUserLikedDto } from '../dto/likes.dto';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

@ApiTags('Post Likes')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('posts/:post_id/likes')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách likes của post' })
  @ApiParam({ name: 'post_id', description: 'Post ID', example: 'post-1' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiOkResponse({ description: 'Danh sách likes với pagination', type: [PostLikeDto] })
  getLikes(@Param('post_id') postId: string, @Query() query?: BaseQueryDto) {
    return this.likeService.getLikes(postId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Lấy thống kê likes/reactions của post' })
  @ApiParam({ name: 'post_id', description: 'Post ID', example: 'post-1' })
  @ApiOkResponse({ description: 'Thống kê reactions', type: LikeStatsDto })
  getLikeStats(@Param('post_id') postId: string) {
    return this.likeService.getLikeStats(postId);
  }

  @Get('check')
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Kiểm tra user đã like post chưa' })
  @ApiParam({ name: 'post_id', description: 'Post ID', example: 'post-1' })
  @ApiOkResponse({ description: 'Trạng thái like của user', type: CheckUserLikedDto })
  checkUserLiked(@Param('post_id') postId: string, @Req() req: any) {
    // Lấy user_id từ JWT token
    const userId = req.user.id;
    return this.likeService.checkUserLiked(userId, postId);
  }

  @Post()
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Like/React post' })
  @ApiParam({ name: 'post_id', description: 'Post ID', example: 'post-1' })
  @ApiBody({ type: LikePostDto })
  @ApiOkResponse({ description: 'Post đã được like/react', type: PostLikeDto })
  likePost(@Param('post_id') postId: string, @Body() dto: LikePostDto, @Req() req: any) {
    // Lấy user_id từ JWT token
    const userId = req.user.id;
    return this.likeService.likePost(userId, postId, dto);
  }

  @Delete()
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Unlike post' })
  @ApiParam({ name: 'post_id', description: 'Post ID', example: 'post-1' })
  @ApiOkResponse({ description: 'Post đã được unlike' })
  unlikePost(@Param('post_id') postId: string, @Req() req: any) {
    // Lấy user_id từ JWT token
    const userId = req.user.id;
    return this.likeService.unlikePost(userId, postId);
  }
}
