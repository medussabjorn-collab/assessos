import { Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export abstract class BaseRepository {
  protected prisma: PrismaClient;
  protected tenantId: string;

  constructor(
    @Inject(REQUEST) private request: Request,
    prisma: PrismaClient
  ) {
    this.prisma = prisma;
    this.tenantId = (request as any).tenantId;
  }

  protected getTenantFilter() {
    return { tenantId: this.tenantId };
  }

  protected getSelectWithoutTenantId(fields: Record<string, boolean>) {
    const { tenantId, ...rest } = fields;
    return rest;
  }
}
