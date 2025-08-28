import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Frame } from '../../entities/frame.entity';
import { Shot } from '../../entities/shot.entity';
import {
  CreateFrameDto,
  UpdateFrameDto,
  GenerateFrameDto,
  BatchGenerateFramesDto,
  FrameStyle,
} from './dto/frames.dto';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class FramesService {
  private readonly illustrationWorkerUrl: string;

  constructor(
    @InjectRepository(Frame)
    private readonly frameRepository: Repository<Frame>,
    @InjectRepository(Shot)
    private readonly shotRepository: Repository<Shot>,
    private readonly configService: ConfigService,
  ) {
    this.illustrationWorkerUrl = this.configService.get<string>('ILLUSTRATION_WORKER_URL', 'http://localhost:8003');
  }

  async generateFrame(generateFrameDto: GenerateFrameDto) {
    try {
      // Verify shot exists
      const shot = await this.shotRepository.findOne({
        where: { id: generateFrameDto.shotId },
      });

      if (!shot) {
        throw new HttpException('Shot not found', HttpStatus.NOT_FOUND);
      }

      // Call illustration worker
      const response = await axios.post(
        `${this.illustrationWorkerUrl}/frames/generate`,
        {
          shot_id: generateFrameDto.shotId,
          style: generateFrameDto.style,
          shot_metadata: generateFrameDto.shotMetadata,
          characters: generateFrameDto.characters,
          location: generateFrameDto.location,
          action_description: generateFrameDto.actionDescription,
          dialogue: generateFrameDto.dialogue,
          custom_prompt: generateFrameDto.customPrompt,
          negative_prompt: generateFrameDto.negativePrompt,
          seed: generateFrameDto.seed,
        },
        {
          timeout: 30000, // 30 second timeout
        },
      );

      // Create frame record in database
      const frame = this.frameRepository.create({
        shotId: generateFrameDto.shotId,
        imageUrl: response.data.image_url || '',
        promptUsed: response.data.prompt_used || '',
        metadata: response.data.metadata || {},
        status: response.data.status || 'generating',
      });

      await this.frameRepository.save(frame);

      return {
        frameId: frame.id,
        imageUrl: frame.imageUrl,
        promptUsed: frame.promptUsed,
        metadata: frame.metadata,
        status: frame.status,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Frame generation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async batchGenerateFrames(batchGenerateDto: BatchGenerateFramesDto) {
    try {
      // Verify all shots exist
      const shots = await this.shotRepository.findByIds(batchGenerateDto.shotIds);
      if (shots.length !== batchGenerateDto.shotIds.length) {
        throw new HttpException('One or more shots not found', HttpStatus.NOT_FOUND);
      }

      // Call illustration worker for batch generation
      const response = await axios.post(
        `${this.illustrationWorkerUrl}/frames/batch`,
        {
          shot_ids: batchGenerateDto.shotIds,
          style: batchGenerateDto.style,
          batch_size: batchGenerateDto.batchSize,
        },
        {
          timeout: 60000, // 60 second timeout for batch operations
        },
      );

      return {
        batchId: response.data.batch_id,
        totalFrames: response.data.total_frames,
        status: response.data.status,
        frameIds: response.data.frame_ids || [],
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Batch frame generation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getFrameStatus(frameId: string) {
    try {
      // First check local database
      const frame = await this.frameRepository.findOne({
        where: { id: frameId },
      });

      if (!frame) {
        throw new HttpException('Frame not found', HttpStatus.NOT_FOUND);
      }

      // If still generating, check with illustration worker
      if (frame.status === 'generating') {
        try {
          const response = await axios.get(
            `${this.illustrationWorkerUrl}/frames/${frameId}/status`,
            { timeout: 10000 },
          );

          // Update local status
          frame.status = response.data.status;
          frame.metadata = { ...frame.metadata, ...response.data };
          await this.frameRepository.save(frame);

          return response.data;
        } catch (workerError) {
          // If worker is unavailable, return local status
          return {
            frame_id: frame.id,
            status: frame.status,
            progress: frame.metadata?.progress || 0,
            estimated_completion: frame.metadata?.estimated_completion,
            error_message: frame.metadata?.error_message,
          };
        }
      }

      return {
        frame_id: frame.id,
        status: frame.status,
        progress: frame.metadata?.progress || 1.0,
        estimated_completion: frame.metadata?.estimated_completion,
        error_message: frame.metadata?.error_message,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to get frame status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getBatchStatus(batchId: string) {
    try {
      const response = await axios.get(
        `${this.illustrationWorkerUrl}/frames/batch/${batchId}/status`,
        { timeout: 10000 },
      );

      return response.data;
    } catch (error) {
      throw new HttpException(
        `Failed to get batch status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getStylePresets() {
    try {
      const response = await axios.get(
        `${this.illustrationWorkerUrl}/frames/styles`,
        { timeout: 10000 },
      );

      return response.data;
    } catch (error) {
      throw new HttpException(
        `Failed to get style presets: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getFrames(shotId?: string) {
    try {
      const query = this.frameRepository.createQueryBuilder('frame');

      if (shotId) {
        query.where('frame.shotId = :shotId', { shotId });
      }

      query.orderBy('frame.createdAt', 'DESC');

      const frames = await query.getMany();

      return frames.map(frame => ({
        id: frame.id,
        shotId: frame.shotId,
        imageUrl: frame.imageUrl,
        promptUsed: frame.promptUsed,
        metadata: frame.metadata,
        status: frame.status,
        createdAt: frame.createdAt,
        updatedAt: frame.updatedAt,
      }));
    } catch (error) {
      throw new HttpException(
        `Failed to get frames: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getFrame(id: string) {
    try {
      const frame = await this.frameRepository.findOne({
        where: { id },
      });

      if (!frame) {
        throw new HttpException('Frame not found', HttpStatus.NOT_FOUND);
      }

      return {
        id: frame.id,
        shotId: frame.shotId,
        imageUrl: frame.imageUrl,
        promptUsed: frame.promptUsed,
        metadata: frame.metadata,
        status: frame.status,
        createdAt: frame.createdAt,
        updatedAt: frame.updatedAt,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to get frame: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createFrame(createFrameDto: CreateFrameDto) {
    try {
      const frame = this.frameRepository.create(createFrameDto);
      await this.frameRepository.save(frame);

      return {
        id: frame.id,
        shotId: frame.shotId,
        imageUrl: frame.imageUrl,
        promptUsed: frame.promptUsed,
        metadata: frame.metadata,
        status: frame.status,
        createdAt: frame.createdAt,
        updatedAt: frame.updatedAt,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to create frame: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateFrame(id: string, updateFrameDto: UpdateFrameDto) {
    try {
      const frame = await this.frameRepository.findOne({
        where: { id },
      });

      if (!frame) {
        throw new HttpException('Frame not found', HttpStatus.NOT_FOUND);
      }

      Object.assign(frame, updateFrameDto);
      await this.frameRepository.save(frame);

      return {
        id: frame.id,
        shotId: frame.shotId,
        imageUrl: frame.imageUrl,
        promptUsed: frame.promptUsed,
        metadata: frame.metadata,
        status: frame.status,
        createdAt: frame.createdAt,
        updatedAt: frame.updatedAt,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to update frame: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteFrame(id: string) {
    try {
      const frame = await this.frameRepository.findOne({
        where: { id },
      });

      if (!frame) {
        throw new HttpException('Frame not found', HttpStatus.NOT_FOUND);
      }

      // Also delete from illustration worker if possible
      try {
        await axios.delete(`${this.illustrationWorkerUrl}/frames/${id}`, {
          timeout: 10000,
        });
      } catch (workerError) {
        // Log but don't fail if worker is unavailable
        console.warn(`Failed to delete frame from worker: ${workerError.message}`);
      }

      await this.frameRepository.remove(frame);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to delete frame: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async regenerateFrame(frameId: string, generateFrameDto: GenerateFrameDto) {
    try {
      const frame = await this.frameRepository.findOne({
        where: { id: frameId },
      });

      if (!frame) {
        throw new HttpException('Frame not found', HttpStatus.NOT_FOUND);
      }

      // Call illustration worker for regeneration
      const response = await axios.post(
        `${this.illustrationWorkerUrl}/frames/${frameId}/regenerate`,
        {
          shot_id: generateFrameDto.shotId,
          style: generateFrameDto.style,
          shot_metadata: generateFrameDto.shotMetadata,
          characters: generateFrameDto.characters,
          location: generateFrameDto.location,
          action_description: generateFrameDto.actionDescription,
          dialogue: generateFrameDto.dialogue,
          custom_prompt: generateFrameDto.customPrompt,
          negative_prompt: generateFrameDto.negativePrompt,
          seed: generateFrameDto.seed,
        },
        {
          timeout: 30000,
        },
      );

      // Create new frame record
      const newFrame = this.frameRepository.create({
        shotId: generateFrameDto.shotId,
        imageUrl: response.data.image_url || '',
        promptUsed: response.data.prompt_used || '',
        metadata: {
          ...response.data.metadata,
          originalFrameId: frameId,
        },
        status: response.data.status || 'generating',
      });

      await this.frameRepository.save(newFrame);

      return {
        frameId: newFrame.id,
        imageUrl: newFrame.imageUrl,
        promptUsed: newFrame.promptUsed,
        metadata: newFrame.metadata,
        status: newFrame.status,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Frame regeneration failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
