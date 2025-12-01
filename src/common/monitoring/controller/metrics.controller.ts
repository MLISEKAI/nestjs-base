import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MetricsService } from '../metrics.service';

/**
 * MetricsController - Expose Prometheus metrics
 */
@ApiTags('Monitoring')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4')
  @ApiOperation({ summary: 'Get Prometheus metrics' })
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }

  @Get('json')
  @ApiOperation({ summary: 'Get metrics as JSON (for dashboard)' })
  async getMetricsJson() {
    return this.metricsService.getMetricsJson();
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get active alerts' })
  getAlerts() {
    return {
      alerts: this.metricsService.getAlerts(),
    };
  }
}
