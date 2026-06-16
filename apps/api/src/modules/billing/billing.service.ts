import { Injectable, BadRequestException, Scope } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';
import { StripeService } from './stripe.service';

@Injectable({ scope: Scope.REQUEST })
export class BillingService {
  private tenantId: string;

  constructor(
    private prisma: PrismaService,
    private stripe: StripeService,
    @Inject(REQUEST) private request: any,
  ) {
    this.tenantId = request.headers['x-tenant-id'];
  }

  async createSubscription(
    tenantId: string,
    userId: string,
    plan: string,
  ) {
    // Validate plan
    const prices = this.stripe.getProductPrices();
    if (!prices[plan]) {
      throw new BadRequestException('Invalid plan');
    }

    // Get user and tenant info
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    // Create Stripe customer if not exists
    let customerId: string = '';
    const existingSubscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });

    if (existingSubscription?.stripeCustomerId) {
      customerId = existingSubscription.stripeCustomerId;
    } else {
      customerId = await this.stripe.createCustomer(
        user.email,
        tenant.name,
        { tenantId },
      );
    }

    // Create Stripe subscription
    const stripeSubscription = await this.stripe.createSubscription({
      customerId,
      priceId: prices[plan].priceId,
      tenantId,
    });

    // Update or create subscription in database
    const subscription = await this.prisma.subscription.upsert({
      where: { tenantId },
      update: {
        stripeCustomerId: customerId,
        stripeSubId: stripeSubscription.id,
        plan: plan as any,
        renewsAt: new Date(stripeSubscription.current_period_end * 1000),
      },
      create: {
        tenantId,
        stripeCustomerId: customerId,
        stripeSubId: stripeSubscription.id,
        plan: plan as any,
        seats: plan === 'free' ? 5 : plan === 'pro' ? 50 : 999,
        assessmentCredits:
          plan === 'free' ? 100 : plan === 'pro' ? 999 : 999999,
        renewsAt: new Date(stripeSubscription.current_period_end * 1000),
      },
    });

    return subscription;
  }

  async getSubscription(tenantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });

    if (!subscription) {
      throw new BadRequestException('No subscription found');
    }

    return subscription;
  }

  async processSubscriptionEvent(event: {
    type: string;
    subscriptionId: string;
    customerId: string;
    tenantId: string;
  }) {
    const { type, subscriptionId, tenantId } = event;

    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });

    if (!subscription) {
      return;
    }

    switch (type) {
      case 'customer.subscription.updated':
        const stripeSubUpdated = await this.stripe.getSubscription(
          subscriptionId,
        );
        await this.prisma.subscription.update({
          where: { tenantId },
          data: {
            renewsAt: new Date(stripeSubUpdated.current_period_end * 1000),
          },
        });
        break;

      case 'customer.subscription.deleted':
        await this.prisma.subscription.update({
          where: { tenantId },
          data: {
            plan: 'free',
            seats: 5,
            assessmentCredits: 100,
          },
        });
        break;

      case 'invoice.payment_succeeded':
        console.log(`Payment succeeded for subscription ${subscriptionId}`);
        break;

      case 'invoice.payment_failed':
        console.log(`Payment failed for subscription ${subscriptionId}`);
        break;
    }
  }

  async trackUsage(
    tenantId: string,
    metricName: string,
    quantity: number,
  ) {
    // TODO: Store usage metrics in a usage_events table
    // For now, just log
    console.log(
      `Usage tracked: ${metricName}=${quantity} for tenant ${tenantId}`,
    );
  }

  async getUsage(tenantId: string) {
    // TODO: Aggregate usage from usage_events table
    // For now, return mock data
    return {
      assessmentsUsed: 45,
      assessmentsLimit: 100,
      seatsUsed: 8,
      seatsLimit: 50,
      storageUsedGb: 2.5,
      storageLimitGb: 100,
    };
  }
}
