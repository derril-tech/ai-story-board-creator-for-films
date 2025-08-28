import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelemetryService } from './telemetry.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [TelemetryService],
  exports: [TelemetryService],
})
export class TelemetryModule {}
