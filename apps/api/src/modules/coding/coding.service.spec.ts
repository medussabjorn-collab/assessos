import { NotFoundException } from '@nestjs/common';
import { CodingService } from './coding.service';

describe('CodingService.submitSolution', () => {
  const tenantId = 'tenant-1';
  let problems: any;
  let execution: any;
  let leaderboard: any;
  let progress: any;
  let plagiarism: any;
  let prisma: any;
  let service: CodingService;

  beforeEach(() => {
    problems = {
      getProblem: jest.fn().mockReturnValue({
        id: 'two-sum',
        testCases: [{ input: '[2,7],9', expectedOutput: '[0,1]' }],
      }),
    };
    execution = {
      validateSolution: jest.fn().mockResolvedValue({
        valid: true,
        score: 100,
        feedback: 'All tests passed.',
        passed: 1,
        failed: 0,
        results: [],
      }),
    };
    leaderboard = {};
    progress = {};
    plagiarism = {
      checkAgainstPriorSubmissions: jest.fn().mockResolvedValue({
        similarityScore: 0.1,
        flagged: false,
        matchedSubmissionId: null,
      }),
    };
    prisma = {
      user: { findFirst: jest.fn() },
      codeSubmission: { create: jest.fn() },
    };
    const request = { headers: { 'x-tenant-id': tenantId } };
    service = new CodingService(
      problems,
      execution,
      leaderboard,
      progress,
      plagiarism,
      prisma,
      request,
    );
  });

  it('throws NotFoundException for an unresolvable firebaseUid', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.submitSolution('two-sum', 'code', 'python', 'firebase-uid'),
    ).rejects.toThrow(NotFoundException);

    expect(execution.validateSolution).not.toHaveBeenCalled();
  });

  it('persists the submission with plagiarism results and internal userId', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'usr-1' });
    prisma.codeSubmission.create.mockResolvedValue({ id: 'sub-1' });

    const result = await service.submitSolution('two-sum', 'code', 'python', 'firebase-uid');

    expect(prisma.codeSubmission.create).toHaveBeenCalledWith({
      data: {
        tenantId,
        userId: 'usr-1',
        problemId: 'two-sum',
        language: 'python',
        code: 'code',
        score: 100,
        valid: true,
        similarityScore: 0.1,
        matchedSubmissionId: null,
      },
    });
    expect(result.plagiarism).toEqual({ flagged: false, similarityScore: 0.1 });
  });

  it('checks plagiarism excluding the submitting user, not the raw firebase uid', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'usr-1' });
    prisma.codeSubmission.create.mockResolvedValue({ id: 'sub-1' });

    await service.submitSolution('two-sum', 'code', 'python', 'firebase-uid');

    expect(plagiarism.checkAgainstPriorSubmissions).toHaveBeenCalledWith(
      'two-sum',
      'python',
      'code',
      'usr-1',
    );
  });

  it('surfaces a flagged plagiarism match in the response', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'usr-1' });
    prisma.codeSubmission.create.mockResolvedValue({ id: 'sub-1' });
    plagiarism.checkAgainstPriorSubmissions.mockResolvedValue({
      similarityScore: 0.92,
      flagged: true,
      matchedSubmissionId: 'sub-old',
    });

    const result = await service.submitSolution('two-sum', 'code', 'python', 'firebase-uid');

    expect(result.plagiarism).toEqual({ flagged: true, similarityScore: 0.92 });
  });
});
