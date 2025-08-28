import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { Export } from '../../entities/export.entity';
import { Project } from '../../entities/project.entity';
import { GenerateExportDto } from './dto/exports.dto';

@Injectable()
export class ExportsService {
  private readonly exportWorkerUrl = process.env.EXPORT_WORKER_URL || 'http://localhost:8005';

  constructor(
    @InjectRepository(Export)
    private exportRepository: Repository<Export>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  async generateExport(generateExportDto: GenerateExportDto) {
    try {
      // Call export worker
      const response = await axios.post(
        `${this.exportWorkerUrl}/exports/generate`,
        {
          project_id: generateExportDto.projectId,
          format: generateExportDto.format,
          include_frames: generateExportDto.includeFrames,
          include_metadata: generateExportDto.includeMetadata,
          layout: generateExportDto.layout,
          quality: generateExportDto.quality,
          custom_options: generateExportDto.customOptions,
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to generate export: ${error.message}`);
    }
  }

  async getExportStatus(id: string) {
    try {
      const response = await axios.get(
        `${this.exportWorkerUrl}/exports/${id}/status`
      );
      return response.data;
    } catch (error) {
      throw new NotFoundException('Export not found');
    }
  }

  async getExport(id: string) {
    try {
      const response = await axios.get(
        `${this.exportWorkerUrl}/exports/${id}`
      );
      return response.data;
    } catch (error) {
      throw new NotFoundException('Export not found');
    }
  }

  async getProjectExportSummary(projectId: number) {
    try {
      const response = await axios.get(
        `${this.exportWorkerUrl}/exports/project/${projectId}/summary`
      );
      return response.data;
    } catch (error) {
      throw new NotFoundException('Project not found');
    }
  }

  async getExports(filters: {
    projectId?: number;
    format?: string;
    page?: number;
    limit?: number;
  }) {
    const query = this.exportRepository.createQueryBuilder('export')
      .leftJoinAndSelect('export.project', 'project');

    if (filters.projectId) {
      query.andWhere('export.projectId = :projectId', { projectId: filters.projectId });
    }

    if (filters.format) {
      query.andWhere('export.format = :format', { format: filters.format });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [exports, total] = await query
      .skip(skip)
      .take(limit)
      .orderBy('export.createdAt', 'DESC')
      .getManyAndCount();

    return {
      exports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async deleteExport(id: string) {
    try {
      // Delete from export worker
      await axios.delete(`${this.exportWorkerUrl}/exports/${id}`);
    } catch (error) {
      // Continue even if worker deletion fails
    }

    const exportItem = await this.exportRepository.findOne({ where: { id } });
    if (!exportItem) {
      throw new NotFoundException('Export not found');
    }

    await this.exportRepository.remove(exportItem);
    return { message: 'Export deleted successfully' };
  }

  async getFormats() {
    try {
      const response = await axios.get(
        `${this.exportWorkerUrl}/exports/formats`
      );
      return response.data;
    } catch (error) {
      // Return default formats if worker is unavailable
      return {
        formats: [
          {
            id: 'pdf',
            name: 'PDF Storyboard',
            description: 'Printable storyboard with frames and notes',
            layouts: ['storyboard', 'shot_list', 'combined'],
          },
          {
            id: 'csv',
            name: 'CSV Shot List',
            description: 'Spreadsheet format shot list',
            layouts: [],
          },
          {
            id: 'json',
            name: 'JSON Bundle',
            description: 'Complete project data in JSON format',
            layouts: [],
          },
          {
            id: 'mp4',
            name: 'MP4 Animatic',
            description: 'Video animatic with audio',
            layouts: [],
          },
        ],
      };
    }
  }

  async getQualityPresets() {
    try {
      const response = await axios.get(
        `${this.exportWorkerUrl}/exports/quality-presets`
      );
      return response.data;
    } catch (error) {
      // Return default presets if worker is unavailable
      return {
        presets: [
          { id: 'low', name: 'Low Quality', description: 'Fast generation, smaller files' },
          { id: 'medium', name: 'Medium Quality', description: 'Balanced quality and speed' },
          { id: 'high', name: 'High Quality', description: 'Best quality, larger files' },
        ],
      };
    }
  }
}
