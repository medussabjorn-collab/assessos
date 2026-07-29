import { PolicyService, DEFAULT_POLICY } from './policy.service';

describe('PolicyService', () => {
  const tenantId = 'tenant-1';

  let prisma: any;
  let service: PolicyService;

  beforeEach(() => {
    prisma = {
      proctoringPolicy: {
        findFirst: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
    };
    service = new PolicyService(prisma);
  });

  describe('getEffective — resolution order', () => {
    it('returns the config-specific policy when one exists', async () => {
      const specific = { ...DEFAULT_POLICY, requireRoomScan: true, extraDbField: 'ignored' };
      prisma.proctoringPolicy.findFirst.mockResolvedValueOnce(specific);

      const result = await service.getEffective(tenantId, 'cfg-1');

      expect(result.requireRoomScan).toBe(true);
      expect(prisma.proctoringPolicy.findFirst).toHaveBeenCalledWith({
        where: { tenantId, configId: 'cfg-1' },
      });
      // strip() should not leak arbitrary DB fields through
      expect((result as any).extraDbField).toBeUndefined();
    });

    it('falls back to the tenant default (configId: null) when no config-specific row exists', async () => {
      prisma.proctoringPolicy.findFirst
        .mockResolvedValueOnce(null) // config-specific lookup
        .mockResolvedValueOnce({ ...DEFAULT_POLICY, warningThreshold: 15 }); // tenant default

      const result = await service.getEffective(tenantId, 'cfg-1');

      expect(result.warningThreshold).toBe(15);
      expect(prisma.proctoringPolicy.findFirst).toHaveBeenNthCalledWith(2, {
        where: { tenantId, configId: null },
      });
    });

    it('falls back to the built-in DEFAULT_POLICY when neither row exists', async () => {
      prisma.proctoringPolicy.findFirst.mockResolvedValue(null);

      const result = await service.getEffective(tenantId, 'cfg-1');

      expect(result).toEqual(DEFAULT_POLICY);
    });

    it('skips the config-specific lookup entirely when configId is not passed', async () => {
      prisma.proctoringPolicy.findFirst.mockResolvedValue(null);

      await service.getEffective(tenantId, null);

      expect(prisma.proctoringPolicy.findFirst).toHaveBeenCalledTimes(1);
      expect(prisma.proctoringPolicy.findFirst).toHaveBeenCalledWith({
        where: { tenantId, configId: null },
      });
    });
  });

  describe('upsert', () => {
    it('updates the existing row when one is found for this tenant+configId', async () => {
      prisma.proctoringPolicy.findFirst.mockResolvedValue({ id: 'pol-1' });
      prisma.proctoringPolicy.update.mockResolvedValue({ id: 'pol-1', requireRoomScan: true });

      await service.upsert(tenantId, 'cfg-1', { requireRoomScan: true });

      expect(prisma.proctoringPolicy.update).toHaveBeenCalledWith({
        where: { id: 'pol-1' },
        data: { requireRoomScan: true },
      });
      expect(prisma.proctoringPolicy.create).not.toHaveBeenCalled();
    });

    it('creates a new row when none exists yet, including a null configId for the tenant default', async () => {
      prisma.proctoringPolicy.findFirst.mockResolvedValue(null);
      prisma.proctoringPolicy.create.mockResolvedValue({ id: 'pol-new' });

      await service.upsert(tenantId, null, { warningThreshold: 20 });

      expect(prisma.proctoringPolicy.create).toHaveBeenCalledWith({
        data: { tenantId, configId: null, warningThreshold: 20 },
      });
    });
  });
});
