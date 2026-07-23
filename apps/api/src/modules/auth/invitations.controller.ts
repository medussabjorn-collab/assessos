import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from './auth.guard';
import { PermissionsGuard } from './permissions.guard';
import { RequirePermission } from './permissions.decorator';
import { PERMISSIONS } from './permissions.constants';
import { InvitationsService, CreateInvitationInput } from './invitations.service';

@Controller('api/invitations')
export class InvitationsController {
  constructor(private invitations: InvitationsService) {}

  @Get()
  @UseGuards(FirebaseAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.USERS_MANAGE)
  async list(@Request() req: any) {
    const data = await this.invitations.listInvitations(req.resolvedUser.tenantId);
    return { success: true, data };
  }

  @Post()
  @UseGuards(FirebaseAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.USERS_MANAGE)
  async create(@Request() req: any, @Body() body: CreateInvitationInput) {
    const data = await this.invitations.createInvitation(
      req.resolvedUser.tenantId,
      req.resolvedUser.id,
      req.resolvedUser.role.name,
      body,
    );
    return { success: true, data, message: 'Invitation sent' };
  }

  @Post(':id/resend')
  @UseGuards(FirebaseAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.USERS_MANAGE)
  async resend(@Request() req: any, @Param('id') id: string) {
    await this.invitations.resendInvitation(req.resolvedUser.tenantId, id, req.resolvedUser.role.name);
    return { success: true, message: 'Invitation resent' };
  }

  @Post(':id/revoke')
  @UseGuards(FirebaseAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.USERS_MANAGE)
  async revoke(@Request() req: any, @Param('id') id: string) {
    await this.invitations.revokeInvitation(req.resolvedUser.tenantId, id);
    return { success: true, message: 'Invitation revoked' };
  }

  // Public — the invitee has no account/token yet, this is what the
  // accept page renders before anything else happens.
  @Get('lookup')
  async lookup(@Query('token') token: string) {
    const data = await this.invitations.lookupByToken(token);
    return { success: true, data };
  }

  // The invitee has just created their own Firebase account client-side
  // (email+password chosen by them); this ties it to a new User row.
  @Post('accept')
  @UseGuards(FirebaseAuthGuard)
  async accept(@Request() req: any, @Body() body: { token: string }) {
    const { uid, email } = req.user;
    const data = await this.invitations.acceptInvitation(body.token, uid, email);
    return { success: true, data, message: 'Welcome aboard' };
  }
}
