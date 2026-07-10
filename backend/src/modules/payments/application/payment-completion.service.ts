import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import { InngestService } from "../../../inngest/inngest.service";
import { PinoLoggerService } from "../../../common/logger/pino-logger.service";
import { AuditWriteContractService } from "../../shared/contracts/audit.contract";
import { JobBackgroundService } from "../../jobs/background/job-background.service";

type PaymentWithPackageAndJob = Prisma.PaymentGetPayload<{
  include: { package: true; job: true };
}>;

@Injectable()
export class PaymentCompletionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inngest: InngestService,
    private readonly logger: PinoLoggerService,
    private readonly auditWriteContract: AuditWriteContractService,
    private readonly jobBackground: JobBackgroundService,
  ) {}

  async completeBySession(sessionId: string, strict = true) {
    const payment = await this.prisma.payment.findFirst({
      where: { gatewayRef: sessionId },
      include: { package: true, job: true },
    });

    if (!payment) {
      if (strict)
        throw new NotFoundException(
          "No pending payment found for this session",
        );
      this.logger.warn(
        `Payment not found or already completed for session ${sessionId}`,
        PaymentCompletionService.name,
      );
      return;
    }

    return this.completePayment(payment, `session ${sessionId}`, strict);
  }

  async completeByJob(jobId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { jobId, status: { in: ["PENDING", "COMPLETED"] } },
      orderBy: { createdAt: "desc" },
      include: { package: true, job: true },
    });

    if (!payment)
      throw new NotFoundException("No pending payment found for this job");
    return this.completePayment(payment, `job ${jobId}`);
  }

  private async completePayment(
    payment: PaymentWithPackageAndJob,
    source: string,
    strict = true,
  ) {
    if (payment.status === "COMPLETED") {
      if (
        payment.job.status === "ACTIVE" &&
        payment.job.currentPaymentId === payment.id
      ) {
        return {
          message: "Payment already completed",
          deadline: payment.job.deadline,
        };
      }
      if (strict)
        throw new BadRequestException(
          "Payment already completed but job is not active",
        );
      this.logger.warn(
        `Payment ${payment.id} already completed but job ${payment.jobId} is not active`,
        PaymentCompletionService.name,
      );
      return;
    }

    const durationDays = payment.durationDays ?? payment.package.days;
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + durationDays);
    // deadline.setSeconds(deadline.getSeconds() + 5); // thí is test

    const activatedJob = await this.prisma.$transaction(async (tx) => {
      const currentPayment = await tx.payment.findUnique({
        where: { id: payment.id },
        include: { job: true },
      });
      if (!currentPayment) throw new NotFoundException("Payment not found");

      if (currentPayment.status === "COMPLETED") {
        if (
          currentPayment.job.status === "ACTIVE" &&
          currentPayment.job.currentPaymentId === currentPayment.id
        ) {
          return currentPayment.job;
        }
        throw new BadRequestException(
          "Payment already completed but job is not active",
        );
      }
      if (currentPayment.status !== "PENDING") {
        throw new BadRequestException(
          `Cannot complete payment with status ${currentPayment.status}`,
        );
      }
      if (currentPayment.job.archivedAt) {
        throw new BadRequestException(
          "Archived jobs must be restored before payment completion",
        );
      }
      if (currentPayment.job.status === "ACTIVE") {
        throw new BadRequestException("Job is already active");
      }

      await tx.payment.update({
        where: { id: currentPayment.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });

      return tx.job.update({
        where: { id: currentPayment.jobId },
        data: {
          status: "ACTIVE",
          deadline,
          publishedAt: new Date(),
          closedAt: null,
          closeReason: null,
          durationDays,
          boostLevel: currentPayment.boostLevel,
          featuredUntil: currentPayment.boostLevel > 0 ? deadline : null,
          currentPaymentId: currentPayment.id,
          activationId: currentPayment.activationId,
        },
      });
    });

    this.jobBackground.syncEmbedding(activatedJob);

    await this.inngest.send({
      name: "job.activated",
      data: {
        jobId: payment.jobId,
        deadline: deadline.toISOString(),
        activationId: payment.activationId ?? undefined,
      },
    });

    try {
      await this.auditWriteContract.log({
        action: "job.activated",
        entityType: "Job",
        entityId: payment.jobId,
        actorId: payment.userId,
        newValue: "ACTIVE",
        metadata: {
          packageId: payment.packageId,
          days: durationDays,
          boostLevel: payment.boostLevel,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to write audit log for payment ${payment.id}: ${(error as Error).message}`,
        PaymentCompletionService.name,
      );
    }

    this.logger.log(
      `Payment completed via ${source}, job: ${payment.jobId}, deadline: ${deadline.toISOString()}`,
      PaymentCompletionService.name,
    );

    return { message: "Payment completed", deadline };
  }
}
