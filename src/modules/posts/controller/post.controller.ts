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
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CreatePostDto, UpdatePostDto, PostDto } from '../dto';
import { PostService } from '../service/post.service';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import type { AuthenticatedRequest } from '../../../common/interfaces/request.interface';

@ApiTags('Posts')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('posts')
export class PostController {
  constructor(private readonly posts: PostService) {}

  @Get()
  @UseGuards(AuthGuard('account-auth'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy danh sách posts của user hiện tại' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Danh sách posts với pagination', type: [PostDto] })
  getPosts(@Req() req: AuthenticatedRequest, @Query() query?: BaseQueryDto) {
    // Lấy user_id từ JWT token
    const userId = req.user.id;
    return this.posts.getPosts(userId, query);
  }

  @Get(':post_id')
  @ApiOperation({ summary: 'Lấy chi tiết 1 bài viết' })
  @ApiParam({ name: 'post_id', description: 'Post ID' })
  @ApiOkResponse({ description: 'Chi tiết post', type: PostDto })
  getPost(@Param('post_id') postId: string) {
    return this.posts.getPostById(postId);
  }

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
    // Lấy user_id từ JWT token
    const userId = req.user.id;
    return this.posts.createPost(userId, dto);
  }

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
    const userId = req.user.id;
    return this.posts.updatePost(userId, postId, dto);
  }

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
    const userId = req.user.id;
    return this.posts.deletePost(userId, postId);
  }
}
