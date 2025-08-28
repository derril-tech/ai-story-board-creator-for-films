import { IsString, IsNumber, IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ExportFormat {
  PDF = 'pdf',
  CSV = 'csv',
  JSON = 'json',
  MP4 = 'mp4',
}

export enum PDFLayout {
  STORYBOARD = 'storyboard',
  SHOT_LIST = 'shot_list',
  COMBINED = 'combined',
}

export class GenerateExportDto {
  @ApiProperty({ description: 'Project ID to export' })
  @IsNumber()
  projectId: number;

  @ApiProperty({ enum: ExportFormat, description: 'Export format' })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiProperty({ description: 'Include frame images', default: true })
  @IsBoolean()
  includeFrames: boolean = true;

  @ApiProperty({ description: 'Include shot/dialogue metadata', default: true })
  @IsBoolean()
  includeMetadata: boolean = true;

  @ApiProperty({ enum: PDFLayout, description: 'PDF layout (for PDF exports)', required: false })
  @IsOptional()
  @IsEnum(PDFLayout)
  layout?: PDFLayout;

  @ApiProperty({ description: 'Export quality', default: 'high' })
  @IsString()
  quality: string = 'high';

  @ApiProperty({ description: 'Format-specific options', required: false })
  @IsOptional()
  customOptions?: Record<string, any>;
}
