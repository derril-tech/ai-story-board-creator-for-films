import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FramesController } from './frames.controller';
import { FramesService } from './frames.service';
import { Frame } from '../../entities/frame.entity';
import { Shot } from '../../entities/shot.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Frame, Shot])],
  controllers: [FramesController],
  providers: [FramesService],
  exports: [FramesService],
})
export class FramesModule {}
