import { CandidateQuotaPlan, EmployerQuotaPlan } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { QuotaExpiryService } from '../src/common/quota/quota-expiry.service';

describe('QuotaExpiryService', () => {
  it('should downgrade expired candidate plus plan', async () => {
    const prisma = {
      userQuotaPlan: {
        findUnique: vi.fn().mockResolvedValue({
          userId: 'user1',
          candidatePlan: CandidateQuotaPlan.CANDIDATE_PLUS,
          candidatePlanExpiresAt: new Date('2026-01-01T00:00:00.000Z'),
          employerPlan: EmployerQuotaPlan.EMPLOYER_BASIC,
          employerPlanExpiresAt: null,
        }),
        update: vi.fn().mockResolvedValue({}),
      },
    };
    const service = new QuotaExpiryService(prisma as any);

    const result = await service.expireQuotaPlan('user1', CandidateQuotaPlan.CANDIDATE_PLUS);

    expect(result).toEqual({ expired: true });
    expect(prisma.userQuotaPlan.update).toHaveBeenCalledWith({
      where: { userId: 'user1' },
      data: { candidatePlan: CandidateQuotaPlan.CANDIDATE_FREE, candidatePlanExpiresAt: null },
    });
  });

  it('should downgrade expired employer pro plan', async () => {
    const prisma = {
      userQuotaPlan: {
        findUnique: vi.fn().mockResolvedValue({
          userId: 'user1',
          candidatePlan: CandidateQuotaPlan.CANDIDATE_FREE,
          candidatePlanExpiresAt: null,
          employerPlan: EmployerQuotaPlan.EMPLOYER_PRO,
          employerPlanExpiresAt: new Date('2026-01-01T00:00:00.000Z'),
        }),
        update: vi.fn().mockResolvedValue({}),
      },
    };
    const service = new QuotaExpiryService(prisma as any);

    const result = await service.expireQuotaPlan('user1', EmployerQuotaPlan.EMPLOYER_PRO);

    expect(result).toEqual({ expired: true });
    expect(prisma.userQuotaPlan.update).toHaveBeenCalledWith({
      where: { userId: 'user1' },
      data: { employerPlan: EmployerQuotaPlan.EMPLOYER_BASIC, employerPlanExpiresAt: null },
    });
  });

  it('should not downgrade when user already renewed to a newer expiry', async () => {
    const prisma = {
      userQuotaPlan: {
        findUnique: vi.fn().mockResolvedValue({
          userId: 'user1',
          candidatePlan: CandidateQuotaPlan.CANDIDATE_PLUS,
          candidatePlanExpiresAt: new Date('2026-02-01T00:00:00.000Z'),
          employerPlan: EmployerQuotaPlan.EMPLOYER_BASIC,
          employerPlanExpiresAt: null,
        }),
        update: vi.fn(),
      },
    };
    const service = new QuotaExpiryService(prisma as any);

    const result = await service.expireQuotaPlan(
      'user1',
      CandidateQuotaPlan.CANDIDATE_PLUS,
      '2026-01-01T00:00:00.000Z',
    );

    expect(result).toEqual({ expired: false });
    expect(prisma.userQuotaPlan.update).not.toHaveBeenCalled();
  });

  it('should repair all expired plans', async () => {
    const prisma = {
      userQuotaPlan: {
        updateMany: vi.fn()
          .mockResolvedValueOnce({ count: 2 })
          .mockResolvedValueOnce({ count: 3 }),
      },
    };
    const service = new QuotaExpiryService(prisma as any);

    const result = await service.repairExpiredPlans();

    expect(result).toEqual({ expired: 5 });
    expect(prisma.userQuotaPlan.updateMany).toHaveBeenCalledTimes(2);
  });
});

