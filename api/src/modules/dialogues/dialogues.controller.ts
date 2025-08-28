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
import { DialoguesService } from './dialogues.service';
import { CreateDialogueDto, UpdateDialogueDto, SyncDialoguesDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('dialogues')
@Controller('v1/dialogues')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DialoguesController {
  constructor(private readonly dialoguesService: DialoguesService) {}

  @Post('sync')
  @ApiOperation({ summary: 'Synchronize dialogue timing' })
  @ApiResponse({ status: 201, description: 'Dialogues synchronized successfully' })
  async syncDialogues(
    @Body() syncDialoguesDto: SyncDialoguesDto,
    @Request() req: any,
  ) {
    return this.dialoguesService.syncDialogues(syncDialoguesDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all dialogues for a scene' })
  @ApiResponse({ status: 200, description: 'Dialogues retrieved successfully' })
  async getDialogues(
    @Query('scene_id') sceneId: string,
    @Request() req: any,
  ) {
    return this.dialoguesService.getDialoguesByScene(sceneId, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a dialogue by ID' })
  @ApiResponse({ status: 200, description: 'Dialogue retrieved successfully' })
  async getDialogue(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.dialoguesService.getDialogueById(id, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new dialogue' })
  @ApiResponse({ status: 201, description: 'Dialogue created successfully' })
  async createDialogue(
    @Body() createDialogueDto: CreateDialogueDto,
    @Request() req: any,
  ) {
    return this.dialoguesService.createDialogue(createDialogueDto, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a dialogue' })
  @ApiResponse({ status: 200, description: 'Dialogue updated successfully' })
  async updateDialogue(
    @Param('id') id: string,
    @Body() updateDialogueDto: UpdateDialogueDto,
    @Request() req: any,
  ) {
    return this.dialoguesService.updateDialogue(id, updateDialogueDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a dialogue' })
  @ApiResponse({ status: 200, description: 'Dialogue deleted successfully' })
  async deleteDialogue(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.dialoguesService.deleteDialogue(id, req.user.id);
  }

  @Post(':scene_id/estimate-timing')
  @ApiOperation({ summary: 'Estimate timing for scene dialogues' })
  @ApiResponse({ status: 200, description: 'Timing estimated successfully' })
  async estimateTiming(
    @Param('scene_id') sceneId: string,
    @Body() timingOptions: any,
    @Request() req: any,
  ) {
    return this.dialoguesService.estimateTiming(sceneId, timingOptions, req.user.id);
  }

  @Post(':scene_id/generate-tts')
  @ApiOperation({ summary: 'Generate TTS audio for dialogues' })
  @ApiResponse({ status: 200, description: 'TTS generated successfully' })
  async generateTTS(
    @Param('scene_id') sceneId: string,
    @Body() ttsOptions: any,
    @Request() req: any,
  ) {
    return this.dialoguesService.generateTTS(sceneId, ttsOptions, req.user.id);
  }

  @Get(':scene_id/timing-analysis')
  @ApiOperation({ summary: 'Analyze dialogue timing patterns' })
  @ApiResponse({ status: 200, description: 'Analysis completed successfully' })
  async analyzeTiming(
    @Param('scene_id') sceneId: string,
    @Request() req: any,
  ) {
    return this.dialoguesService.analyzeTiming(sceneId, req.user.id);
  }
}
