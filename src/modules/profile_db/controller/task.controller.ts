import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { BaseQueryDto } from '../dto/base-query.dto';
import { TaskSummaryDto, CreateTaskDto, UpdateTaskDto } from '../dto/task-summary.dto';
import { TaskService } from '../service/task.service';

@ApiTags('Tasks')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('profile/:user_id/tasks')
export class TaskController {
  constructor(private readonly tasks: TaskService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Tóm tắt nhiệm vụ' })
  @ApiOkResponse({
    description: 'Danh sách nhiệm vụ theo schema Prisma',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { example: 'task-1' },
          user_id: { example: 'user-1' },
          title: { example: 'Do something' },
          is_done: { example: false },
        },
      },
    },
  })
  getTaskSummary(@Param('user_id') userId: string, @Query() query: BaseQueryDto) {
    return this.tasks.getTaskSummary(userId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo nhiệm vụ' })
  @ApiBody({ type: CreateTaskDto })
  createTask(@Param('user_id') userId: string, @Body() dto: CreateTaskDto) {
    return this.tasks.createTask(userId, dto);
  }

  @Patch(':task_id')
  @ApiOperation({ summary: 'Cập nhật nhiệm vụ' })
  @ApiBody({ type: UpdateTaskDto })
  updateTask(
    @Param('user_id') userId: string,
    @Param('task_id') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasks.updateTask(userId, taskId, dto);
  }

  @Delete(':task_id')
  @ApiOperation({ summary: 'Xóa nhiệm vụ' })
  deleteTask(@Param('user_id') userId: string, @Param('task_id') taskId: string) {
    return this.tasks.deleteTask(userId, taskId);
  }
}