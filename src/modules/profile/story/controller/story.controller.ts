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
import { ApiTags, ApiOperation, ApiBody, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { StoryService } from '../service/story.service';
import { CreateStoryDto } from '../dto/story.dto';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';

@ApiTags('Stories')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('profile/:user_id/stories')
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách stories của user' })
  @ApiOkResponse({ description: 'Danh sách stories với pagination' })
  getStories(@Param('user_id') userId: string, @Query() query?: BaseQueryDto) {
    return this.storyService.getStories(userId, query);
  }

  @Get('active')
  @ApiOperation({ summary: 'Lấy danh sách active stories (chưa hết hạn)' })
  @ApiOkResponse({ description: 'Danh sách active stories với pagination' })
  getActiveStories(@Query() query?: BaseQueryDto) {
    return this.storyService.getActiveStories(query);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo story mới' })
  @ApiBody({ type: CreateStoryDto })
  @ApiCreatedResponse({ description: 'Story đã được tạo' })
  createStory(@Param('user_id') userId: string, @Body() dto: CreateStoryDto) {
    return this.storyService.createStory(userId, dto);
  }

  @Delete(':story_id')
  @ApiOperation({ summary: 'Xóa story' })
  @ApiOkResponse({ description: 'Story đã được xóa' })
  deleteStory(@Param('user_id') userId: string, @Param('story_id') storyId: string) {
    return this.storyService.deleteStory(userId, storyId);
  }
}
