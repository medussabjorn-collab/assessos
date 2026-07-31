import { DigestService } from './digest.service';

describe('DigestService', () => {
  let prisma: any;
  let emailService: any;
  let service: DigestService;

  const activeTenant = { id: 'tenant-1', name: 'Acme', settings: null };
  const disabledTenant = { id: 'tenant-2', name: 'Disabled Co', settings: { disabled: true } };

  beforeEach(() => {
    prisma = {
      tenant: { findMany: jest.fn() },
      aiReport: { count: jest.fn() },
      decisionReviewRequest: { count: jest.fn() },
      candidate: { count: jest.fn() },
      user: { findMany: jest.fn() },
    };
    emailService = { send: jest.fn().mockResolvedValue(undefined) };
    service = new DigestService(prisma, emailService);
  });

  it('skips tenants with settings.disabled = true entirely', async () => {
    prisma.tenant.findMany.mockResolvedValue([disabledTenant]);

    const result = await service.sendWeeklyDigests();

    expect(result).toEqual({ tenantsProcessed: 0, emailsSent: 0 });
    expect(prisma.aiReport.count).not.toHaveBeenCalled();
    expect(emailService.send).not.toHaveBeenCalled();
  });

  it('sends no email for a tenant with zero activity this week (no quiet-week spam)', async () => {
    prisma.tenant.findMany.mockResolvedValue([activeTenant]);
    prisma.aiReport.count.mockResolvedValue(0);
    prisma.decisionReviewRequest.count.mockResolvedValue(0);
    prisma.candidate.count.mockResolvedValue(0);

    const result = await service.sendWeeklyDigests();

    expect(result).toEqual({ tenantsProcessed: 1, emailsSent: 0 });
    expect(prisma.user.findMany).not.toHaveBeenCalled();
    expect(emailService.send).not.toHaveBeenCalled();
  });

  it('sends a real digest to every ANALYTICS_ORG_DASHBOARD_VIEW-holding recipient with the correct stats', async () => {
    prisma.tenant.findMany.mockResolvedValue([activeTenant]);
    prisma.aiReport.count.mockResolvedValue(3);
    prisma.decisionReviewRequest.count.mockResolvedValue(1);
    prisma.candidate.count.mockResolvedValue(5);
    prisma.user.findMany.mockResolvedValue([
      { name: 'Alex Admin', email: 'alex@acme.test' },
      { name: 'Jamie Admin', email: 'jamie@acme.test' },
    ]);

    const result = await service.sendWeeklyDigests();

    expect(result).toEqual({ tenantsProcessed: 1, emailsSent: 2 });
    expect(emailService.send).toHaveBeenCalledTimes(2);
    const firstCall = emailService.send.mock.calls[0][0];
    expect(firstCall.to).toBe('alex@acme.test');
    expect(firstCall.subject).toContain('weekly');
    expect(firstCall.html).toContain('3');
    expect(firstCall.html).toContain('1');
    expect(firstCall.html).toContain('5');

    // Recipient query respects the permission system, not a hardcoded role name.
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-1',
          isActive: true,
        }),
      }),
    );
  });

  it("does not let one recipient's send failure stop the next recipient or the next tenant", async () => {
    const tenant2 = { id: 'tenant-3', name: 'Beta', settings: null };
    prisma.tenant.findMany.mockResolvedValue([activeTenant, tenant2]);
    prisma.aiReport.count.mockResolvedValue(1);
    prisma.decisionReviewRequest.count.mockResolvedValue(0);
    prisma.candidate.count.mockResolvedValue(0);
    prisma.user.findMany
      .mockResolvedValueOnce([
        { name: 'Bad Address', email: 'bad@acme.test' },
        { name: 'Good Address', email: 'good@acme.test' },
      ])
      .mockResolvedValueOnce([{ name: 'Beta Admin', email: 'admin@beta.test' }]);

    emailService.send
      .mockRejectedValueOnce(new Error('mailbox rejected'))
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    const result = await service.sendWeeklyDigests();

    expect(result).toEqual({ tenantsProcessed: 2, emailsSent: 2 });
    expect(emailService.send).toHaveBeenCalledTimes(3);
  });
});
