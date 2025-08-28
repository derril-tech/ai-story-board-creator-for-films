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
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AnimaticsService } from './animatics.service';
import { GenerateAnimaticDto, CreateAnimaticDto, UpdateAnimaticDto } from './dto/animatics.dto';

@ApiTags('animatics')
@Controller('v1/animatics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnimaticsController {
  constructor(private readonly animaticsService: AnimaticsService) {}

  @Post('generate')
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Generate an animatic for a scene' })
  @ApiResponse({ status: 201, description: 'Animatic generation started' })
  async generateAnimatic(@Body() generateAnimaticDto: GenerateAnimaticDto) {
    return this.animaticsService.generateAnimatic(generateAnimaticDto);
  }

  @Get(':id/status')
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Get animatic generation status' })
  @ApiResponse({ status: 200, description: 'Animatic status retrieved' })
  async getAnimaticStatus(@Param('id') id: string) {
    return this.animaticsService.getAnimaticStatus(id);
  }

  @Get(':id')
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Get animatic metadata' })
  @ApiResponse({ status: 200, description: 'Animatic metadata retrieved' })
  async getAnimatic(@Param('id') id: string) {
    return this.animaticsService.getAnimatic(id);
  }

  @Get('scene/:sceneId/timeline')
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Get scene timeline data' })
  @ApiResponse({ status: 200, description: 'Scene timeline retrieved' })
  async getSceneTimeline(@Param('sceneId', ParseIntPipe) sceneId: number) {
    return this.animaticsService.getSceneTimeline(sceneId);
  }

  @Get()
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Get all animatics' })
  @ApiResponse({ status: 200, description: 'Animatics retrieved' })
  async getAnimatics(
    @Query('projectId') projectId?: string,
    @Query('sceneId') sceneId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.animaticsService.getAnimatics({
      projectId: projectId ? parseInt(projectId) : undefined,
      sceneId: sceneId ? parseInt(sceneId) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
  }

  @Post()
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Create a new animatic' })
  @ApiResponse({ status: 201, description: 'Animatic created' })
  async createAnimatic(@Body() createAnimaticDto: CreateAnimaticDto) {
    return this.animaticsService.createAnimatic(createAnimaticDto);
  }

  @Put(':id')
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Update an animatic' })
  @ApiResponse({ status: 200, description: 'Animatic updated' })
  async updateAnimatic(
    @Param('id') id: string,
    @Body() updateAnimaticDto: UpdateAnimaticDto,
  ) {
    return this.animaticsService.updateAnimatic(id, updateAnimaticDto);
  }

  @Delete(':id')
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Delete an animatic' })
  @ApiResponse({ status: 200, description: 'Animatic deleted' })
  async deleteAnimatic(@Param('id') id: string) {
    return this.animaticsService.deleteAnimatic(id);
  }

  @Get('formats')
  @ApiOperation({ summary: 'Get supported animatic formats' })
  @ApiResponse({ status: 200, description: 'Formats retrieved' })
  async getFormats() {
    return this.animaticsService.getFormats();
  }

  @Get('caption-styles')
  @ApiOperation({ summary: 'Get available caption styles' })
  @ApiResponse({ status: 200, description: 'Caption styles retrieved' })
  async getCaptionStyles() {
    return this.animaticsService.getCaptionStyles();
  }
}
