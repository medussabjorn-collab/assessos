import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuthService } from '../auth/auth.service';
import { EmailService } from '../email/email.service';
import { inviteUserTemplate } from '../email/email-templates';

export interface InviteUserInput {
  email: string;
  name: string;
  roleId: string;
  department?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  department?: string;
}

@Injectable()
export class UsersManagementService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
    private emailService: EmailService,
  ) {}

  async listUsers(tenantId: string) {
    const users = await this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        isActive: true,
        role: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
    return users;
  }

  async inviteUser(tenantId: string, inviterName: string, input: InviteUserInput) {
    const email = input.email?.trim().toLowerCase();
    if (!email || !input.name?.trim() || !input.roleId) {
      throw new BadRequestException('email, name, and roleId are required');
    }

    const existing = await this.prisma.user.findFirst({ where: { tenantId, email } });
    if (existing) {
      throw new BadRequestException(`A user with email "${email}" already exists in this organization`);
    }

    const role = await this.prisma.role.findFirst({ where: { id: input.roleId, tenantId } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const firebaseUser = await this.authService.createFirebaseUser(email, input.name.trim());

    const user = await this.prisma.user.create({
      data: {
        tenantId,
        firebaseUid: firebaseUser.uid,
        email,
        name: input.name.trim(),
        roleId: input.roleId,
        department: input.department ?? null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        isActive: true,
        role: { select: { id: true, name: true } },
      },
    });

    const resetLink = await this.authService.generatePasswordResetLink(email);
    await this.emailService
      .send({
        to: email,
        subject: "You've been invited — AssessOS",
        html: inviteUserTemplate(inviterName, resetLink, role.name.replace(/_/g, ' ')),
      })
      .catch(() => {
        // Invite email is best-effort — the account + reset link both exist
        // regardless; an admin can regenerate/resend manually if needed.
      });

    return user;
  }

  async updateUser(tenantId: string, userId: string, input: UpdateUserInput) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const email = input.email?.trim().toLowerCase();
    if (email && email !== user.email) {
      const clash = await this.prisma.user.findFirst({ where: { tenantId, email } });
      if (clash) {
        throw new BadRequestException(`A user with email "${email}" already exists in this organization`);
      }
      await this.authService.updateFirebaseUserEmail(user.firebaseUid, email);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name: input.name?.trim() ?? undefined,
        department: input.department !== undefined ? input.department : undefined,
        email: email ?? undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        isActive: true,
        role: { select: { id: true, name: true } },
      },
    });
  }

  async setActive(tenantId: string, userId: string, actingUserId: string, isActive: boolean) {
    if (userId === actingUserId) {
      throw new BadRequestException('You cannot deactivate your own account');
    }

    const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        isActive: true,
        role: { select: { id: true, name: true } },
      },
    });
  }
}
