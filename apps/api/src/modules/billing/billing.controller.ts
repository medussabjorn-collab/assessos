import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { RawBodyRequest } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';

@Controller('api/billing')
export class BillingController {
  constructor(
    private billingService: BillingService,
    private stripeService: StripeService,
  ) {}

  @Post('subscriptions/create')
  @UseGuards(FirebaseAuthGuard)
  async createSubscription(
    @Body() body: { plan: string },
    @Req() req: any,
  ) {
    const { uid } = req.user;
    const tenantId = req.headers['x-tenant-id'];

    const subscription = await this.billingService.createSubscription(
      tenantId,
      uid,
      body.plan,
    );

    return {
      success: true,
      data: subscription,
    };
  }

  @Get('subscriptions')
  @UseGuards(FirebaseAuthGuard)
  async getSubscription(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'];

    const subscription = await this.billingService.getSubscription(tenantId);

    return {
      success: true,
      data: subscription,
    };
  }

  @Post('webhooks/stripe')
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<any>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    const event = this.stripeService.verifyWebhookSignature(
      req.rawBody.toString(),
      signature,
    );

    if (!event) {
      throw new BadRequestException('Webhook signature verification failed');
    }

    const result = await this.stripeService.handleSubscriptionEvent(event);
    if (result) {
      await this.billingService.processSubscriptionEvent(result);
    }

    return { received: true };
  }

  @Post('usage/track')
  @UseGuards(FirebaseAuthGuard)
  async trackUsage(
    @Body() body: { metricName: string; quantity: number },
    @Req() req: any,
  ) {
    const tenantId = req.headers['x-tenant-id'];

    await this.billingService.trackUsage(tenantId, body.metricName, body.quantity);

    return {
      success: true,
      message: 'Usage tracked',
    };
  }

  @Get('usage')
  @UseGuards(FirebaseAuthGuard)
  async getUsage(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'];

    const usage = await this.billingService.getUsage(tenantId);

    return {
      success: true,
      data: usage,
    };
  }
}
