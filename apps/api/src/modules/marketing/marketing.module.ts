import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { MarketingService } from './marketing.service';
import { MarketingController } from './marketing.controller';
import { PrismaService } from '../../database/prisma.service';
import { EmailModule } from '../email/email.module';

@Module({
  // Scoped ThrottlerModule backs @Throttle + ThrottlerGuard on
  // MarketingController's two routes only — not global, matching the same
  // pattern CodingModule uses. Tighter than CodingModule's 20/60s since
  // these routes carry no auth guard at all backing them.
  imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 30 }]), EmailModule],
  controllers: [MarketingController],
  providers: [MarketingService, PrismaService],
})
export class MarketingModule {}
