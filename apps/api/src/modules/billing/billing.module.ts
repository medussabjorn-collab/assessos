import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { StripeService } from './stripe.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [BillingController],
  providers: [BillingService, StripeService, PrismaService],
  exports: [BillingService, StripeService],
})
export class BillingModule {}
