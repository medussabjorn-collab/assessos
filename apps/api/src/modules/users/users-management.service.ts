import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuthService } from '../auth/auth.service';

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
