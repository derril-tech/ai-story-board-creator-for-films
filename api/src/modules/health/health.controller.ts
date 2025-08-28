import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { TelemetryService } from '../../core/telemetry/telemetry.service';

@Controller('health')
export class HealthController {
  constructor(private telemetryService: TelemetryService) {}

  @Get()
  async healthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'storyboard-api',
    };
  }

  @Get('metrics')
  async getMetrics(@Res() res: Response) {
    const metrics = await this.telemetryService.getMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  }
}
