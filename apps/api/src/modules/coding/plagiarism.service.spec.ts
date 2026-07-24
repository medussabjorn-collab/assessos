import { PlagiarismService } from './plagiarism.service';

describe('PlagiarismService', () => {
  const tenantId = 'tenant-1';
  let prisma: any;
  let service: PlagiarismService;

  beforeEach(() => {
    prisma = {
      codeSubmission: { findMany: jest.fn() },
    };
    const request = { headers: { 'x-tenant-id': tenantId } };
    service = new PlagiarismService(prisma, request);
  });

  it('queries only prior submissions for the same problem/language, excluding the current user', async () => {
    prisma.codeSubmission.findMany.mockResolvedValue([]);

    await service.checkAgainstPriorSubmissions('two-sum', 'python', 'code', 'usr-1');

    expect(prisma.codeSubmission.findMany).toHaveBeenCalledWith({
      where: {
        tenantId,
        problemId: 'two-sum',
        language: 'python',
        userId: { not: 'usr-1' },
      },
      select: { id: true, code: true },
    });
  });

  it('returns zero similarity and no flag when there are no prior submissions', async () => {
    prisma.codeSubmission.findMany.mockResolvedValue([]);

    const result = await service.checkAgainstPriorSubmissions(
      'two-sum',
      'python',
      'def f(a, b): return a + b',
      'usr-1',
    );

    expect(result).toEqual({
      similarityScore: 0,
      flagged: false,
      matchedSubmissionId: null,
    });
  });

  it('flags near-identical code with only variable names changed', async () => {
    const original = `
      def two_sum(nums, target):
          seen = {}
          for i, n in enumerate(nums):
              complement = target - n
              if complement in seen:
                  return [seen[complement], i]
              seen[n] = i
          return []
    `;
    const renamed = original
      .replace(/nums/g, 'arr')
      .replace(/seen/g, 'lookup')
      .replace(/complement/g, 'rest');

    prisma.codeSubmission.findMany.mockResolvedValue([
      { id: 'sub-1', code: original },
    ]);

    const result = await service.checkAgainstPriorSubmissions(
      'two-sum',
      'python',
      renamed,
      'usr-2',
    );

    expect(result.flagged).toBe(true);
    expect(result.matchedSubmissionId).toBe('sub-1');
    expect(result.similarityScore).toBeGreaterThanOrEqual(0.85);
  });

  it('does not flag genuinely different solutions to the same problem', async () => {
    const bruteForce = `
      def two_sum(nums, target):
          for i in range(len(nums)):
              for j in range(i + 1, len(nums)):
                  if nums[i] + nums[j] == target:
                      return [i, j]
          return []
    `;
    const hashMap = `
      def two_sum(nums, target):
          seen = {}
          for i, n in enumerate(nums):
              complement = target - n
              if complement in seen:
                  return [seen[complement], i]
              seen[n] = i
          return []
    `;

    prisma.codeSubmission.findMany.mockResolvedValue([
      { id: 'sub-1', code: bruteForce },
    ]);

    const result = await service.checkAgainstPriorSubmissions(
      'two-sum',
      'python',
      hashMap,
      'usr-2',
    );

    expect(result.flagged).toBe(false);
    expect(result.matchedSubmissionId).toBeNull();
  });

  it('ignores differences in comments and string literals when comparing', async () => {
    const original = 'def f(a, b):\n    # add them\n    return a + b';
    const commented = 'def f(a, b):\n    # this adds two numbers together\n    return a + b';

    prisma.codeSubmission.findMany.mockResolvedValue([
      { id: 'sub-1', code: original },
    ]);

    const result = await service.checkAgainstPriorSubmissions(
      'two-sum',
      'python',
      commented,
      'usr-2',
    );

    expect(result.flagged).toBe(true);
  });
});
