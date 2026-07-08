import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { WebhookDispatchService } from '../webhooks/webhook-dispatch.service';

// Notable-report threshold for the score_threshold_crossed webhook.
// Disclosed, arbitrary constants — not derived from any validated cutoff.
const HIGH_SCORE_THRESHOLD = 85;
const LOW_SCORE_THRESHOLD = 40;

/**
 * Generates AI assessment reports by calling the Claude API directly.
 * Replaces the never-built Python sidecar (AI_SIDECAR_URL).
 *
 * Configuration (env):
 *   ANTHROPIC_API_KEY  Required. Reports fail with a clear status otherwise.
 *   REPORT_MODEL       Optional. Defaults to claude-sonnet-4-6.
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-6';

interface CoachingGoal {
  goal: string;
  actions: string[];
}

interface GeneratedReport {
  dimensionScores: Record<string, number>;
  narrative: string;
  recommendation: string;
  coachingPlan: { goals: CoachingGoal[] };
}

@Injectable()
export class ReportGeneratorService {
  private readonly logger = new Logger(ReportGeneratorService.name);

  constructor(
    private prisma: PrismaService,
    private webhookDispatch: WebhookDispatchService,
  ) {}

  /**
   * Fire-and-forget entry point. Generates the report and updates the
   * AiReport row to ready/failed. Never throws — callers already returned
   * a pending report to the client.
   */
  async generateInBackground(reportId: string): Promise<void> {
    try {
      await this.generate(reportId);
    } catch (error) {
      this.logger.error(`Report ${reportId} generation failed: ${error}`);
      await this.prisma.aiReport
        .update({ where: { id: reportId }, data: { status: 'failed' } })
        .catch(() => undefined);
    }
  }

  private async generate(reportId: string): Promise<void> {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }

    const report = await this.prisma.aiReport.findUnique({
      where: { id: reportId },
      include: { session: { include: { config: true, user: true } } },
    });
    if (!report) throw new Error('Report not found');

    const { session } = report;
    const dimensions = (session.config.dimensions ?? []) as Array<
      Record<string, unknown>
    >;
    const answers = (session.answers ?? []) as Array<Record<string, unknown>>;
    const metadata = session.answersMetadata ?? {};

    const prompt = [
      `You are scoring a ${session.pillar} assessment for a professional development platform.`,
      '',
      `Assessment dimensions (score each 0-100):`,
      JSON.stringify(dimensions, null, 2),
      '',
      `Candidate's submitted answers (questionId, selectedOptionId, timeTakenSec):`,
      JSON.stringify(answers, null, 2),
      '',
      `Submission metadata: ${JSON.stringify(metadata)}`,
      '',
      'Respond with ONLY a JSON object, no other text:',
      '{',
      '  "dimensionScores": { "<dimension name>": <0-100>, ... },',
      '  "narrative": "<3-5 sentence assessment of strengths and growth areas, grounded in the answer data>",',
      '  "recommendation": "<1-2 sentence development recommendation>",',
      '  "coachingPlan": { "goals": [ { "goal": "<growth-area goal tied to the lowest-scoring dimensions>", "actions": ["<concrete 90-day action>", "..."] }, ... ] }',
      '}',
      '',
      'If the answer data is too sparse to assess a dimension, score it 50 and say so in the narrative. Do not invent specifics that the data does not support.',
      'coachingPlan should have 2-3 goals, each with 2-3 concrete actions, targeting the lowest-scoring dimensions.',
    ].join('\n');

    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.REPORT_MODEL || DEFAULT_MODEL,
        // Headroom for the full JSON: narrative + recommendation + a
        // 2-3 goal coaching plan. 1024 could truncate verbose responses,
        // which then fail parseReport and mark the report failed.
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Claude API ${res.status}: ${body.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      content: Array<{ type: string; text?: string }>;
    };
    const text = data.content.find((c) => c.type === 'text')?.text ?? '';
    const parsed = this.parseReport(text);

    await this.prisma.aiReport.update({
      where: { id: reportId },
      data: {
        dimensionScores: parsed.dimensionScores,
        narrative: parsed.narrative,
        recommendation: parsed.recommendation,
        coachingPlan: parsed.coachingPlan as unknown as Prisma.InputJsonValue,
        status: 'ready',
      },
    });

    const scoreValues = Object.values(parsed.dimensionScores);
    const avgScore = scoreValues.length
      ? scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length
      : 0;
    if (avgScore >= HIGH_SCORE_THRESHOLD || avgScore <= LOW_SCORE_THRESHOLD) {
      void this.webhookDispatch.dispatch(report.tenantId, 'report.score_threshold_crossed', {
        reportId,
        userId: report.userId,
        avgScore: Math.round(avgScore * 100) / 100,
        threshold: avgScore >= HIGH_SCORE_THRESHOLD ? 'high' : 'low',
      });
    }
  }

  private parseReport(text: string): GeneratedReport {
    // Tolerate code fences or stray prose around the JSON object.
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON object in model response');

    const parsed = JSON.parse(match[0]);
    if (
      typeof parsed.dimensionScores !== 'object' ||
      typeof parsed.narrative !== 'string' ||
      typeof parsed.recommendation !== 'string' ||
      !Array.isArray(parsed.coachingPlan?.goals)
    ) {
      throw new Error('Model response missing required fields');
    }
    return parsed as GeneratedReport;
  }
}
