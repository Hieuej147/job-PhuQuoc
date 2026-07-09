import { CandidateQuotaPlan, EmployerQuotaPlan } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export class QuotaExpiryService {
  constructor(private readonly prisma: PrismaService) {}

  async expireQuotaPlan(userId: string, targetPlan: string, expectedExpiresAt?: string) {
    const plan = await this.prisma.userQuotaPlan.findUnique({ where: { userId } });
    if (!plan) return { expired: false };

    const now = new Date();
    const isCandidatePlan = targetPlan.startsWith('CANDIDATE_');
    const currentPlan = isCandidatePlan ? plan.candidatePlan : plan.employerPlan;
    const currentExpiresAt = isCandidatePlan ? plan.candidatePlanExpiresAt : plan.employerPlanExpiresAt;

    if (currentPlan !== targetPlan) return { expired: false };
    if (!currentExpiresAt || currentExpiresAt.getTime() > now.getTime()) return { expired: false };
    if (expectedExpiresAt && currentExpiresAt.toISOString() !== new Date(expectedExpiresAt).toISOString()) {
      return { expired: false };
    }

    const data = isCandidatePlan
      ? { candidatePlan: CandidateQuotaPlan.CANDIDATE_FREE, candidatePlanExpiresAt: null }
      : { employerPlan: EmployerQuotaPlan.EMPLOYER_BASIC, employerPlanExpiresAt: null };

    await this.prisma.userQuotaPlan.update({ where: { userId }, data });
    return { expired: true };
  }

  async repairExpiredPlans() {
    const now = new Date();
    const [expiredCandidates, expiredEmployers] = await Promise.all([
      this.prisma.userQuotaPlan.updateMany({
        where: {
          candidatePlan: CandidateQuotaPlan.CANDIDATE_PLUS,
          candidatePlanExpiresAt: { lte: now },
        },
        data: { candidatePlan: CandidateQuotaPlan.CANDIDATE_FREE, candidatePlanExpiresAt: null },
      }),
      this.prisma.userQuotaPlan.updateMany({
        where: {
          employerPlan: EmployerQuotaPlan.EMPLOYER_PRO,
          employerPlanExpiresAt: { lte: now },
        },
        data: { employerPlan: EmployerQuotaPlan.EMPLOYER_BASIC, employerPlanExpiresAt: null },
      }),
    ]);
    return { expired: expiredCandidates.count + expiredEmployers.count };
  }
}

