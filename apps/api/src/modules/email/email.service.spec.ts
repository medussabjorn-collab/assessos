import { EmailService } from './email.service';
import {
  assessmentCompleteTemplate,
  inviteUserTemplate,
  reportReadyTemplate,
  verifyEmailTemplate,
} from './email-templates';

describe('EmailService', () => {
  let service: EmailService;
  const savedEnv = { ...process.env };

  beforeEach(() => {
    service = new EmailService();
    delete process.env.RESEND_API_KEY;
    delete process.env.SMTP_HOST;
  });

  afterAll(() => {
    process.env = savedEnv;
  });

  it('falls back to console logging when no provider is configured', async () => {
    const logSpy = jest.spyOn((service as any).logger, 'log').mockImplementation();
    await expect(
      service.send({ to: 'a@b.test', subject: 'Hi', html: '<p>x</p>' }),
    ).resolves.toBeUndefined();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('a@b.test'));
  });

  it('uses Resend when RESEND_API_KEY is set and throws on API error', async () => {
    process.env.RESEND_API_KEY = 'test-key';
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'invalid key' }),
    }) as any;
    await expect(
      service.send({ to: 'a@b.test', subject: 'Hi', html: '<p>x</p>' }),
    ).rejects.toThrow('Resend error');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('resolves when Resend accepts the message', async () => {
    process.env.RESEND_API_KEY = 'test-key';
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) }) as any;
    await expect(
      service.send({ to: 'a@b.test', subject: 'Hi', html: '<p>x</p>' }),
    ).resolves.toBeUndefined();
  });
});

describe('email templates', () => {
  it('verifyEmailTemplate embeds name and url', () => {
    const html = verifyEmailTemplate('Jane', 'https://x.test/verify?t=1');
    expect(html).toContain('Jane');
    expect(html).toContain('https://x.test/verify?t=1');
    expect(html).toContain('AssessOS');
  });

  it('inviteUserTemplate embeds inviter and role', () => {
    const html = inviteUserTemplate('Morgan', 'https://x.test/invite', 'recruiter');
    expect(html).toContain('Morgan');
    expect(html).toContain('recruiter');
  });

  it('assessmentCompleteTemplate reflects pass/fail styling', () => {
    expect(assessmentCompleteTemplate('J', 'technical', 88, true, 'u')).toContain('✓ Passed');
    expect(assessmentCompleteTemplate('J', 'technical', 42, false, 'u')).toContain('✗ Did not pass');
  });

  it('reportReadyTemplate embeds pillar and url', () => {
    const html = reportReadyTemplate('Jane', 'leadership', 'https://x.test/r/1');
    expect(html).toContain('leadership');
    expect(html).toContain('https://x.test/r/1');
  });
});
