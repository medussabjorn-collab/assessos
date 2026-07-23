import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { AuthService } from './auth.service';
import { EmailService } from '../email/email.service';
import { inviteUserTemplate } from '../email/email-templates';

export interface CreateInvitationInput {
  email: string;
  name: string;
  roleId: string;
  department?: string;
}

const INVITATION_TTL_DAYS = 7;

@Injectable()
export class InvitationsService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
    private emailService: EmailService,
  ) {}

  private displayStatus(invite: { status: string; expiresAt: Date }): string {
    if (invite.status === 'pending' && invite.expiresAt.getTime() < Date.now()) {
      return 'expired';
    }
    return invite.status;
  }

  async listInvitations(tenantId: string) {
    const invitations = await this.prisma.invitation.findMany({
      where: { tenantId },
      include: { role: { select: { id: true, name: true } }, invitedBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      name: inv.name,
      department: inv.department,
      role: inv.role,
      invitedByName: inv.invitedBy.name,
      status: this.displayStatus(inv),
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
    }));
  }

  async createInvitation(tenantId: string, inviterId: string, inviterName: string, input: CreateInvitationInput) {
    const email = input.email?.trim().toLowerCase();
    if (!email || !input.name?.trim() || !input.roleId) {
      throw new BadRequestException('email, name, and roleId are required');
    }

    const existingUser = await this.prisma.user.findFirst({ where: { tenantId, email } });
    if (existingUser) {
      throw new BadRequestException(`A user with email "${email}" already exists in this organization`);
    }

    const role = await this.prisma.role.findFirst({ where: { id: input.roleId, tenantId } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const existingPending = await this.prisma.invitation.findFirst({
      where: { tenantId, email, status: 'pending' },
    });
    if (existingPending && existingPending.expiresAt.getTime() > Date.now()) {
      throw new BadRequestException(`An invitation is already pending for "${email}"`);
    }
    // A pending-but-past-expiry row would otherwise collide with the
    // partial unique index — mark it expired before creating the new one.
    if (existingPending) {
      await this.prisma.invitation.update({ where: { id: existingPending.id }, data: { status: 'expired' } });
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);

    const invitation = await this.prisma.invitation.create({
      data: {
        tenantId,
        email,
        name: input.name.trim(),
        roleId: input.roleId,
        department: input.department ?? null,
        token,
        expiresAt,
        invitedById: inviterId,
      },
    });

    await this.sendInvitationEmail(invitation.id, inviterName);

    return this.listInvitations(tenantId).then((list) => list.find((i) => i.id === invitation.id));
  }

  async resendInvitation(tenantId: string, id: string, inviterName: string) {
    const invitation = await this.prisma.invitation.findFirst({ where: { id, tenantId } });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    if (invitation.status === 'accepted') {
      throw new BadRequestException('This invitation has already been accepted');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);
    await this.prisma.invitation.update({
      where: { id },
      data: { token, expiresAt, status: 'pending' },
    });

    await this.sendInvitationEmail(id, inviterName);
    return { resent: true };
  }

  async revokeInvitation(tenantId: string, id: string) {
    const invitation = await this.prisma.invitation.findFirst({ where: { id, tenantId } });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    if (invitation.status === 'accepted') {
      throw new BadRequestException('This invitation has already been accepted');
    }

    await this.prisma.invitation.update({ where: { id }, data: { status: 'revoked' } });
    return { revoked: true };
  }

  private async sendInvitationEmail(invitationId: string, inviterName: string) {
    const invitation = await this.prisma.invitation.findUniqueOrThrow({
      where: { id: invitationId },
      include: { role: true },
    });
    const webUrl = process.env.CORS_ORIGIN || 'http://localhost:3001';
    const acceptUrl = `${webUrl}/invite?token=${invitation.token}`;

    await this.emailService
      .send({
        to: invitation.email,
        subject: "You've been invited — AssessOS",
        html: inviteUserTemplate(inviterName, acceptUrl, invitation.role.name.replace(/_/g, ' ')),
      })
      .catch(() => {
        // Best-effort — the invitation row + token exist regardless; an
        // admin can hit "resend" if the email never arrived.
      });
  }

  // Public: only what the accept page needs to render before the invitee
  // has any account — never expose the token back, tenant internals, etc.
  async lookupByToken(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: { role: { select: { name: true } }, tenant: { select: { name: true } } },
    });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const status = this.displayStatus(invitation);
    return {
      email: invitation.email,
      name: invitation.name,
      roleName: invitation.role.name.replace(/_/g, ' '),
      organizationName: invitation.tenant.name,
      status,
    };
  }

  // Called after the invitee has created their own Firebase account
  // client-side (email+password chosen by them) — ties that account to a
  // brand-new User row and marks the invitation accepted. `firebaseUid` and
  // `verifiedEmail` come from a verified Firebase ID token, not client input.
  async acceptInvitation(token: string, firebaseUid: string, verifiedEmail: string) {
    const invitation = await this.prisma.invitation.findUnique({ where: { token } });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    if (invitation.status !== 'pending') {
      throw new BadRequestException(`This invitation has already been ${invitation.status}`);
    }
    if (invitation.expiresAt.getTime() < Date.now()) {
      await this.prisma.invitation.update({ where: { id: invitation.id }, data: { status: 'expired' } });
      throw new BadRequestException('This invitation has expired — ask an admin to resend it');
    }
    if (verifiedEmail.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new BadRequestException('This invitation was issued to a different email address');
    }

    const [, user] = await this.prisma.$transaction([
      this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'accepted', acceptedAt: new Date() },
      }),
      this.prisma.user.create({
        data: {
          tenantId: invitation.tenantId,
          firebaseUid,
          email: invitation.email,
          name: invitation.name,
          roleId: invitation.roleId,
          department: invitation.department,
        },
      }),
    ]);

    return { userId: user.id, tenantId: user.tenantId };
  }
}
