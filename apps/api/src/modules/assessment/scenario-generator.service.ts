import { Injectable, Logger, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * GenAI SJT (situational judgment test) scenario generation, calling the
 * Claude API directly — same integration pattern as
 * reporting/report-generator.service.ts (ANTHROPIC_API_KEY env var).
 *
 * Every generated scenario lands as pending_review; nothing produced here
 * is used in a scored assessment until an org_admin approves it (see
 * ScenarioReviewService below) — LLM output doesn't get auto-published to
 * something candidates are scored against.
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-6';

export interface GeneratedScenarioContent {
  scenario: string;
  options: Array<{ text: string; dimension: string; isBestPractice: boolean }>;
}

export interface GenerateScenarioParams {
  industry: string;
  role: string;
  difficulty: 'easy' | 'medium' | 'hard';
  dimension: string;
}

@Injectable({ scope: Scope.REQUEST })
export class ScenarioGeneratorService {
  private readonly logger = new Logger(ScenarioGeneratorService.name);
  private tenantId: string;

  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any,
  ) {
    this.tenantId = request.headers['x-tenant-id'];
  }

  async generate(params: GenerateScenarioParams) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }

    const prompt = [
      `Create a situational judgment test (SJT) scenario for a ${params.role} role in the ${params.industry} industry.`,
      `Difficulty: ${params.difficulty}.`,
      `The scenario should probe the "${params.dimension}" leadership dimension.`,
      '',
      'Requirements:',
      '- Include a realistic ethical dilemma, time pressure, or conflicting stakeholder interests.',
      '- Provide exactly 4 response options.',
      '- Each option maps to a distinct behavioral style (map loosely to DISC: Dominance, Influence, Steadiness, Conscientiousness) and is marked as best-practice or not for this scenario.',
      '- Exactly one option should be marked isBestPractice: true.',
      '',
      'Respond with ONLY a JSON object, no other text:',
      '{',
      '  "scenario": "<2-4 sentence scenario description>",',
      '  "options": [',
      '    { "text": "<response option>", "dimension": "D" | "I" | "S" | "C", "isBestPractice": true | false },',
      '    ...',
      '  ]',
      '}',
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
        max_tokens: 1024,
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
    const content = this.parseContent(text);

    return this.prisma.generatedScenario.create({
      data: {
        tenantId: this.tenantId,
        industry: params.industry,
        role: params.role,
        difficulty: params.difficulty,
        dimension: params.dimension,
        generatedContent: content as unknown as object,
        status: 'pending_review',
      },
    });
  }

  private parseContent(text: string): GeneratedScenarioContent {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON object in model response');

    const parsed = JSON.parse(match[0]);
    if (
      typeof parsed.scenario !== 'string' ||
      !Array.isArray(parsed.options) ||
      parsed.options.length !== 4 ||
      parsed.options.filter((o: any) => o.isBestPractice === true).length !== 1
    ) {
      throw new Error('Model response missing required fields or malformed options');
    }
    return parsed as GeneratedScenarioContent;
  }
}
