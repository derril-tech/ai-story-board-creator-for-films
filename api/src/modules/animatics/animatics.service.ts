import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { Animatic } from '../../entities/animatic.entity';
import { Scene } from '../../entities/scene.entity';
import { GenerateAnimaticDto, CreateAnimaticDto, UpdateAnimaticDto } from './dto/animatics.dto';

@Injectable()
export class AnimaticsService {
  private readonly animaticWorkerUrl = process.env.ANIMATIC_WORKER_URL || 'http://localhost:8004';

  constructor(
    @InjectRepository(Animatic)
    private animaticRepository: Repository<Animatic>,
    @InjectRepository(Scene)
    private sceneRepository: Repository<Scene>,
  ) {}

  async generateAnimatic(generateAnimaticDto: GenerateAnimaticDto) {
    try {
      // Call animatic worker
      const response = await axios.post(
        `${this.animaticWorkerUrl}/animatics/generate`,
        {
          scene_id: generateAnimaticDto.sceneId,
          format: generateAnimaticDto.format,
          include_captions: generateAnimaticDto.includeCaptions,
          caption_style: generateAnimaticDto.captionStyle,
          audio_track: generateAnimaticDto.audioTrack,
          custom_music_url: generateAnimaticDto.customMusicUrl,
          frame_duration: generateAnimaticDto.frameDuration,
          transition_duration: generateAnimaticDto.transitionDuration,
          resolution: generateAnimaticDto.resolution,
          frame_rate: generateAnimaticDto.frameRate,
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to generate animatic: ${error.message}`);
    }
  }

  async getAnimaticStatus(id: string) {
    try {
      const response = await axios.get(
        `${this.animaticWorkerUrl}/animatics/${id}/status`
      );
      return response.data;
    } catch (error) {
      throw new NotFoundException('Animatic not found');
    }
  }

  async getAnimatic(id: string) {
    try {
      const response = await axios.get(
        `${this.animaticWorkerUrl}/animatics/${id}`
      );
      return response.data;
    } catch (error) {
      throw new NotFoundException('Animatic not found');
    }
  }

  async getSceneTimeline(sceneId: number) {
    try {
      const response = await axios.get(
        `${this.animaticWorkerUrl}/animatics/scene/${sceneId}/timeline`
      );
      return response.data;
    } catch (error) {
      throw new NotFoundException('Scene not found');
    }
  }

  async getAnimatics(filters: {
    projectId?: number;
    sceneId?: number;
    page?: number;
    limit?: number;
  }) {
    const query = this.animaticRepository.createQueryBuilder('animatic')
      .leftJoinAndSelect('animatic.scene', 'scene');

    if (filters.projectId) {
      query.andWhere('scene.projectId = :projectId', { projectId: filters.projectId });
    }

    if (filters.sceneId) {
      query.andWhere('animatic.sceneId = :sceneId', { sceneId: filters.sceneId });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [animatics, total] = await query
      .skip(skip)
      .take(limit)
      .orderBy('animatic.createdAt', 'DESC')
      .getManyAndCount();

    return {
      animatics,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async createAnimatic(createAnimaticDto: CreateAnimaticDto) {
    const animatic = this.animaticRepository.create({
      ...createAnimaticDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.animaticRepository.save(animatic);
  }

  async updateAnimatic(id: string, updateAnimaticDto: UpdateAnimaticDto) {
    const animatic = await this.animaticRepository.findOne({ where: { id } });
    if (!animatic) {
      throw new NotFoundException('Animatic not found');
    }

    Object.assign(animatic, {
      ...updateAnimaticDto,
      updatedAt: new Date(),
    });

    return this.animaticRepository.save(animatic);
  }

  async deleteAnimatic(id: string) {
    try {
      // Delete from animatic worker
      await axios.delete(`${this.animaticWorkerUrl}/animatics/${id}`);
    } catch (error) {
      // Continue even if worker deletion fails
    }

    const animatic = await this.animaticRepository.findOne({ where: { id } });
    if (!animatic) {
      throw new NotFoundException('Animatic not found');
    }

    await this.animaticRepository.remove(animatic);
    return { message: 'Animatic deleted successfully' };
  }

  async getFormats() {
    try {
      const response = await axios.get(
        `${this.animaticWorkerUrl}/animatics/formats`
      );
      return response.data;
    } catch (error) {
      // Return default formats if worker is unavailable
      return {
        formats: ['mp4', 'mov', 'avi'],
        default: 'mp4',
        recommended: 'mp4',
      };
    }
  }

  async getCaptionStyles() {
    try {
      const response = await axios.get(
        `${this.animaticWorkerUrl}/animatics/caption-styles`
      );
      return response.data;
    } catch (error) {
      // Return default styles if worker is unavailable
      return {
        styles: [
          { id: 'none', name: 'No Captions', description: 'No captions displayed' },
          { id: 'simple', name: 'Simple', description: 'Basic scene/shot labels' },
          { id: 'detailed', name: 'Detailed', description: 'Scene/shot labels with timing' },
          { id: 'custom', name: 'Custom', description: 'User-defined captions' },
        ],
      };
    }
  }
}
