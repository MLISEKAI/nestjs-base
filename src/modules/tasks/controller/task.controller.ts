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
import { ApiTags, ApiOperation, ApiBody, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { TaskSummaryDto, CreateTaskDto, UpdateTaskDto } from '../dto/task-summary.dto';
import { TaskService } from '../service/task.service';
import type { AuthenticatedRequest } from '../../../common/interfaces/request.interface';

/**
 * User Tasks Controller - Yêu cầu authentication
 * User chỉ có thể xem/sửa tasks của chính mình
 */
@ApiTags('Tasks (User)')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard('account-auth'))
@ApiBearerAuth('JWT-auth')
@Controller('tasks')
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
  getTaskSummary(@Req() req: AuthenticatedRequest, @Query() query: BaseQueryDto) {
    const userId = req.user.id;
    return this.tasks.getTaskSummary(userId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo nhiệm vụ cho user hiện tại' })
  @ApiBody({ type: CreateTaskDto })
  createTask(@Req() req: AuthenticatedRequest, @Body() dto: CreateTaskDto) {
    const userId = req.user.id;
    return this.tasks.createTask(userId, dto);
  }

  @Patch(':task_id')
  @ApiOperation({ summary: 'Cập nhật nhiệm vụ của user hiện tại' })
  @ApiBody({ type: UpdateTaskDto })
  updateTask(
    @Req() req: AuthenticatedRequest,
    @Param('task_id') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    const userId = req.user.id;
    return this.tasks.updateTask(userId, taskId, dto);
  }

  @Delete(':task_id')
  @ApiOperation({ summary: 'Xóa nhiệm vụ của user hiện tại' })
  deleteTask(@Req() req: AuthenticatedRequest, @Param('task_id') taskId: string) {
    const userId = req.user.id;
    return this.tasks.deleteTask(userId, taskId);
  }
}
