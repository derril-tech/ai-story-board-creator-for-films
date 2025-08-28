import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnimaticsController } from './animatics.controller';
import { AnimaticsService } from './animatics.service';
import { Animatic } from '../../entities/animatic.entity';
import { Scene } from '../../entities/scene.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Animatic, Scene])],
  controllers: [AnimaticsController],
  providers: [AnimaticsService],
  exports: [AnimaticsService],
})
export class AnimaticsModule {}
