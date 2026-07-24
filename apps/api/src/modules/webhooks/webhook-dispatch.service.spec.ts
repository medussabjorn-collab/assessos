import { createHmac } from 'crypto';
import { WebhookDispatchService } from './webhook-dispatch.service';

describe('WebhookDispatchService', () => {
  const tenantId = 'tenant-1';
  let prisma: any;
  let service: WebhookDispatchService;
  const originalFetch = global.fetch;

  beforeEach(() => {
    prisma = { webhookSubscription: { findMany: jest.fn() } };
    service = new WebhookDispatchService(prisma);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('queries only active subscriptions for this tenant matching the event type', async () => {
    prisma.webhookSubscription.findMany.mockResolvedValue([]);

    await service.dispatch(tenantId, 'assessment.completed', { sessionId: 'sess-1' });

    expect(prisma.webhookSubscription.findMany).toHaveBeenCalledWith({
      where: { tenantId, active: true, eventTypes: { has: 'assessment.completed' } },
    });
  });

  it('POSTs to every matching subscription with a correct HMAC signature', async () => {
    prisma.webhookSubscription.findMany.mockResolvedValue([
      { url: 'https://a.com/hook', secret: 'secret-a' },
      { url: 'https://b.com/hook', secret: 'secret-b' },
    ]);
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock as any;

    await service.dispatch(tenantId, 'assessment.completed', { sessionId: 'sess-1' });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('https://a.com/hook');
    expect(options.headers['X-Webhook-Event']).toBe('assessment.completed');

    const expectedSignature = createHmac('sha256', 'secret-a').update(options.body).digest('hex');
    expect(options.headers['X-Webhook-Signature']).toBe(expectedSignature);
  });

  it('does not throw when a subscriber endpoint fails', async () => {
    prisma.webhookSubscription.findMany.mockResolvedValue([
      { url: 'https://down.example.com/hook', secret: 'secret-a' },
    ]);
    global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED')) as any;

    await expect(
      service.dispatch(tenantId, 'assessment.completed', { sessionId: 'sess-1' }),
    ).resolves.toBeUndefined();
  });

  it('does nothing when no subscriptions match', async () => {
    prisma.webhookSubscription.findMany.mockResolvedValue([]);
    const fetchMock = jest.fn();
    global.fetch = fetchMock as any;

    await service.dispatch(tenantId, 'bias_audit.alert', {});

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
