import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { PerformanceService } from '../performance.service';

@ApiTags('Performance Monitoring')
@Controller('performance')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Lấy metrics hiệu năng hệ thống' })
  @ApiOkResponse({
    description: 'Performance metrics',
    schema: {
      type: 'object',
      properties: {
        totalQueries: { type: 'number', example: 150 },
        slowQueries: { type: 'number', example: 5 },
        averageQueryTime: { type: 'number', example: 45.5 },
        slowestQuery: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            duration: { type: 'number' },
            model: { type: 'string' },
            operation: { type: 'string' },
          },
        },
        queriesByModel: {
          type: 'object',
          example: { ResUser: 50, ResGift: 30, ResMessage: 20 },
        },
      },
    },
  })
  getMetrics() {
    return this.performanceService.getMetrics();
  }

  @Get('slow-queries')
  @ApiOperation({ summary: 'Lấy danh sách slow queries' })
  @ApiOkResponse({
    description: 'List of slow queries',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          duration: { type: 'number' },
          model: { type: 'string' },
          operation: { type: 'string' },
          timestamp: { type: 'string' },
        },
      },
    },
  })
  getSlowQueries() {
    return this.performanceService.getSlowQueries(20);
  }

  @Get('model-stats')
  @ApiOperation({ summary: 'Thống kê queries theo model' })
  @ApiOkResponse({
    description: 'Statistics by model',
    schema: {
      type: 'object',
      example: {
        ResUser: {
          count: 50,
          avgDuration: 45.5,
          maxDuration: 120,
          minDuration: 10,
        },
      },
    },
  })
  getModelStatistics() {
    return this.performanceService.getModelStatistics();
  }

  @Post('reset')
  @ApiOperation({ summary: 'Reset metrics hiệu năng hệ thống' })
  @ApiOkResponse({
    description: 'Metrics đã được reset thành công',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Metrics đã được reset thành công' },
      },
    },
  })
  resetMetrics() {
    this.performanceService.resetMetrics();
    return { message: 'Metrics đã được reset thành công' };
  }
}
