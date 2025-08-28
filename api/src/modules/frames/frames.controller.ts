import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { FramesService } from './frames.service';
import {
  CreateFrameDto,
  UpdateFrameDto,
  GenerateFrameDto,
  BatchGenerateFramesDto,
} from './dto/frames.dto';

@Controller('v1/frames')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FramesController {
  constructor(private readonly framesService: FramesService) {}

  @Post('generate')
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  async generateFrame(@Body() generateFrameDto: GenerateFrameDto) {
    try {
      return await this.framesService.generateFrame(generateFrameDto);
    } catch (error) {
      throw new HttpException(
        `Frame generation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('batch-generate')
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  async batchGenerateFrames(@Body() batchGenerateDto: BatchGenerateFramesDto) {
    try {
      return await this.framesService.batchGenerateFrames(batchGenerateDto);
    } catch (error) {
      throw new HttpException(
        `Batch frame generation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/status')
  @Roles(UserRole.VIEWER, UserRole.EDITOR, UserRole.ADMIN)
  async getFrameStatus(@Param('id') id: string) {
    try {
      return await this.framesService.getFrameStatus(id);
    } catch (error) {
      throw new HttpException(
        `Frame not found: ${error.message}`,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Get('batch/:batchId/status')
  @Roles(UserRole.VIEWER, UserRole.EDITOR, UserRole.ADMIN)
  async getBatchStatus(@Param('batchId') batchId: string) {
    try {
      return await this.framesService.getBatchStatus(batchId);
    } catch (error) {
      throw new HttpException(
        `Batch not found: ${error.message}`,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Get('styles')
  @Roles(UserRole.VIEWER, UserRole.EDITOR, UserRole.ADMIN)
  async getStylePresets() {
    try {
      return await this.framesService.getStylePresets();
    } catch (error) {
      throw new HttpException(
        `Failed to get style presets: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @Roles(UserRole.VIEWER, UserRole.EDITOR, UserRole.ADMIN)
  async getFrames(@Query('shotId') shotId?: string) {
    try {
      return await this.framesService.getFrames(shotId);
    } catch (error) {
      throw new HttpException(
        `Failed to get frames: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @Roles(UserRole.VIEWER, UserRole.EDITOR, UserRole.ADMIN)
  async getFrame(@Param('id') id: string) {
    try {
      return await this.framesService.getFrame(id);
    } catch (error) {
      throw new HttpException(
        `Frame not found: ${error.message}`,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Post()
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  async createFrame(@Body() createFrameDto: CreateFrameDto) {
    try {
      return await this.framesService.createFrame(createFrameDto);
    } catch (error) {
      throw new HttpException(
        `Failed to create frame: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  async updateFrame(
    @Param('id') id: string,
    @Body() updateFrameDto: UpdateFrameDto,
  ) {
    try {
      return await this.framesService.updateFrame(id, updateFrameDto);
    } catch (error) {
      throw new HttpException(
        `Failed to update frame: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  async deleteFrame(@Param('id') id: string) {
    try {
      await this.framesService.deleteFrame(id);
      return { message: 'Frame deleted successfully' };
    } catch (error) {
      throw new HttpException(
        `Failed to delete frame: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/regenerate')
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  async regenerateFrame(
    @Param('id') id: string,
    @Body() generateFrameDto: GenerateFrameDto,
  ) {
    try {
      return await this.framesService.regenerateFrame(id, generateFrameDto);
    } catch (error) {
      throw new HttpException(
        `Frame regeneration failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
