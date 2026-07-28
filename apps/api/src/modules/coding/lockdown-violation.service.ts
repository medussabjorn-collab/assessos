import { BadRequestException, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// Records violations reported by client-side lockdown-mode JS (tab switch,
// devtools opened, copy-paste, VM detected). The enforcement/detection
// itself is not backend scope — see the LockdownViolation model comment.
//
// No global ValidationPipe exists in this app (checked — main.ts/app.module
// register none), so a class-validator DTO on the controller would be
// silently inert. Validating here directly guarantees this endpoint can't
// accumulate arbitrary free-text violationType values regardless of that.
export const LOCKDOWN_VIOLATION_TYPES = [
  'tab_switch',
  'window_blur',
  'fullscreen_exit',
  'copy_paste',
  'paste_detected',
  'right_click',
  'devtools_opened',
  'vm_detected',
] as const;
export type LockdownViolationType = (typeof LOCKDOWN_VIOLATION_TYPES)[number];

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
    if (!LOCKDOWN_VIOLATION_TYPES.includes(violationType as LockdownViolationType)) {
      throw new BadRequestException(`Unknown violationType: ${violationType}`);
    }

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
