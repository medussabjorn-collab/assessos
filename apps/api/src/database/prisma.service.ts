import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error: unknown) {
      // Don't crash the whole app if the DB is unreachable at boot — the
      // mock-data endpoints stay available and DB-backed routes fail per-request.
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Database connection failed at startup: ${message}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
