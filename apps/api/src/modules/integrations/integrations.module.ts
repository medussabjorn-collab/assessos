import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { SlackOAuthController } from './slack-oauth.controller';
import { SlackOAuthService } from './slack-oauth.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [IntegrationsController, SlackOAuthController],
  providers: [IntegrationsService, SlackOAuthService, PrismaService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
