import { Controller, Get, Query, Res, Request, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions.constants';
import { SlackOAuthService } from './slack-oauth.service';

@Controller('api/integrations/slack')
export class SlackOAuthController {
  constructor(private readonly slackOAuth: SlackOAuthService) {}

  @Get('authorize')
  @UseGuards(FirebaseAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.INTEGRATIONS_MANAGE)
  authorize(@Request() req: any) {
    const url = this.slackOAuth.getAuthorizeUrl(req.headers['x-tenant-id']);
    return { success: true, data: { url } };
  }

  // Public — Slack redirects the browser here directly with no auth header
  // and no x-tenant-id (excluded from TenantMiddleware in app.module.ts).
  // The signed `state` param is what ties this back to a tenant.
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const webUrl = process.env.CORS_ORIGIN || 'http://localhost:3001';

    if (error) {
      res.redirect(`${webUrl}/dashboard/integrations?slack=error&message=${encodeURIComponent(error)}`);
      return;
    }

    try {
      const { teamName } = await this.slackOAuth.handleCallback(code, state);
      res.redirect(`${webUrl}/dashboard/integrations?slack=connected&team=${encodeURIComponent(teamName)}`);
    } catch (err: any) {
      const message = err?.message ?? 'Connection failed';
      res.redirect(`${webUrl}/dashboard/integrations?slack=error&message=${encodeURIComponent(message)}`);
    }
  }
}
