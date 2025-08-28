import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { AuthModule } from './modules/auth/auth.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ScriptsModule } from './modules/scripts/scripts.module';
import { ScenesModule } from './modules/scenes/scenes.module';
import { ShotsModule } from './modules/shots/shots.module';
import { FramesModule } from './modules/frames/frames.module';
import { DialoguesModule } from './modules/dialogues/dialogues.module';
import { AnimaticsModule } from './modules/animatics/animatics.module';
import { ExportsModule } from './modules/exports/exports.module';
import { CommonModule } from './common/common.module';
import { HealthModule } from './modules/health/health.module';
import { TelemetryModule } from './core/telemetry/telemetry.module';
import { TelemetryInterceptor } from './core/interceptors/telemetry.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'storyboard_creator',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
    PassportModule,
    CommonModule,
    AuthModule,
    ProjectsModule,
    ScriptsModule,
    ScenesModule,
    ShotsModule,
    FramesModule,
    DialoguesModule,
    AnimaticsModule,
    ExportsModule,
    HealthModule,
    TelemetryModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TelemetryInterceptor,
    },
  ],
})
export class AppModule {}
