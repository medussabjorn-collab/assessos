import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// Records violations reported by client-side lockdown-mode JS (tab switch,
// devtools opened, copy-paste, VM detected). The enforcement/detection
// itself is not backend scope — see the LockdownViolation model comment.
@Injectable({ scope: Scope.REQUEST })
export class LockdownViolationService {
  private tenantId: string;

  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any,
  ) {
    this.tenantId = request.headers['x-tenant-id'];
  }

  async record(firebaseUid: string, context: string, violationType: string) {
    const user = await this.prisma.user.findFirst({
      where: { firebaseUid, tenantId: this.tenantId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.lockdownViolation.create({
      data: {
        tenantId: this.tenantId,
        userId: user.id,
        context,
        violationType,
      },
    });
  }
}
