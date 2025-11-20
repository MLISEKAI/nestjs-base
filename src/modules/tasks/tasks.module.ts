import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TaskController } from './controller/task.controller';
import { TaskService } from './service/task.service';

@Module({
  imports: [PrismaModule],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TasksModule {}
