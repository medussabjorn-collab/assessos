import { ScenarioGeneratorService } from './scenario-generator.service';

describe('ScenarioGeneratorService', () => {
  const tenantId = 'tenant-1';
  let prisma: any;
  let service: ScenarioGeneratorService;
  const originalFetch = global.fetch;
  const originalApiKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    prisma = { generatedScenario: { create: jest.fn() } };
    const request = { headers: { 'x-tenant-id': tenantId } };
    service = new ScenarioGeneratorService(prisma, request);
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.ANTHROPIC_API_KEY = originalApiKey;
  });

  it('throws when ANTHROPIC_API_KEY is not configured', async () => {
    delete process.env.ANTHROPIC_API_KEY;

    await expect(
      service.generate({ industry: 'tech', role: 'EM', difficulty: 'medium', dimension: 'execution' }),
    ).rejects.toThrow('ANTHROPIC_API_KEY is not set');
  });

  it('persists a well-formed scenario as pending_review', async () => {
    const modelResponse = {
      scenario: 'Your team missed a deadline. A stakeholder is upset.',
      options: [
        { text: 'Take direct control of the project.', dimension: 'D', isBestPractice: false },
        { text: 'Rally the team with an energizing talk.', dimension: 'I', isBestPractice: false },
        { text: 'Calmly reassign tasks and communicate a realistic new timeline.', dimension: 'S', isBestPractice: true },
        { text: 'Analyze exactly what went wrong before deciding.', dimension: 'C', isBestPractice: false },
      ],
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: JSON.stringify(modelResponse) }] }),
    }) as any;
    prisma.generatedScenario.create.mockResolvedValue({ id: 'scenario-1' });

    await service.generate({ industry: 'tech', role: 'EM', difficulty: 'medium', dimension: 'execution' });

    expect(prisma.generatedScenario.create).toHaveBeenCalledWith({
      data: {
        tenantId,
        industry: 'tech',
        role: 'EM',
        difficulty: 'medium',
        dimension: 'execution',
        generatedContent: modelResponse,
        status: 'pending_review',
      },
    });
  });

  it('throws when the model returns fewer than 4 options', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              scenario: 'x',
              options: [{ text: 'a', dimension: 'D', isBestPractice: true }],
            }),
          },
        ],
      }),
    }) as any;

    await expect(
      service.generate({ industry: 'tech', role: 'EM', difficulty: 'medium', dimension: 'execution' }),
    ).rejects.toThrow('malformed options');
  });

  it('throws when no option or multiple options are marked isBestPractice', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              scenario: 'x',
              options: [
                { text: 'a', dimension: 'D', isBestPractice: true },
                { text: 'b', dimension: 'I', isBestPractice: true },
                { text: 'c', dimension: 'S', isBestPractice: false },
                { text: 'd', dimension: 'C', isBestPractice: false },
              ],
            }),
          },
        ],
      }),
    }) as any;

    await expect(
      service.generate({ industry: 'tech', role: 'EM', difficulty: 'medium', dimension: 'execution' }),
    ).rejects.toThrow('malformed options');
  });

  it('throws with the Claude API error status on a non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'internal error',
    }) as any;

    await expect(
      service.generate({ industry: 'tech', role: 'EM', difficulty: 'medium', dimension: 'execution' }),
    ).rejects.toThrow('Claude API 500');
  });
});
