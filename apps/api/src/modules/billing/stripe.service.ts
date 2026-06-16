import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

export interface CreateSubscriptionRequest {
  customerId: string;
  priceId: string;
  tenantId: string;
}

export interface SubscriptionEvent {
  type: string;
  subscription: Stripe.Subscription;
}

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16',
    });
  }

  async createCustomer(
    email: string,
    name: string,
    metadata: Record<string, string>,
  ): Promise<string> {
    const customer = await this.stripe.customers.create({
      email,
      name,
      metadata,
    });

    return customer.id;
  }

  async createSubscription(
    request: CreateSubscriptionRequest,
  ): Promise<Stripe.Subscription> {
    const subscription = await this.stripe.subscriptions.create({
      customer: request.customerId,
      items: [{ price: request.priceId }],
      metadata: {
        tenantId: request.tenantId,
      },
    });

    return subscription;
  }

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.retrieve(subscriptionId);
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.stripe.subscriptions.cancel(subscriptionId);
  }

  async updateSubscription(
    subscriptionId: string,
    updateParams: Stripe.SubscriptionUpdateParams,
  ): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.update(subscriptionId, updateParams);
  }

  verifyWebhookSignature(
    body: string,
    signature: string,
  ): Stripe.Event | null {
    try {
      const event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || '',
      );
      return event;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return null;
    }
  }

  async handleSubscriptionEvent(
    event: Stripe.Event,
  ): Promise<{
    type: string;
    subscriptionId: string;
    customerId: string;
    tenantId: string;
  } | null> {
    const subscription = event.data.object as Stripe.Subscription;

    return {
      type: event.type,
      subscriptionId: subscription.id,
      customerId: subscription.customer as string,
      tenantId: subscription.metadata?.tenantId || '',
    };
  }

  getProductPrices(): Record<string, { priceId: string; amount: number }> {
    return {
      free: {
        priceId: process.env.STRIPE_PRICE_FREE || '',
        amount: 0,
      },
      pro: {
        priceId: process.env.STRIPE_PRICE_PRO || '',
        amount: 29900, // $299 in cents
      },
      enterprise: {
        priceId: process.env.STRIPE_PRICE_ENTERPRISE || '',
        amount: 0, // Custom pricing
      },
    };
  }
}
