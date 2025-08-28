import { IsString, IsNumber, IsBoolean, IsOptional, IsEnum, IsNumberString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AnimaticFormat {
  MP4 = 'mp4',
  MOV = 'mov',
  AVI = 'avi',
}

export enum CaptionStyle {
  NONE = 'none',
  SIMPLE = 'simple',
  DETAILED = 'detailed',
  CUSTOM = 'custom',
}

export enum AudioTrack {
  NONE = 'none',
  DIALOGUE_ONLY = 'dialogue_only',
  DIALOGUE_MUSIC = 'dialogue_music',
  MUSIC_ONLY = 'music_only',
}

export class GenerateAnimaticDto {
  @ApiProperty({ description: 'Scene ID to generate animatic for' })
  @IsNumber()
  sceneId: number;

  @ApiProperty({ enum: AnimaticFormat, default: AnimaticFormat.MP4 })
  @IsEnum(AnimaticFormat)
  format: AnimaticFormat = AnimaticFormat.MP4;

  @ApiProperty({ description: 'Include scene/shot captions', default: true })
  @IsBoolean()
  includeCaptions: boolean = true;

  @ApiProperty({ enum: CaptionStyle, default: CaptionStyle.SIMPLE })
  @IsEnum(CaptionStyle)
  captionStyle: CaptionStyle = CaptionStyle.SIMPLE;

  @ApiProperty({ enum: AudioTrack, default: AudioTrack.DIALOGUE_ONLY })
  @IsEnum(AudioTrack)
  audioTrack: AudioTrack = AudioTrack.DIALOGUE_ONLY;

  @ApiProperty({ description: 'Custom music file URL', required: false })
  @IsOptional()
  @IsString()
  customMusicUrl?: string;

  @ApiProperty({ description: 'Duration per frame in seconds', default: 3.0 })
  @IsNumber()
  frameDuration: number = 3.0;

  @ApiProperty({ description: 'Transition duration between frames', default: 0.5 })
  @IsNumber()
  transitionDuration: number = 0.5;

  @ApiProperty({ description: 'Output resolution', default: '1920x1080' })
  @IsString()
  resolution: string = '1920x1080';

  @ApiProperty({ description: 'Output frame rate', default: 24 })
  @IsNumber()
  frameRate: number = 24;
}

export class CreateAnimaticDto {
  @ApiProperty({ description: 'Scene ID' })
  @IsNumber()
  sceneId: number;

  @ApiProperty({ description: 'Animatic title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Animatic description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: AnimaticFormat })
  @IsEnum(AnimaticFormat)
  format: AnimaticFormat;

  @ApiProperty({ description: 'File URL', required: false })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiProperty({ description: 'Duration in seconds', required: false })
  @IsOptional()
  @IsNumber()
  duration?: number;
}

export class UpdateAnimaticDto {
  @ApiProperty({ description: 'Animatic title', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Animatic description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'File URL', required: false })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiProperty({ description: 'Duration in seconds', required: false })
  @IsOptional()
  @IsNumber()
  duration?: number;
}
