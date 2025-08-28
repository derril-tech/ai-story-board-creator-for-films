import { IsString, IsOptional, IsEnum, IsArray, IsNumber, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum FrameStyle {
  SKETCH = 'sketch',
  STORYBOARD = 'storyboard',
  CONCEPT = 'concept',
  REALISTIC = 'realistic',
}

export class GenerateFrameDto {
  @ApiProperty({ description: 'ID of the shot to generate frame for' })
  @IsString()
  shotId: string;

  @ApiProperty({ 
    description: 'Artistic style for the frame',
    enum: FrameStyle,
    default: FrameStyle.STORYBOARD
  })
  @IsEnum(FrameStyle)
  style: FrameStyle = FrameStyle.STORYBOARD;

  @ApiProperty({ description: 'Shot metadata including size, angle, movement, lens' })
  @IsObject()
  shotMetadata: Record<string, any>;

  @ApiProperty({ description: 'Characters in the shot', type: [String] })
  @IsArray()
  @IsString({ each: true })
  characters: string[] = [];

  @ApiProperty({ description: 'Location/setting of the shot' })
  @IsString()
  location: string;

  @ApiProperty({ description: 'Description of the action in the shot' })
  @IsString()
  actionDescription: string;

  @ApiProperty({ description: 'Dialogue in the shot', required: false })
  @IsOptional()
  @IsString()
  dialogue?: string;

  @ApiProperty({ description: 'Custom prompt override', required: false })
  @IsOptional()
  @IsString()
  customPrompt?: string;

  @ApiProperty({ description: 'Negative prompt to avoid certain elements', required: false })
  @IsOptional()
  @IsString()
  negativePrompt?: string;

  @ApiProperty({ description: 'Random seed for reproducible generation', required: false })
  @IsOptional()
  @IsNumber()
  seed?: number;
}

export class BatchGenerateFramesDto {
  @ApiProperty({ description: 'List of shot IDs to generate frames for', type: [String] })
  @IsArray()
  @IsString({ each: true })
  shotIds: string[];

  @ApiProperty({ 
    description: 'Artistic style for all frames',
    enum: FrameStyle,
    default: FrameStyle.STORYBOARD
  })
  @IsEnum(FrameStyle)
  style: FrameStyle = FrameStyle.STORYBOARD;

  @ApiProperty({ description: 'Number of frames to generate in parallel', default: 5 })
  @IsNumber()
  batchSize: number = 5;
}

export class CreateFrameDto {
  @ApiProperty({ description: 'ID of the shot this frame belongs to' })
  @IsString()
  shotId: string;

  @ApiProperty({ description: 'URL to the frame image' })
  @IsString()
  imageUrl: string;

  @ApiProperty({ description: 'Prompt used for generation' })
  @IsString()
  promptUsed: string;

  @ApiProperty({ description: 'Generation metadata' })
  @IsObject()
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Frame status' })
  @IsString()
  status: string;
}

export class UpdateFrameDto {
  @ApiProperty({ description: 'URL to the frame image', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ description: 'Prompt used for generation', required: false })
  @IsOptional()
  @IsString()
  promptUsed?: string;

  @ApiProperty({ description: 'Generation metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Frame status', required: false })
  @IsOptional()
  @IsString()
  status?: string;
}
