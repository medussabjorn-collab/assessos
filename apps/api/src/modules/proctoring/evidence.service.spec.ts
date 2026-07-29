import { BadRequestException } from '@nestjs/common';
import { EvidenceService } from './evidence.service';

describe('EvidenceService', () => {
  const tenantId = 'tenant-1';
  const sessionId = 'sess-1';

  let prisma: any;
  let chain: any;
  let storage: any;
  let service: EvidenceService;

  beforeEach(() => {
    prisma = {
      evidenceArtifact: {
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'art-1', ...data })),
        findMany: jest.fn(),
      },
    };
    chain = { append: jest.fn().mockResolvedValue(undefined) };
    storage = {
      ready: true,
      upload: jest.fn().mockResolvedValue({
        storageRef: 'gs://bucket/tenant-1/sess-1/123-abc.jpg',
        contentHash: 'realhash123',
        sizeBytes: 4,
      }),
    };
    service = new EvidenceService(prisma, chain, storage);
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

  describe('captureAndRecord', () => {
    const tinyPngBase64 =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

    it('throws when storage is not configured for this tenant', async () => {
      storage.ready = false;

      await expect(
        service.captureAndRecord(tenantId, { sessionId, type: 'snapshot', imageBase64: tinyPngBase64 }),
      ).rejects.toThrow(BadRequestException);
      expect(storage.upload).not.toHaveBeenCalled();
    });

    it('decodes a data-URL image, uploads the real bytes, and records the server-computed hash/ref', async () => {
      const artifact = await service.captureAndRecord(tenantId, {
        sessionId, type: 'snapshot', imageBase64: tinyPngBase64,
      });

      expect(storage.upload).toHaveBeenCalledWith(
        tenantId, sessionId, expect.any(Buffer), 'image/png',
      );
      expect(artifact.storageRef).toBe('gs://bucket/tenant-1/sess-1/123-abc.jpg');
      expect(artifact.contentHash).toBe('realhash123');
    });

    it('accepts raw base64 (no data-URL prefix) and defaults to image/jpeg', async () => {
      await service.captureAndRecord(tenantId, {
        sessionId, type: 'snapshot', imageBase64: 'aGVsbG8=',
      });

      expect(storage.upload).toHaveBeenCalledWith(tenantId, sessionId, expect.any(Buffer), 'image/jpeg');
    });

    it('rejects a payload that is neither a valid data URL nor plain base64', async () => {
      await expect(
        service.captureAndRecord(tenantId, { sessionId, type: 'snapshot', imageBase64: 'not base64 at all!!' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an image over the 5MB size limit', async () => {
      const bigBase64 = Buffer.alloc(6 * 1024 * 1024).toString('base64');

      await expect(
        service.captureAndRecord(tenantId, { sessionId, type: 'snapshot', imageBase64: bigBase64 }),
      ).rejects.toThrow(BadRequestException);
      expect(storage.upload).not.toHaveBeenCalled();
    });

    it('commits the capture into the integrity chain via record()', async () => {
      const artifact = await service.captureAndRecord(tenantId, {
        sessionId, type: 'snapshot', imageBase64: tinyPngBase64,
      });

      expect(chain.append).toHaveBeenCalledWith(tenantId, sessionId, 'evidence_captured', {
        artifactId: artifact.id,
        type: 'snapshot',
        contentHash: 'realhash123',
        storageRef: 'gs://bucket/tenant-1/sess-1/123-abc.jpg',
      });
    });
  });
});
