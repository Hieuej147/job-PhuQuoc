import { BadRequestException, ForbiddenException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CandidateQuotaPlan, EmployerQuotaPlan, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InngestService } from '../../inngest/inngest.service';

export const STORAGE_QUOTA = {
  candidateApplications: 100,
  candidateResumes: 20,
  savedJobs: 100,
  savedCompanies: 50,
  employerJobs: 50,
  employerActiveJobs: 10,
  employerDurationDaysMax: 60,
  employerBoostLevelMax: 3,
} as const;

export type StorageQuotaResource = keyof typeof STORAGE_QUOTA;
export type QuotaPlan = 'CANDIDATE_FREE' | 'CANDIDATE_PLUS' | 'EMPLOYER_BASIC' | 'EMPLOYER_PRO';
export type QuotaUpgradePlan = CandidateQuotaPlan | EmployerQuotaPlan;

export const QUOTA_PLANS: Record<QuotaPlan, Partial<Record<StorageQuotaResource, number>>> = {
  CANDIDATE_FREE: {
    candidateApplications: 100,
    candidateResumes: 20,
    savedJobs: 100,
    savedCompanies: 50,
  },
  CANDIDATE_PLUS: {
    candidateApplications: 300,
    candidateResumes: 60,
    savedJobs: 300,
    savedCompanies: 150,
  },
  EMPLOYER_BASIC: {
    employerJobs: 50,
    employerActiveJobs: 10,
    employerDurationDaysMax: 60,
    employerBoostLevelMax: 3,
  },
  EMPLOYER_PRO: {
    employerJobs: 200,
    employerActiveJobs: 50,
    employerDurationDaysMax: 120,
    employerBoostLevelMax: 3,
  },
};

export function assertWithinQuota(resource: StorageQuotaResource, used: number) {
  const limit = STORAGE_QUOTA[resource];
  if (used >= limit) {
    throw new ForbiddenException({
      code: 'QUOTA_EXCEEDED',
      message: 'Đã vượt giới hạn gói hiện tại.',
      resource,
      limit,
      used,
    });
  }
}

@Injectable()
export class QuotaService {
  constructor(
    @Optional() private readonly prisma?: PrismaService,
    @Optional() private readonly inngestService?: InngestService,
  ) {}

  getLimit(resource: StorageQuotaResource) {
    return STORAGE_QUOTA[resource];
  }

  getDemoPlans() {
    return QUOTA_PLANS;
  }

  assertWithin(resource: StorageQuotaResource, used: number) {
    assertWithinQuota(resource, used);
  }

  async getUserPlans(userId: string) {
    const existing = this.prisma
      ? await this.prisma.userQuotaPlan.findUnique({ where: { userId } })
      : null;

    const now = Date.now();
    const candidatePlan =
      existing?.candidatePlan === CandidateQuotaPlan.CANDIDATE_PLUS &&
      existing.candidatePlanExpiresAt &&
      existing.candidatePlanExpiresAt.getTime() <= now
        ? CandidateQuotaPlan.CANDIDATE_FREE
        : existing?.candidatePlan ?? CandidateQuotaPlan.CANDIDATE_FREE;

    const employerPlan =
      existing?.employerPlan === EmployerQuotaPlan.EMPLOYER_PRO &&
      existing.employerPlanExpiresAt &&
      existing.employerPlanExpiresAt.getTime() <= now
        ? EmployerQuotaPlan.EMPLOYER_BASIC
        : existing?.employerPlan ?? EmployerQuotaPlan.EMPLOYER_BASIC;

    return {
      candidatePlan,
      employerPlan,
      candidatePlanExpiresAt: existing?.candidatePlanExpiresAt ?? null,
      employerPlanExpiresAt: existing?.employerPlanExpiresAt ?? null,
    };
  }

  async getUserLimit(userId: string, resource: StorageQuotaResource) {
    const plans = await this.getUserPlans(userId);
    const plan = this.resolvePlanForResource(resource, plans);
    return QUOTA_PLANS[plan]?.[resource] ?? STORAGE_QUOTA[resource];
  }

  async getUserQuotaSnapshot(userId: string, usage: Partial<Record<StorageQuotaResource, number>> = {}) {
    const plans = await this.getUserPlans(userId);
    const limits = Object.keys(STORAGE_QUOTA).reduce((acc, key) => {
      const resource = key as StorageQuotaResource;
      const plan = this.resolvePlanForResource(resource, plans);
      acc[resource] = {
        used: usage[resource] ?? 0,
        limit: QUOTA_PLANS[plan]?.[resource] ?? STORAGE_QUOTA[resource],
      };
      return acc;
    }, {} as Record<StorageQuotaResource, { used: number; limit: number }>);

    const packages = this.prisma
      ? await this.prisma.quotaPackage.findMany({
          where: { isActive: true },
          orderBy: [{ targetPlan: 'asc' }, { durationMonths: 'asc' }],
        })
      : [];

    return { plans, limits, availablePlans: QUOTA_PLANS, packages };
  }

  async upgradeUserPlan(userId: string, plan: QuotaUpgradePlan) {
    const data = plan.startsWith('CANDIDATE_')
      ? { candidatePlan: plan as CandidateQuotaPlan }
      : { employerPlan: plan as EmployerQuotaPlan };

    if (!this.prisma) {
      return { userId, ...data };
    }

    return this.prisma.userQuotaPlan.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }

  async getPackages() {
    if (!this.prisma) return [];
    return this.prisma.quotaPackage.findMany({
      where: { isActive: true },
      orderBy: [{ targetPlan: 'asc' }, { durationMonths: 'asc' }],
    });
  }

