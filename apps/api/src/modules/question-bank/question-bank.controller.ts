import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { PrismaService } from '../../database/prisma.service';
import { QuestionBankService, ListQuestionsQuery } from './question-bank.service';
import { BulkImportDto, CreateQuestionDto, UpdateQuestionDto } from './dto/question.dto';

const WRITE_ROLES = ['org_admin', 'super_admin'];

@Controller('api/questions')
@UseGuards(FirebaseAuthGuard)
export class QuestionBankController {
  constructor(
    private readonly service: QuestionBankService,
    private readonly prisma: PrismaService,
  ) {}

  private tenantOf(req: any): string {
    return req.headers['x-tenant-id'];
  }

  // Writes are admin-only (leadership used requireAdmin). The guard injects
  // only { uid, email }, so the role is resolved from the DB — same pattern as
  // the other admin-gated controllers.
  private async assertWriter(req: any) {
    const user = await this.prisma.user.findFirst({
      where: { firebaseUid: req.user.uid, tenantId: this.tenantOf(req) },
    });
    if (!user || !WRITE_ROLES.includes(user.role)) {
      throw new ForbiddenException('Only org admins can manage the question bank');
    }
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
  async create(@Request() req: any, @Body() dto: CreateQuestionDto) {
    await this.assertWriter(req);
    const data = await this.service.create(this.tenantOf(req), dto);
    return { success: true, data };
  }

  @Post('bulk')
  async bulkImport(@Request() req: any, @Body() dto: BulkImportDto) {
    await this.assertWriter(req);
    const data = await this.service.bulkImport(this.tenantOf(req), dto.questions);
    return { success: true, data };
  }

  @Put(':id')
  async update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    await this.assertWriter(req);
    const data = await this.service.update(this.tenantOf(req), id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string) {
    await this.assertWriter(req);
    const data = await this.service.remove(this.tenantOf(req), id);
    return { success: true, data };
  }
}
