import { EvidenceService } from './evidence.service';

describe('EvidenceService', () => {
  const tenantId = 'tenant-1';
  const sessionId = 'sess-1';

  let prisma: any;
  let chain: any;
  let service: EvidenceService;

  beforeEach(() => {
    prisma = {
      evidenceArtifact: {
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'art-1', ...data })),
        findMany: jest.fn(),
      },
    };
    chain = { append: jest.fn().mockResolvedValue(undefined) };
    service = new EvidenceService(prisma, chain);
  });

  describe('record', () => {
    it('persists the artifact with its storageRef and contentHash', async () => {
      const artifact = await service.record(tenantId, {
        sessionId, type: 'snapshot', storageRef: 'gs://bucket/obj.jpg', contentHash: 'abc123',
      });

      expect(artifact.storageRef).toBe('gs://bucket/obj.jpg');
      expect(artifact.contentHash).toBe('abc123');
      expect(prisma.evidenceArtifact.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId, sessionId, type: 'snapshot', storageRef: 'gs://bucket/obj.jpg', contentHash: 'abc123',
        }),
      });
    });

    it('commits the capture into the tamper-evident integrity chain', async () => {
      const artifact = await service.record(tenantId, {
        sessionId, type: 'clip', storageRef: 'gs://bucket/clip.webm', contentHash: 'def456',
      });

      expect(chain.append).toHaveBeenCalledWith(tenantId, sessionId, 'evidence_captured', {
        artifactId: artifact.id,
        type: 'clip',
        contentHash: 'def456',
        storageRef: 'gs://bucket/clip.webm',
      });
    });

    it('links an optional triggering eventId when provided', async () => {
      const artifact = await service.record(tenantId, {
        sessionId, type: 'snapshot', storageRef: 'ref', contentHash: 'hash', eventId: 'evt-1',
      });

      expect(artifact.eventId).toBe('evt-1');
    });
  });

  describe('list', () => {
    it('scopes to tenant+session, oldest first', async () => {
      prisma.evidenceArtifact.findMany.mockResolvedValue([]);

      await service.list(tenantId, sessionId);

      expect(prisma.evidenceArtifact.findMany).toHaveBeenCalledWith({
        where: { tenantId, sessionId },
        orderBy: { capturedAt: 'asc' },
      });
    });
  });
});
