import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class TaskSummaryDto {
  @ApiProperty({ example: 'task-1' })
  id: string;

  @ApiProperty({ example: 'user-1' })
  user_id: string;

  @IsNumber()
  @ApiProperty({ example: 10 })
  totalTasks: number;

  @IsNumber()
  @ApiProperty({ example: 7 })
  completedTasks: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ example: 3 })
  pendingTasks?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'Well done!' })
  note?: string;
}

export class CreateTaskDto {
  @ApiProperty({ example: 'Do something' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_done?: boolean;
}

export class UpdateTaskDto {
  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_done?: boolean;
}
