import { BadRequestException, Injectable } from '@nestjs/common';
import { createHmac, randomBytes } from 'crypto';
import { IntegrationsService } from './integrations.service';

// Signed, expiring state param for the OAuth redirect — Slack's callback
// carries no auth header or tenant context of its own, so this is the only
// thing tying that request back to the tenant that started the flow (and
// the HMAC signature guards against a forged/replayed state).
const STATE_TTL_MS = 10 * 60 * 1000;

export interface SlackConnectionConfig {
  accessToken: string;
  teamId: string;
  teamName: string;
  botUserId: string;
  scope: string;
  connectedAt: string;
}

@Injectable()
export class SlackOAuthService {
  constructor(private readonly integrations: IntegrationsService) {}

  private get stateSecret(): string {
    return process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
  }

  // Must exactly match a Redirect URL registered in the Slack app's OAuth &
  // Permissions settings. API_PUBLIC_URL is this API's own public origin —
  // distinct from CORS_ORIGIN (the web app's origin, used below for the
  // browser-facing redirect back after the flow completes).
  private get redirectUri(): string {
    const base = process.env.API_PUBLIC_URL || 'http://localhost:3000';
    return `${base}/api/integrations/slack/callback`;
  }

  private signState(tenantId: string): string {
    const nonce = randomBytes(16).toString('hex');
    const payload = `${tenantId}.${nonce}.${Date.now()}`;
    const sig = createHmac('sha256', this.stateSecret).update(payload).digest('hex');
    return Buffer.from(`${payload}.${sig}`).toString('base64url');
  }

  private verifyState(state: string): string {
    try {
      const decoded = Buffer.from(state, 'base64url').toString('utf8');
      const parts = decoded.split('.');
      if (parts.length !== 4) throw new Error('malformed state');
      const [tenantId, nonce, ts, sig] = parts;
      const expected = createHmac('sha256', this.stateSecret).update(`${tenantId}.${nonce}.${ts}`).digest('hex');
      if (sig !== expected) throw new Error('signature mismatch');
      if (Date.now() - Number(ts) > STATE_TTL_MS) throw new Error('state expired');
      return tenantId;
    } catch {
      throw new BadRequestException('Invalid or expired Slack OAuth state');
    }
  }

  getAuthorizeUrl(tenantId: string): string {
    const clientId = process.env.SLACK_CLIENT_ID;
    if (!clientId) {
      throw new BadRequestException('Slack integration is not configured (SLACK_CLIENT_ID unset)');
    }
    const params = new URLSearchParams({
      client_id: clientId,
      scope: 'chat:write,channels:read',
      redirect_uri: this.redirectUri,
      state: this.signState(tenantId),
    });
    return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
  }

  // Exchanges the code Slack redirected back with for a real bot access
  // token, then makes a real Slack API call (auth.test) to prove the token
  // actually works and to get real workspace identity — never trusts the
  // token-exchange response's team info blindly.
  async handleCallback(code: string, state: string): Promise<{ tenantId: string; teamName: string }> {
    const tenantId = this.verifyState(state);

    const clientId = process.env.SLACK_CLIENT_ID;
    const clientSecret = process.env.SLACK_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new BadRequestException('Slack integration is not configured');
    }

    const tokenRes = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: this.redirectUri,
      }),
    });
    const tokenData = (await tokenRes.json()) as {
      ok: boolean;
      error?: string;
      access_token?: string;
      bot_user_id?: string;
      scope?: string;
      team?: { id: string; name: string };
    };
    if (!tokenData.ok || !tokenData.access_token) {
      throw new BadRequestException(`Slack OAuth exchange failed: ${tokenData.error ?? 'unknown error'}`);
    }

    const accessToken = tokenData.access_token;

    const testRes = await fetch('https://slack.com/api/auth.test', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const testData = (await testRes.json()) as { ok: boolean; error?: string; team?: string; team_id?: string };
    if (!testData.ok) {
      throw new BadRequestException(`Slack token verification failed: ${testData.error ?? 'unknown error'}`);
    }

    const config: SlackConnectionConfig = {
      accessToken,
      teamId: tokenData.team?.id ?? testData.team_id ?? '',
      teamName: tokenData.team?.name ?? testData.team ?? 'Unknown workspace',
      botUserId: tokenData.bot_user_id ?? '',
      scope: tokenData.scope ?? '',
      connectedAt: new Date().toISOString(),
    };

    await this.integrations.connect(tenantId, 'slack', config as unknown as Record<string, unknown>);
    return { tenantId, teamName: config.teamName };
  }
}
