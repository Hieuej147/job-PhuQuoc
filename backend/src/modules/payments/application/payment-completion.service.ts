import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { InngestService } from '../../../inngest/inngest.service';
import { PinoLoggerService } from '../../../common/logger/pino-logger.service';
import { AuditWriteContractService } from '../../shared/contracts/audit.contract';
import { JobContractService } from '../../shared/contracts/job.contract';

type PendingPayment = Prisma.PaymentGetPayload<{ include: { package: true } }>;

@Injectable()
export class PaymentCompletionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inngest: InngestService,
    private readonly logger: PinoLoggerService,
    private readonly auditWriteContract: AuditWriteContractService,
    private readonly jobContract: JobContractService,
  ) {}

  async completeBySession(sessionId: string, strict = true) {
    const payment = await this.prisma.payment.findFirst({
      where: { gatewayRef: sessionId, status: 'PENDING' },
      include: { package: true },
    });

    if (!payment) {
      if (strict) throw new NotFoundException('No pending payment found for this session');
      this.logger.warn(
        `Payment not found or already completed for session ${sessionId}`,
        PaymentCompletionService.name,
      );
      return;
    }

    return this.completePendingPayment(payment, `session ${sessionId}`);
  }

  async completeByJob(jobId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { jobId, status: 'PENDING' },
      include: { package: true },
    });

    if (!payment) throw new NotFoundException('No pending payment found for this job');
    return this.completePendingPayment(payment, `job ${jobId}`);
  }

  private async completePendingPayment(payment: PendingPayment, source: string) {
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    const durationDays = payment.durationDays ?? payment.package.days;
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + durationDays);

    await this.jobContract.activateJob(payment.jobId, {
      deadline,
      durationDays,
      boostLevel: payment.boostLevel,
      featuredUntil: payment.boostLevel > 0 ? deadline : null,
      paymentId: payment.id,
      activationId: payment.activationId,
    });

    await this.inngest.send({
      name: 'job.activated',
      data: {
        jobId: payment.jobId,
        deadline: deadline.toISOString(),
        activationId: payment.activationId ?? undefined,
      },
    });

    await this.auditWriteContract.log({
      action: 'job.activated',
      entityType: 'Job',
      entityId: payment.jobId,
      actorId: payment.userId,
      newValue: 'ACTIVE',
      metadata: { packageId: payment.packageId, days: durationDays, boostLevel: payment.boostLevel },
    });

    this.logger.log(
      `Payment completed via ${source}, job: ${payment.jobId}, deadline: ${deadline.toISOString()}`,
      PaymentCompletionService.name,
    );

    return { message: 'Payment completed', deadline };
  }
}
