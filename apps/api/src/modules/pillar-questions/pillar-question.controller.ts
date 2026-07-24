import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions.constants';
import { PillarQuestionService, ListPillarQuestionsQuery } from './pillar-question.service';
import {
  BulkImportPillarQuestionsDto,
  CreatePillarQuestionDto,
  UpdatePillarQuestionDto,
} from './dto/pillar-question.dto';

@Controller('api/pillar-questions')
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
export class PillarQuestionController {
  constructor(private readonly service: PillarQuestionService) {}

  private tenantOf(req: any): string {
    return req.headers['x-tenant-id'];
  }

  @Get()
  async list(@Request() req: any, @Query() query: ListPillarQuestionsQuery) {
    const data = await this.service.list(this.tenantOf(req), query);
    return { success: true, ...data };
  }

  @Get(':id')
  async get(@Request() req: any, @Param('id') id: string) {
    const data = await this.service.get(this.tenantOf(req), id);
    return { success: true, data };
  }

  @Post()
  @RequirePermission(PERMISSIONS.QUESTION_BANK_WRITE)
  async create(@Request() req: any, @Body() dto: CreatePillarQuestionDto) {
    const data = await this.service.create(this.tenantOf(req), dto);
    return { success: true, data };
  }

  @Post('bulk')
  @RequirePermission(PERMISSIONS.QUESTION_BANK_WRITE)
  async bulkImport(@Request() req: any, @Body() dto: BulkImportPillarQuestionsDto) {
    const data = await this.service.bulkImport(this.tenantOf(req), dto.questions);
    return { success: true, data };
  }

  @Put(':id')
  @RequirePermission(PERMISSIONS.QUESTION_BANK_WRITE)
  async update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdatePillarQuestionDto) {
    const data = await this.service.update(this.tenantOf(req), id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.QUESTION_BANK_WRITE)
  async remove(@Request() req: any, @Param('id') id: string) {
    const data = await this.service.remove(this.tenantOf(req), id);
    return { success: true, data };
  }
}
