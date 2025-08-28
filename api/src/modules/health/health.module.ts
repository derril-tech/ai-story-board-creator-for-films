import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { TelemetryModule } from '../../core/telemetry/telemetry.module';

@Module({
  imports: [TelemetryModule],
  controllers: [HealthController],
})
export class HealthModule {}
