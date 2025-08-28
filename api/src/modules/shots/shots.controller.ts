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
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ShotsService } from './shots.service';
import { CreateShotDto, UpdateShotDto, GenerateShotsDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('shots')
@Controller('v1/shots')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ShotsController {
  constructor(private readonly shotsService: ShotsService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate shots for a scene' })
  @ApiResponse({ status: 201, description: 'Shots generated successfully' })
  async generateShots(
    @Body() generateShotsDto: GenerateShotsDto,
    @Request() req: any,
  ) {
    return this.shotsService.generateShots(generateShotsDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all shots for a scene' })
  @ApiResponse({ status: 200, description: 'Shots retrieved successfully' })
  async getShots(
    @Query('scene_id') sceneId: string,
    @Request() req: any,
  ) {
    return this.shotsService.getShotsByScene(sceneId, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a shot by ID' })
  @ApiResponse({ status: 200, description: 'Shot retrieved successfully' })
  async getShot(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.shotsService.getShotById(id, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new shot' })
  @ApiResponse({ status: 201, description: 'Shot created successfully' })
  async createShot(
    @Body() createShotDto: CreateShotDto,
    @Request() req: any,
  ) {
    return this.shotsService.createShot(createShotDto, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a shot' })
  @ApiResponse({ status: 200, description: 'Shot updated successfully' })
  async updateShot(
    @Param('id') id: string,
    @Body() updateShotDto: UpdateShotDto,
    @Request() req: any,
  ) {
    return this.shotsService.updateShot(id, updateShotDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a shot' })
  @ApiResponse({ status: 200, description: 'Shot deleted successfully' })
  async deleteShot(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.shotsService.deleteShot(id, req.user.id);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get available shot templates' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async getTemplates() {
    return this.shotsService.getTemplates();
  }

  @Post(':scene_id/analyze')
  @ApiOperation({ summary: 'Analyze scene for shot planning' })
  @ApiResponse({ status: 200, description: 'Analysis completed successfully' })
  async analyzeScene(
    @Param('scene_id') sceneId: string,
    @Request() req: any,
  ) {
    return this.shotsService.analyzeScene(sceneId, req.user.id);
  }
}