  async createCheckout(userId: string, packageId: string) {
    if (!this.prisma) throw new BadRequestException('Quota checkout is unavailable');
    const pkg = await this.prisma.quotaPackage.findUnique({ where: { id: packageId } });
    if (!pkg || !pkg.isActive) throw new NotFoundException('Quota package not found');

    const sessionId = `quota_mock_${randomUUID()}`;
    const purchase = await this.prisma.quotaPurchase.create({
      data: {
        userId,
        packageId: pkg.id,
        targetPlan: pkg.targetPlan,
        amount: pkg.price,
        durationMonths: pkg.durationMonths,
        status: PaymentStatus.PENDING,
        gateway: 'mock',
        gatewayRef: sessionId,
      },
      include: { package: true },
    });

    return {
      gateway: 'mock',
      sessionId,
      url: `/quota/mock-success?session_id=${encodeURIComponent(sessionId)}`,
      purchase,
    };
  }

  async mockComplete(sessionId: string, userId?: string) {
    if (!this.prisma) throw new BadRequestException('Quota checkout is unavailable');
    const purchase = await this.prisma.quotaPurchase.findUnique({
      where: { gatewayRef: sessionId },
      include: { package: true },
    });
    if (!purchase) throw new NotFoundException('Quota purchase not found');
    if (userId && purchase.userId !== userId) {
      throw new ForbiddenException('Quota purchase does not belong to current user');
    }

    if (purchase.status === PaymentStatus.COMPLETED) {
      return { message: 'Quota purchase already completed', purchase };
    }

    const now = new Date();
    const plans = await this.prisma.userQuotaPlan.findUnique({ where: { userId: purchase.userId } });
    const isCandidatePlan = purchase.targetPlan.startsWith('CANDIDATE_');
    const currentPlan = isCandidatePlan ? plans?.candidatePlan : plans?.employerPlan;
    const currentExpiry = isCandidatePlan ? plans?.candidatePlanExpiresAt : plans?.employerPlanExpiresAt;
    const startsAt = currentPlan === purchase.targetPlan && currentExpiry && currentExpiry.getTime() > now.getTime()
      ? currentExpiry
      : now;
    const expiresAt = this.addMonths(startsAt, purchase.durationMonths);

    const planData = isCandidatePlan
      ? {
          candidatePlan: purchase.targetPlan as CandidateQuotaPlan,
          candidatePlanExpiresAt: expiresAt,
        }
      : {
          employerPlan: purchase.targetPlan as EmployerQuotaPlan,
          employerPlanExpiresAt: expiresAt,
        };

    const [completed, quotaPlan] = await this.prisma.$transaction([
      this.prisma.quotaPurchase.update({
        where: { id: purchase.id },
        data: { status: PaymentStatus.COMPLETED, startsAt, expiresAt, completedAt: now },
        include: { package: true },
      }),
      this.prisma.userQuotaPlan.upsert({
        where: { userId: purchase.userId },
        update: planData,
        create: { userId: purchase.userId, ...planData },
      }),
    ]);

    await this.inngestService?.send({
      name: 'quota.plan.activated',
      data: {
        userId: purchase.userId,
        targetPlan: purchase.targetPlan,
        expiresAt: expiresAt.toISOString(),
        purchaseId: purchase.id,
      },
    });

    return { message: 'Quota purchase completed in demo mode', purchase: completed, quotaPlan };
  }

  async expireQuotaPlan(userId: string, targetPlan: string, expectedExpiresAt?: string) {
    if (!this.prisma) return { expired: false };
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
    if (!this.prisma) return { expired: 0 };
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

  async assertWithinForUser(userId: string, resource: StorageQuotaResource, used: number) {
    const limit = await this.getUserLimit(userId, resource);
    if (used >= limit) {
      throw new ForbiddenException({
        code: 'QUOTA_EXCEEDED',
        message: 'Đã vượt giới hạn gói hiện tại.',
        resource,
        limit,
        used,
        currentPlan: (await this.getUserPlans(userId))[this.isCandidateResource(resource) ? 'candidatePlan' : 'employerPlan'],
        upgradePlan: this.isCandidateResource(resource) ? CandidateQuotaPlan.CANDIDATE_PLUS : EmployerQuotaPlan.EMPLOYER_PRO,
      });
    }
  }

  async assertMaxForUser(userId: string, resource: StorageQuotaResource, value: number) {
    const limit = await this.getUserLimit(userId, resource);
    if (value > limit) {
      throw new ForbiddenException({
        code: 'QUOTA_EXCEEDED',
        message: 'Giá trị vượt giới hạn gói hiện tại.',
        resource,
        limit,
        used: value,
        currentPlan: (await this.getUserPlans(userId))[this.isCandidateResource(resource) ? 'candidatePlan' : 'employerPlan'],
        upgradePlan: this.isCandidateResource(resource) ? CandidateQuotaPlan.CANDIDATE_PLUS : EmployerQuotaPlan.EMPLOYER_PRO,
      });
    }
  }

  assertMax(resource: StorageQuotaResource, value: number) {
    const limit = this.getLimit(resource);
    if (value > limit) {
      throw new ForbiddenException({
        code: 'QUOTA_EXCEEDED',
        message: 'Giá trị vượt giới hạn hệ thống.',
        resource,
        limit,
        used: value,
      });
    }
  }

  private resolvePlanForResource(
    resource: StorageQuotaResource,
    plans: { candidatePlan: CandidateQuotaPlan; employerPlan: EmployerQuotaPlan },
  ): QuotaPlan {
    return this.isCandidateResource(resource) ? plans.candidatePlan : plans.employerPlan;
  }

  private isCandidateResource(resource: StorageQuotaResource) {
    return ['candidateApplications', 'candidateResumes', 'savedJobs', 'savedCompanies'].includes(resource);
  }

  private addMonths(date: Date, months: number) {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
  }
}
