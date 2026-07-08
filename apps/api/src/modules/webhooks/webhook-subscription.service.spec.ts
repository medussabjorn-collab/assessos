import { NotFoundException } from '@nestjs/common';
import { WebhookSubscriptionService } from './webhook-subscription.service';

describe('WebhookSubscriptionService', () => {
  const tenantId = 'tenant-1';
  let prisma: any;
  let service: WebhookSubscriptionService;

  beforeEach(() => {
    prisma = {
      webhookSubscription: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    const request = { headers: { 'x-tenant-id': tenantId } };
    service = new WebhookSubscriptionService(prisma, request);
  });

  describe('register', () => {
    it('rejects a non-http(s) URL', async () => {
      await expect(
        service.register('ftp://example.com/hook', ['assessment.completed']),
      ).rejects.toThrow('valid http(s) URL');
      expect(prisma.webhookSubscription.create).not.toHaveBeenCalled();
    });

    it('rejects an unknown event type', async () => {
      await expect(
        service.register('https://example.com/hook', ['not.a.real.event' as any]),
      ).rejects.toThrow('Unknown event type');
    });

    it('creates a subscription with a generated secret', async () => {
      prisma.webhookSubscription.create.mockResolvedValue({ id: 'sub-1', secret: 'abc' });

      await service.register('https://example.com/hook', ['assessment.completed']);

      const args = prisma.webhookSubscription.create.mock.calls[0][0];
      expect(args.data.tenantId).toBe(tenantId);
      expect(args.data.url).toBe('https://example.com/hook');
      expect(args.data.eventTypes).toEqual(['assessment.completed']);
      expect(typeof args.data.secret).toBe('string');
      expect(args.data.secret.length).toBeGreaterThanOrEqual(32);
    });
  });

  describe('list', () => {
    it('never includes the secret in list results', async () => {
      prisma.webhookSubscription.findMany.mockResolvedValue([
        { id: 'sub-1', url: 'https://a.com', eventTypes: ['assessment.completed'], secret: 'super-secret', active: true },
      ]);

      const result = await service.list();

      expect(result[0]).not.toHaveProperty('secret');
    });
  });

  describe('deactivate', () => {
    it('throws NotFoundException for a subscription outside this tenant', async () => {
      prisma.webhookSubscription.findFirst.mockResolvedValue(null);

      await expect(service.deactivate('sub-1')).rejects.toThrow(NotFoundException);
      expect(prisma.webhookSubscription.update).not.toHaveBeenCalled();
    });

    it('sets active to false', async () => {
      prisma.webhookSubscription.findFirst.mockResolvedValue({ id: 'sub-1', tenantId });
      prisma.webhookSubscription.update.mockResolvedValue({ id: 'sub-1', active: false });

      await service.deactivate('sub-1');

      expect(prisma.webhookSubscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: { active: false },
      });
    });
  });
});
