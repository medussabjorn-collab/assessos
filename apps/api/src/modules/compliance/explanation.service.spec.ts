import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ExplanationService } from './explanation.service';

describe('ExplanationService', () => {
  const tenantId = 'tenant-1';
  let prisma: any;
  let questionBank: any;
  let service: ExplanationService;

  const visionQuestion = {
    id: 'q_vision_1',
    dimensionId: 'vision',
    text: 'How effectively do you articulate a vision?',
    options: [
      { id: 'opt_1', text: 'Not at all', value: 1 },
      { id: 'opt_4', text: 'Very effectively', value: 4 },
    ],
  };
  const influenceQuestion = {
    id: 'q_influence_1',
    dimensionId: 'influence',
    text: 'How effectively do you persuade others?',
    options: [{ id: 'opt_3', text: 'Moderately', value: 3 }],
  };

  beforeEach(() => {
    prisma = {
      user: { findFirst: jest.fn() },
      aiReport: { findFirst: jest.fn() },
    };
    questionBank = {
      getQuestionById: jest.fn((id: string) =>
        ({ q_vision_1: visionQuestion, q_influence_1: influenceQuestion } as any)[id],
      ),
    };
    const request = { headers: { 'x-tenant-id': tenantId } };
    service = new ExplanationService(prisma, questionBank, request);
  });

  it('throws NotFoundException for an unknown requester', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.explainReport('report-1', 'firebase-uid'),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException for a report outside this tenant', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'usr-1', role: 'employee' });
    prisma.aiReport.findFirst.mockResolvedValue(null);

    await expect(
      service.explainReport('report-1', 'firebase-uid'),
    ).rejects.toThrow(NotFoundException);
  });

  it('allows the report subject to view their own explanation', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'usr-1', role: 'employee' });
    prisma.aiReport.findFirst.mockResolvedValue({
      id: 'report-1',
      userId: 'usr-1',
      narrative: 'Strong strategic thinker.',
      recommendation: 'Focus on delegation.',
      dimensionScores: { vision: 85, influence: 60 },
      session: {
        answers: [
          { questionId: 'q_vision_1', selectedOptionId: 'opt_4', timeTakenSec: 12 },
          { questionId: 'q_influence_1', selectedOptionId: 'opt_3', timeTakenSec: 8 },
        ],
      },
    });

    const explanation = await service.explainReport('report-1', 'firebase-uid');

    expect(explanation.narrative).toBe('Strong strategic thinker.');
    const vision = explanation.dimensionBreakdown.find((d) => d.dimension === 'vision');
    expect(vision?.score).toBe(85);
    expect(vision?.contributingAnswers).toEqual([
      {
        questionId: 'q_vision_1',
        questionText: 'How effectively do you articulate a vision?',
        selectedOptionText: 'Very effectively',
        selectedOptionValue: 4,
        timeTakenSec: 12,
      },
    ]);
  });

  it('does not cross-attribute an influence answer into the vision breakdown', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'usr-1', role: 'employee' });
    prisma.aiReport.findFirst.mockResolvedValue({
      id: 'report-1',
      userId: 'usr-1',
      narrative: null,
      recommendation: null,
      dimensionScores: { vision: 85, influence: 60 },
      session: {
        answers: [
          { questionId: 'q_vision_1', selectedOptionId: 'opt_4', timeTakenSec: 12 },
          { questionId: 'q_influence_1', selectedOptionId: 'opt_3', timeTakenSec: 8 },
        ],
      },
    });

    const explanation = await service.explainReport('report-1', 'firebase-uid');
    const vision = explanation.dimensionBreakdown.find((d) => d.dimension === 'vision');

    expect(vision?.contributingAnswers).toHaveLength(1);
    expect(vision?.contributingAnswers[0].questionId).toBe('q_vision_1');
  });

  it('allows an org_admin to view a different user\'s report explanation', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'admin-1', role: 'org_admin' });
    prisma.aiReport.findFirst.mockResolvedValue({
      id: 'report-1',
      userId: 'someone-else',
      narrative: null,
      recommendation: null,
      dimensionScores: {},
      session: { answers: [] },
    });

    await expect(
      service.explainReport('report-1', 'admin-firebase-uid'),
    ).resolves.toBeDefined();
  });

  it('rejects a non-admin, non-subject requester', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'usr-2', role: 'employee' });
    prisma.aiReport.findFirst.mockResolvedValue({
      id: 'report-1',
      userId: 'someone-else',
      narrative: null,
      recommendation: null,
      dimensionScores: {},
      session: { answers: [] },
    });

    await expect(
      service.explainReport('report-1', 'firebase-uid'),
    ).rejects.toThrow(ForbiddenException);
  });
});
