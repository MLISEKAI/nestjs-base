import {
  Controller,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { CreatePostDto, UpdatePostDto } from '../dto';
import { PostService } from '../service/post.service';

@ApiTags('Posts')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('profile/:user_id/posts')
export class PostController {
  constructor(private readonly posts: PostService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo bài viết' })
  @ApiBody({ type: CreatePostDto })
  @ApiCreatedResponse({
    description: 'Bài viết được tạo theo schema Prisma',
    schema: {
      type: 'object',
      properties: {
        id: { example: 'post-1' },
        user_id: { example: 'user-1' },
        content: { example: 'Hello world' },
        created_at: { example: '2025-11-12T00:00:00.000Z' },
      },
    },
  })
  createPost(@Param('user_id') userId: string, @Body() dto: CreatePostDto) {
    return this.posts.createPost(userId, dto);
  }

  @Patch(':post_id')
  @ApiOperation({ summary: 'Cập nhật bài viết' })
  @ApiBody({ type: UpdatePostDto })
  @ApiOkResponse({
    description: 'Bài viết sau cập nhật theo schema Prisma',
    schema: {
      type: 'object',
      properties: {
        id: { example: 'post-1' },
        user_id: { example: 'user-1' },
        content: { example: 'Updated content' },
        created_at: { example: '2025-11-12T00:00:00.000Z' },
      },
    },
  })
  updatePost(
    @Param('user_id') userId: string,
    @Param('post_id') postId: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.posts.updatePost(userId, postId, dto);
  }

  @Delete(':post_id')
  @ApiOperation({ summary: 'Xóa bài viết' })
  @ApiOkResponse({
    description: 'Kết quả xóa',
    schema: { type: 'object', properties: { message: { example: 'Post deleted' } } },
  })
  deletePost(@Param('user_id') userId: string, @Param('post_id') postId: string) {
    return this.posts.deletePost(userId, postId);
  }
}
