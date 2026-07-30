import { BadRequestException } from '@nestjs/common';
import { SlackOAuthService } from './slack-oauth.service';

describe('SlackOAuthService', () => {
  const tenantId = 'tenant-1';
  let integrations: any;
  let service: SlackOAuthService;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    process.env.SLACK_CLIENT_ID = 'client-123';
    process.env.SLACK_CLIENT_SECRET = 'secret-456';
    process.env.JWT_SECRET = 'test-state-secret';
    process.env.API_PUBLIC_URL = 'http://localhost:3000';

    integrations = { connect: jest.fn().mockResolvedValue({}) };
    service = new SlackOAuthService(integrations);

    fetchMock = jest.fn();
    (global as any).fetch = fetchMock;
  });

  describe('getAuthorizeUrl', () => {
    it('builds a real Slack authorize URL with client_id, scope, redirect_uri, and a signed state', () => {
      const url = new URL(service.getAuthorizeUrl(tenantId));
      expect(url.origin + url.pathname).toBe('https://slack.com/oauth/v2/authorize');
      expect(url.searchParams.get('client_id')).toBe('client-123');
      expect(url.searchParams.get('scope')).toBe('chat:write,channels:read');
      expect(url.searchParams.get('redirect_uri')).toBe('http://localhost:3000/api/integrations/slack/callback');
      expect(url.searchParams.get('state')).toBeTruthy();
    });

    it('throws when SLACK_CLIENT_ID is not configured', () => {
      delete process.env.SLACK_CLIENT_ID;
      expect(() => service.getAuthorizeUrl(tenantId)).toThrow(BadRequestException);
    });
  });

  describe('handleCallback', () => {
    function stateFor(tid: string): string {
      const url = new URL(service.getAuthorizeUrl(tid));
      return url.searchParams.get('state')!;
    }

    it('rejects a tampered state before making any Slack API call', async () => {
      const state = stateFor(tenantId);
      const tampered = state.slice(0, -2) + 'xx';
      await expect(service.handleCallback('real-code', tampered)).rejects.toThrow(BadRequestException);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects a state signed with a different secret (forged elsewhere)', async () => {
      const state = stateFor(tenantId);
      process.env.JWT_SECRET = 'a-different-secret';
      await expect(service.handleCallback('real-code', state)).rejects.toThrow(BadRequestException);
    });

    it('exchanges a real code, verifies the token, and records the real workspace via IntegrationsService.connect', async () => {
      const state = stateFor(tenantId);
      fetchMock
        .mockResolvedValueOnce({
          json: async () => ({
            ok: true,
            access_token: 'xoxb-real-token',
            bot_user_id: 'U123',
            scope: 'chat:write,channels:read',
            team: { id: 'T123', name: 'Prelim.io' },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({ ok: true, team: 'Prelim.io', team_id: 'T123' }),
        });

      const result = await service.handleCallback('real-code', state);

      expect(result).toEqual({ tenantId, teamName: 'Prelim.io' });
      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        'https://slack.com/api/oauth.v2.access',
        expect.objectContaining({ method: 'POST' }),
      );
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        'https://slack.com/api/auth.test',
        expect.objectContaining({ headers: { Authorization: 'Bearer xoxb-real-token' } }),
      );
      expect(integrations.connect).toHaveBeenCalledWith(
        tenantId,
        'slack',
        expect.objectContaining({
          accessToken: 'xoxb-real-token',
          teamId: 'T123',
          teamName: 'Prelim.io',
          botUserId: 'U123',
        }),
      );
    });

    it('rejects when the code exchange itself fails (e.g. reused/expired code)', async () => {
      const state = stateFor(tenantId);
      fetchMock.mockResolvedValueOnce({ json: async () => ({ ok: false, error: 'invalid_code' }) });

      await expect(service.handleCallback('bad-code', state)).rejects.toThrow(BadRequestException);
      expect(integrations.connect).not.toHaveBeenCalled();
    });

    it('rejects when the post-exchange token-verification call fails', async () => {
      const state = stateFor(tenantId);
      fetchMock
        .mockResolvedValueOnce({
          json: async () => ({ ok: true, access_token: 'xoxb-real-token', team: { id: 'T1', name: 'X' } }),
        })
        .mockResolvedValueOnce({ json: async () => ({ ok: false, error: 'token_revoked' }) });

      await expect(service.handleCallback('real-code', state)).rejects.toThrow(BadRequestException);
      expect(integrations.connect).not.toHaveBeenCalled();
    });
  });
});
