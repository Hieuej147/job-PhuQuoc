import { Injectable } from '@nestjs/common';
import { PinoLoggerService } from '../../../common/logger/pino-logger.service';

export interface CheckoutResult {
  url: string;
  sessionId: string;
}

@Injectable()
export class MockGateway {
  constructor(private readonly logger: PinoLoggerService) {}

  async createCheckout(params: {
    amount: number;
    currency: string;
    productName: string;
    metadata: Record<string, string>;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutResult> {
    const sessionId = `mock_session_${Date.now()}`;
    this.logger.log(`Mock checkout created: ${sessionId}, amount: ${params.amount}`, 'MockGateway');

    const successUrl = params.successUrl.replace('{CHECKOUT_SESSION_ID}', sessionId);

    return {
      url: successUrl,
      sessionId,
    };
  }

  async verifyWebhook(): Promise<boolean> {
    return true;
  }
}
