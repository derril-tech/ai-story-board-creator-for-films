import {
  Controller,
  Get,
  Post,
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
import { ExportsService } from './exports.service';
import { GenerateExportDto } from './dto/exports.dto';

@ApiTags('exports')
@Controller('v1/exports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Post('generate')
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Generate an export for a project' })
  @ApiResponse({ status: 201, description: 'Export generation started' })
  async generateExport(@Body() generateExportDto: GenerateExportDto) {
    return this.exportsService.generateExport(generateExportDto);
  }

  @Get(':id/status')
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Get export generation status' })
  @ApiResponse({ status: 200, description: 'Export status retrieved' })
  async getExportStatus(@Param('id') id: string) {
    return this.exportsService.getExportStatus(id);
  }

  @Get(':id')
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Get export metadata' })
  @ApiResponse({ status: 200, description: 'Export metadata retrieved' })
  async getExport(@Param('id') id: string) {
    return this.exportsService.getExport(id);
  }

  @Get('project/:projectId/summary')
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Get project export summary' })
  @ApiResponse({ status: 200, description: 'Project export summary retrieved' })
  async getProjectExportSummary(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.exportsService.getProjectExportSummary(projectId);
  }

  @Get()
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Get all exports' })
  @ApiResponse({ status: 200, description: 'Exports retrieved' })
  async getExports(
    @Query('projectId') projectId?: string,
    @Query('format') format?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.exportsService.getExports({
      projectId: projectId ? parseInt(projectId) : undefined,
      format,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
  }

  @Delete(':id')
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Delete an export' })
  @ApiResponse({ status: 200, description: 'Export deleted' })
  async deleteExport(@Param('id') id: string) {
    return this.exportsService.deleteExport(id);
  }

  @Get('formats')
  @ApiOperation({ summary: 'Get supported export formats' })
  @ApiResponse({ status: 200, description: 'Formats retrieved' })
  async getFormats() {
    return this.exportsService.getFormats();
  }

  @Get('quality-presets')
  @ApiOperation({ summary: 'Get available quality presets' })
  @ApiResponse({ status: 200, description: 'Quality presets retrieved' })
  async getQualityPresets() {
    return this.exportsService.getQualityPresets();
  }
}
