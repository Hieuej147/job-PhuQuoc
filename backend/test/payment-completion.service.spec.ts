import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PaymentCompletionService } from '../src/modules/payments/application/payment-completion.service';

describe('PaymentCompletionService', () => {
  let service: PaymentCompletionService;
  let prismaMock: any;
  let inngestMock: any;
  let loggerMock: any;
  let auditMock: any;
  let jobBackgroundMock: any;
  let txMock: any;

  const pendingPayment = {
    id: 'payment1',
    userId: 'user1',
    jobId: 'job1',
    packageId: 'pkg1',
    amount: 300000,
    durationDays: 7,
    boostLevel: 2,
    activationId: 'activation1',
    status: 'PENDING',
    package: { id: 'pkg1', days: 30 },
    job: { id: 'job1', status: 'DRAFT', archivedAt: null, currentPaymentId: null },
  };

  beforeEach(() => {
    txMock = {
      payment: {
        findUnique: vi.fn(),
        update: vi.fn().mockResolvedValue(undefined),
      },
      job: {
        update: vi.fn(),
      },
    };
    prismaMock = {
      payment: {
        findFirst: vi.fn(),
      },
      $transaction: vi.fn((callback: (tx: any) => Promise<unknown>) => callback(txMock)),
    };
    inngestMock = {
      send: vi.fn().mockResolvedValue(undefined),
    };
    loggerMock = {
      log: vi.fn(),
      warn: vi.fn(),
    };
    auditMock = {
      log: vi.fn().mockResolvedValue(undefined),
    };
    jobBackgroundMock = {
      syncEmbedding: vi.fn(),
    };
    service = new PaymentCompletionService(
      prismaMock,
      inngestMock,
      loggerMock,
      auditMock,
      jobBackgroundMock,
    );
  });

  it('completes pending payment, activates job, sends event, audits, then syncs embedding', async () => {
    const activatedJob = {
      id: 'job1',
      title: 'Paid job',
      description: 'Markdown',
      status: 'ACTIVE',
      archivedAt: null,
    };
    prismaMock.payment.findFirst.mockResolvedValue(pendingPayment);
    txMock.payment.findUnique.mockResolvedValue(pendingPayment);
    txMock.job.update.mockResolvedValue(activatedJob);

    const result = await service.completeByJob('job1');

    expect(result?.message).toBe('Payment completed');
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(txMock.payment.update).toHaveBeenCalledWith({
      where: { id: 'payment1' },
      data: { status: 'COMPLETED', completedAt: expect.any(Date) },
    });
    expect(txMock.job.update).toHaveBeenCalledWith({
      where: { id: 'job1' },
      data: expect.objectContaining({
        status: 'ACTIVE',
        durationDays: 7,
        boostLevel: 2,
        featuredUntil: expect.any(Date),
        currentPaymentId: 'payment1',
        activationId: 'activation1',
      }),
    });
    expect(inngestMock.send).toHaveBeenCalledWith({
      name: 'job.activated',
      data: expect.objectContaining({ jobId: 'job1', activationId: 'activation1' }),
    });
    expect(auditMock.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'job.activated',
        entityId: 'job1',
        actorId: 'user1',
      }),
    );
    expect(jobBackgroundMock.syncEmbedding).toHaveBeenCalledWith(activatedJob);
  });

  it('is idempotent when payment is already completed and job is active for that payment', async () => {
    const completedPayment = {
      ...pendingPayment,
      status: 'COMPLETED',
      job: {
        ...pendingPayment.job,
        status: 'ACTIVE',
        currentPaymentId: 'payment1',
        deadline: new Date('2026-08-01T00:00:00.000Z'),
      },
    };
    prismaMock.payment.findFirst.mockResolvedValue(completedPayment);

    const result = await service.completeByJob('job1');

    expect(result).toEqual({
      message: 'Payment already completed',
      deadline: completedPayment.job.deadline,
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(inngestMock.send).not.toHaveBeenCalled();
    expect(jobBackgroundMock.syncEmbedding).not.toHaveBeenCalled();
  });

  it('blocks archived jobs before activation side effects', async () => {
    const archivedPayment = {
      ...pendingPayment,
      job: { ...pendingPayment.job, archivedAt: new Date() },
    };
    prismaMock.payment.findFirst.mockResolvedValue(archivedPayment);
    txMock.payment.findUnique.mockResolvedValue(archivedPayment);

    await expect(service.completeByJob('job1')).rejects.toBeInstanceOf(BadRequestException);

    expect(txMock.payment.update).not.toHaveBeenCalled();
    expect(txMock.job.update).not.toHaveBeenCalled();
    expect(inngestMock.send).not.toHaveBeenCalled();
    expect(jobBackgroundMock.syncEmbedding).not.toHaveBeenCalled();
  });

  it('does not fail completion when audit logging fails', async () => {
    const activatedJob = {
      id: 'job1',
      title: 'Paid job',
      description: 'Markdown',
      status: 'ACTIVE',
      archivedAt: null,
    };
    prismaMock.payment.findFirst.mockResolvedValue(pendingPayment);
    txMock.payment.findUnique.mockResolvedValue(pendingPayment);
    txMock.job.update.mockResolvedValue(activatedJob);
    auditMock.log.mockRejectedValue(new Error('audit down'));

    await expect(service.completeByJob('job1')).resolves.toEqual({
      message: 'Payment completed',
      deadline: expect.any(Date),
    });
    expect(loggerMock.warn).toHaveBeenCalledWith(
      expect.stringContaining('Failed to write audit log'),
      PaymentCompletionService.name,
    );
    expect(jobBackgroundMock.syncEmbedding).toHaveBeenCalledWith(activatedJob);
  });

  it('syncs embedding after DB activation even when Inngest send fails', async () => {
    const activatedJob = {
      id: 'job1',
      title: 'Paid job',
      description: 'Markdown',
      status: 'ACTIVE',
      archivedAt: null,
    };
    prismaMock.payment.findFirst.mockResolvedValue(pendingPayment);
    txMock.payment.findUnique.mockResolvedValue(pendingPayment);
    txMock.job.update.mockResolvedValue(activatedJob);
    inngestMock.send.mockRejectedValue(new Error('inngest down'));

    await expect(service.completeByJob('job1')).rejects.toThrow('inngest down');

    expect(txMock.job.update).toHaveBeenCalled();
    expect(jobBackgroundMock.syncEmbedding).toHaveBeenCalledWith(activatedJob);
    expect(auditMock.log).not.toHaveBeenCalled();
  });
});
