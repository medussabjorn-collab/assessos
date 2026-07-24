import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { WhiteLabelService } from './white-label.service';
import { SsoConfigService } from './sso-config.service';
import { SettingsController } from './settings.controller';

// SettingsController + WhiteLabelService existed as complete, working code
// but were never registered here or in app.module.ts — the white-label
// routes (api/settings/white-label*) never mounted. Wiring them up is the
// actual #12 fix; see docs/superpowers/specs for the gap-analysis entry
// this closes.
@Module({
  controllers: [SettingsController],
  providers: [PrismaService, WhiteLabelService, SsoConfigService],
  exports: [PrismaService, WhiteLabelService, SsoConfigService],
})
export class TenantModule {}
