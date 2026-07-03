import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JobContractService } from '../shared/contracts/job.contract';
import { CompanyContractService } from '../shared/contracts/company.contract';
import { PricingContractService } from '../shared/contracts/pricing.contract';
import { StripeGateway } from './gateways/stripe.gateway';
import { MockGateway } from './gateways/mock.gateway';
import { PaymentQueryDto } from './dto/payment.dto';
import { PaymentCompletionService } from './application/payment-completion.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobContract: JobContractService,
    private readonly companyContract: CompanyContractService,
    private readonly pricingContract: PricingContractService,
    private readonly stripeGateway: StripeGateway,
    private readonly mockGateway: MockGateway,
    private readonly paymentCompletion: PaymentCompletionService,
  ) {}

  async createCheckout(userId: string, jobId: string, packageId: string) {
    // Verify job exists and user owns it
    const job = await this.jobContract.findById(jobId);
    if (!job) throw new NotFoundException('Job not found');

    const company = await this.companyContract.findById(job.companyId);
    if (!company || company.ownerId !== userId) throw new BadRequestException('Not your job');
    if (job.status === 'ACTIVE') throw new BadRequestException('Job is already active');

    // Verify package exists and is active
    const pkg = await this.pricingContract.findById(packageId);
    if (!pkg) throw new NotFoundException('Pricing package not found');
    if (!pkg.isActive) throw new BadRequestException('Package is not active');

    const existingPayment = await this.prisma.payment.findFirst({
      where: { jobId, status: 'PENDING' },
    });
    if (existingPayment) throw new BadRequestException('Job already has a pending payment');

    const gateway = this.stripeGateway.isEnabled() ? 'stripe' : 'mock';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    let result: { url: string; sessionId: string };

    if (gateway === 'stripe') {
      result = await this.stripeGateway.createCheckout({
        amount: pkg.price,
        currency: 'vnd',
        productName: `Đăng tin tuyển dụng - Gói ${pkg.name}`,
        metadata: { userId, jobId, packageId },
        successUrl: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&jobId=${jobId}`,
        cancelUrl: `${frontendUrl}/payment/cancel`,
      });
    } else {
      result = await this.mockGateway.createCheckout({
        amount: pkg.price,
        currency: 'vnd',
        productName: `Đăng tin tuyển dụng - Gói ${pkg.name}`,
        metadata: { userId, jobId, packageId },
        successUrl: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&jobId=${jobId}`,
        cancelUrl: `${frontendUrl}/payment/cancel`,
      });
    }

    await this.prisma.payment.create({
      data: {
        userId,
        jobId,
        packageId,
        amount: pkg.price,
        status: 'PENDING',
        gateway,
        gatewayRef: result.sessionId,
      },
    });

    return { url: result.url, gateway };
  }

  async handleWebhook(payload: Buffer, headers: Record<string, string>) {
    const gateway = headers['x-payment-gateway'] || 'stripe';

    if (gateway === 'mock') {
      return this.handleMockWebhook(payload);
    }

    return this.handleStripeWebhook(payload, headers);
  }

  private async handleStripeWebhook(payload: Buffer, headers: Record<string, string>) {
    const signature = headers['stripe-signature'];
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !secret) {
      throw new BadRequestException('Missing Stripe signature or secret');
    }

    let event: { type: string; data: { object: { id: string; metadata: Record<string, string> } } };
    try {
      event = this.stripeGateway.constructEvent(payload, signature, secret);
    } catch (err) {
      throw new BadRequestException('Invalid Stripe signature');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      await this.paymentCompletion.completeBySession(session.id, false);
    }

    return { received: true };
  }

  private async handleMockWebhook(payload: Buffer) {
    const data = JSON.parse(payload.toString());
    const { sessionId, userId, jobId, packageId } = data;

    if (!sessionId) {
      return this.paymentCompletion.completeByJob(jobId);
    }

    await this.paymentCompletion.completeBySession(sessionId, false);
    return { received: true };
  }

  async mockCompletePayment(jobId?: string, sessionId?: string) {
    if (jobId) {
      return this.paymentCompletion.completeByJob(jobId);
    }
    if (sessionId) {
      return this.paymentCompletion.completeBySession(sessionId);
    }
    throw new BadRequestException('Missing jobId or sessionId');
  }

  async findByUser(userId: string, query: PaymentQueryDto) {
    const { page = 1, limit = 10 } = query;
    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: { userId },
        skip: (page - 1) * limit,
        take: limit,
        include: { package: true, job: { select: { id: true, title: true, status: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where: { userId } }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { package: true, job: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }
}
