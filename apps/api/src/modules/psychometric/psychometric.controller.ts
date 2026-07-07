import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { PrismaService } from '../../database/prisma.service';
import { PsychometricRegistry } from './psychometric-registry.service';

@Controller('api/psych')
export class PsychometricController {
  constructor(
    private registry: PsychometricRegistry,
    private prisma: PrismaService,
  ) {}

  @Get('models')
  @UseGuards(FirebaseAuthGuard)
  listModels() {
    return { success: true, data: this.registry.list() };
  }

  @Get(':modelKey/questions')
  @UseGuards(FirebaseAuthGuard)
  getQuestions(@Param('modelKey') modelKey: string) {
    const model = this.registry.get(modelKey);
    return { success: true, data: model.getItems() };
  }

  @Post(':modelKey/submit')
  @UseGuards(FirebaseAuthGuard)
  async submit(
    @Param('modelKey') modelKey: string,
    @Request() req: any,
    @Body() body: { answers: unknown[] },
  ) {
    const model = this.registry.get(modelKey);
    const answers = body.answers ?? [];
    model.validateAnswers(answers);
    const result = model.score(answers) as Record<string, unknown>;

    const tenantId = req.headers['x-tenant-id'];
    const user = await this.prisma.user.findFirst({
      where: { firebaseUid: req.user.uid, tenantId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { scores, ...interpretation } = result;
    const saved = await this.prisma.psychometricResult.create({
      data: {
        tenantId,
        userId: user.id,
        modelKey,
        scores: scores as object,
        interpretation: interpretation as object,
        rawAnswers: answers as object,
      },
    });

    return { success: true, data: { id: saved.id, createdAt: saved.createdAt, ...result } };
  }

  @Get(':modelKey/result')
  @UseGuards(FirebaseAuthGuard)
  async getResult(@Param('modelKey') modelKey: string, @Request() req: any) {
    // Validates the model exists before querying (404s on unknown keys
    // rather than silently returning null).
    this.registry.get(modelKey);

    const tenantId = req.headers['x-tenant-id'];
    const user = await this.prisma.user.findFirst({
      where: { firebaseUid: req.user.uid, tenantId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const result = await this.prisma.psychometricResult.findFirst({
      where: { userId: user.id, tenantId, modelKey },
      orderBy: { createdAt: 'desc' },
    });
    if (!result) {
      return { success: true, data: null };
    }

    const interpretation = result.interpretation as Record<string, unknown>;
    return {
      success: true,
      data: {
        id: result.id,
        createdAt: result.createdAt,
        scores: result.scores,
        ...interpretation,
      },
    };
  }
}
