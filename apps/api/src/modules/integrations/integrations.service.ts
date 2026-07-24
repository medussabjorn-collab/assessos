import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CATALOG_BY_ID, INTEGRATION_CATALOG } from './integration-catalog';

export type IntegrationStatus = 'connected' | 'disconnected' | 'pending' | 'error';

/**
 * Integration connection registry. Tracks which catalog integrations a tenant
 * has connected and their status/config. It does NOT perform real provider
 * sync (calling Workday/SAP/etc.) — that's a separate P1 effort. Connecting
 * records intent + status against the Integration table.
 */
@Injectable()
export class IntegrationsService {
  constructor(private readonly prisma: PrismaService) {}

  listCatalog() {
    return INTEGRATION_CATALOG;
  }

  // Every catalog entry, annotated with this tenant's connection state.
  async listForTenant(tenantId: string) {
    const rows = await this.prisma.integration.findMany({ where: { tenantId } });
    const byName = new Map(rows.map((r) => [r.name, r]));
    return INTEGRATION_CATALOG.map((entry) => {
      const row = byName.get(entry.id);
      return {
        ...entry,
        status: (row?.status as IntegrationStatus) ?? 'disconnected',
        lastSyncAt: row?.lastSyncAt ?? null,
        connectedAt: row?.createdAt ?? null,
      };
    });
  }

  async connect(tenantId: string, name: string, config?: Record<string, unknown>) {
    this.assertKnown(name);
    return this.prisma.integration.upsert({
      where: { tenantId_name: { tenantId, name } },
      update: {
        status: 'connected',
        config: (config as Prisma.InputJsonValue) ?? undefined,
        lastSyncAt: new Date(),
      },
      create: {
        tenantId,
        name,
        category: CATALOG_BY_ID.get(name)!.category,
        status: 'connected',
        config: (config as Prisma.InputJsonValue) ?? undefined,
        lastSyncAt: new Date(),
      },
    });
  }

  async disconnect(tenantId: string, name: string) {
    this.assertKnown(name);
    // Upsert so disconnecting a never-connected integration is idempotent.
    return this.prisma.integration.upsert({
      where: { tenantId_name: { tenantId, name } },
      update: { status: 'disconnected' },
      create: {
        tenantId,
        name,
        category: CATALOG_BY_ID.get(name)!.category,
        status: 'disconnected',
      },
    });
  }

  private assertKnown(name: string) {
    if (!CATALOG_BY_ID.has(name)) {
      throw new BadRequestException(`Unknown integration: ${name}`);
    }
  }
}
