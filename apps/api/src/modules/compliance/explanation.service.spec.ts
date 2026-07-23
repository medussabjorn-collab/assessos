import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ExplanationService } from './explanation.service';
import { PERMISSIONS } from '../auth/permissions.constants';

describe('ExplanationService', () => {
  const tenantId = 'tenant-1';
  let prisma: any;
  let permissions: any;
  let service: ExplanationService;

  // Builds a ResolvedUser-shaped object matching what the real
  // PermissionsService.resolveUser returns, given just a permission set.
  const resolvedUser = (id: string, permissionKeys: string[] = []) => ({
    id,
    tenantId,
    firebaseUid: 'firebase-uid',
    role: { id: 'role-1', name: permissionKeys.length ? 'org_admin' : 'employee', tenantId },
    permissions: new Set(permissionKeys),
  });

  beforeEach(() => {
    prisma = {
      aiReport: { findFirst: jest.fn() },
    };
    permissions = {
      resolveUser: jest.fn(),
      hasPermission: jest.fn((user: any, key: string) => user.permissions.has(key)),
    };
    const request = { headers: { 'x-tenant-id': tenantId } };
    service = new ExplanationService(prisma, permissions, request);
  });

  it('throws NotFoundException for an unknown requester', async () => {
    permissions.resolveUser.mockResolvedValue(null);

    await expect(
      service.explainReport('report-1', 'firebase-uid'),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException for a report outside this tenant', async () => {
    permissions.resolveUser.mockResolvedValue(resolvedUser('usr-1'));
    prisma.aiReport.findFirst.mockResolvedValue(null);

    await expect(
      service.explainReport('report-1', 'firebase-uid'),
    ).rejects.toThrow(NotFoundException);
  });

  it('allows the report subject to view their own explanation', async () => {
    permissions.resolveUser.mockResolvedValue(resolvedUser('usr-1'));
    prisma.aiReport.findFirst.mockResolvedValue({
      id: 'report-1',
      userId: 'usr-1',
      narrative: 'Strong strategic thinker.',
      recommendation: 'Focus on delegation.',
      dimensionScores: { vision: 85, influence: 60 },
      session: {
        answers: [
          {
            questionId: 'q_vision_1',
            selectedOptionId: 'opt_4',
            timeTakenSec: 12,
            dimensionId: 'vision',
            questionText: 'How effectively do you articulate a vision?',
            selectedOptionText: 'Very effectively',
            selectedOptionValue: 4,
          },
          {
            questionId: 'q_influence_1',
            selectedOptionId: 'opt_3',
            timeTakenSec: 8,
            dimensionId: 'influence',
            questionText: 'How effectively do you persuade others?',
            selectedOptionText: 'Moderately',
            selectedOptionValue: 3,
          },
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
    permissions.resolveUser.mockResolvedValue(resolvedUser('usr-1'));
    prisma.aiReport.findFirst.mockResolvedValue({
      id: 'report-1',
      userId: 'usr-1',
      narrative: null,
      recommendation: null,
      dimensionScores: { vision: 85, influence: 60 },
      session: {
        answers: [
          {
            questionId: 'q_vision_1',
            selectedOptionId: 'opt_4',
            timeTakenSec: 12,
            dimensionId: 'vision',
            questionText: 'How effectively do you articulate a vision?',
            selectedOptionText: 'Very effectively',
            selectedOptionValue: 4,
          },
          {
            questionId: 'q_influence_1',
            selectedOptionId: 'opt_3',
            timeTakenSec: 8,
            dimensionId: 'influence',
            questionText: 'How effectively do you persuade others?',
            selectedOptionText: 'Moderately',
            selectedOptionValue: 3,
          },
        ],
      },
    });

    const explanation = await service.explainReport('report-1', 'firebase-uid');
    const vision = explanation.dimensionBreakdown.find((d) => d.dimension === 'vision');

    expect(vision?.contributingAnswers).toHaveLength(1);
    expect(vision?.contributingAnswers[0].questionId).toBe('q_vision_1');
  });

  it('allows an org_admin to view a different user\'s report explanation', async () => {
    permissions.resolveUser.mockResolvedValue(
      resolvedUser('admin-1', [PERMISSIONS.REPORT_EXPLANATION_VIEW_ANY]),
    );
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
    permissions.resolveUser.mockResolvedValue(resolvedUser('usr-2'));
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
