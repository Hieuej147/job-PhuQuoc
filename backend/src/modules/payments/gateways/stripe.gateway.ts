import { Injectable } from '@nestjs/common';
import { PinoLoggerService } from '../../../common/logger/pino-logger.service';

export interface CheckoutResult {
  url: string;
  sessionId: string;
}

@Injectable()
export class StripeGateway {
  private stripe: any = null;

  constructor(private readonly logger: PinoLoggerService) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (secretKey) {
      try {
        const Stripe = require('stripe');
        this.stripe = new Stripe(secretKey);
        this.logger.log('Stripe client initialized', 'StripeGateway');
      } catch (error) {
        this.logger.warn('Stripe package not available', 'StripeGateway');
      }
    } else {
      this.logger.warn('STRIPE_SECRET_KEY not set — Stripe gateway disabled', 'StripeGateway');
    }
  }

  isEnabled(): boolean {
    return !!this.stripe;
  }

  async createCheckout(params: {
    amount: number;
    currency: string;
    productName: string;
    metadata: Record<string, string>;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutResult> {
    if (!this.stripe) throw new Error('Stripe not configured');

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: params.currency,
            product_data: {
              name: params.productName,
            },
            unit_amount: params.amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
    });

    this.logger.log(`Stripe session created: ${session.id}`, 'StripeGateway');

    return {
      url: session.url,
      sessionId: session.id,
    };
  }

  constructEvent(payload: Buffer, signature: string, secret: string): any {
    if (!this.stripe) throw new Error('Stripe not configured');
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }
}
