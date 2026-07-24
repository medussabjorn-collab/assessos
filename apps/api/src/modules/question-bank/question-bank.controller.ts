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
import { QuestionBankService, ListQuestionsQuery } from './question-bank.service';
import { AdaptiveTestingService, AdaptiveNextInput } from './adaptive-testing.service';
import { BulkImportDto, CreateQuestionDto, UpdateQuestionDto } from './dto/question.dto';

@Controller('api/questions')
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
export class QuestionBankController {
  constructor(
    private readonly service: QuestionBankService,
    private readonly adaptive: AdaptiveTestingService,
  ) {}

  private tenantOf(req: any): string {
    return req.headers['x-tenant-id'];
  }

  // Computerized adaptive test step: given answered items, return the ability
  // estimate + the next most-informative item (or terminate). Test-taker flow,
  // so any authenticated user.
  @Post('adaptive/next')
  async adaptiveNext(@Request() req: any, @Body() body: AdaptiveNextInput) {
    const data = await this.adaptive.next(this.tenantOf(req), body);
    return { success: true, data };
  }

  @Get()
  async list(@Request() req: any, @Query() query: ListQuestionsQuery) {
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
  async create(@Request() req: any, @Body() dto: CreateQuestionDto) {
    const data = await this.service.create(this.tenantOf(req), dto);
    return { success: true, data };
  }

  @Post('bulk')
  @RequirePermission(PERMISSIONS.QUESTION_BANK_WRITE)
  async bulkImport(@Request() req: any, @Body() dto: BulkImportDto) {
    const data = await this.service.bulkImport(this.tenantOf(req), dto.questions);
    return { success: true, data };
  }

  @Put(':id')
  @RequirePermission(PERMISSIONS.QUESTION_BANK_WRITE)
  async update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateQuestionDto) {
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
