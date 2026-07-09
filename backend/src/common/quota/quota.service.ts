import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CandidateQuotaPlan, EmployerQuotaPlan, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InngestService } from '../../inngest/inngest.service';
import { QUOTA_PLANS, STORAGE_QUOTA } from './quota.constants';
import { addMonths, assertWithinQuota, getQuotaLimit, isCandidateQuotaResource, resolvePlanForResource, resolveUserPlansRuntime } from './quota-policy';
import type { QuotaUpgradePlan, StorageQuotaResource } from './quota.types';

@Injectable()
export class QuotaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inngestService: InngestService,
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
    const existing = await this.prisma.userQuotaPlan.findUnique({ where: { userId } });
    return resolveUserPlansRuntime(existing);
  }

  async getUserLimit(userId: string, resource: StorageQuotaResource) {
    const plans = await this.getUserPlans(userId);
    return getQuotaLimit(resource, plans);
  }

  async getUserQuotaSnapshot(userId: string, usage: Partial<Record<StorageQuotaResource, number>> = {}) {
    const plans = await this.getUserPlans(userId);
    const limits = Object.keys(STORAGE_QUOTA).reduce((acc, key) => {
      const resource = key as StorageQuotaResource;
      const plan = resolvePlanForResource(resource, plans);
      acc[resource] = {
        used: usage[resource] ?? 0,
        limit: QUOTA_PLANS[plan]?.[resource] ?? STORAGE_QUOTA[resource],
      };
      return acc;
    }, {} as Record<StorageQuotaResource, { used: number; limit: number }>);

    const packages = await this.prisma.quotaPackage.findMany({
      where: { isActive: true },
      orderBy: [{ targetPlan: 'asc' }, { durationMonths: 'asc' }],
    });

    return { plans, limits, availablePlans: QUOTA_PLANS, packages };
  }

  async upgradeUserPlan(userId: string, plan: QuotaUpgradePlan) {
    const data = plan.startsWith('CANDIDATE_')
      ? { candidatePlan: plan as CandidateQuotaPlan }
      : { employerPlan: plan as EmployerQuotaPlan };

    return this.prisma.userQuotaPlan.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }

  async getPackages() {
    return this.prisma.quotaPackage.findMany({
      where: { isActive: true },
      orderBy: [{ targetPlan: 'asc' }, { durationMonths: 'asc' }],
    });
  }

  async createCheckout(userId: string, packageId: string) {
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
    const expiresAt = addMonths(startsAt, purchase.durationMonths);

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

    await this.inngestService.send({
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

  async assertWithinForUser(userId: string, resource: StorageQuotaResource, used: number) {
    const limit = await this.getUserLimit(userId, resource);
    if (used >= limit) {
      throw new ForbiddenException({
        code: 'QUOTA_EXCEEDED',
        message: 'Đã vượt giới hạn gói hiện tại.',
        resource,
        limit,
        used,
        currentPlan: (await this.getUserPlans(userId))[isCandidateQuotaResource(resource) ? 'candidatePlan' : 'employerPlan'],
        upgradePlan: isCandidateQuotaResource(resource) ? CandidateQuotaPlan.CANDIDATE_PLUS : EmployerQuotaPlan.EMPLOYER_PRO,
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
        currentPlan: (await this.getUserPlans(userId))[isCandidateQuotaResource(resource) ? 'candidatePlan' : 'employerPlan'],
        upgradePlan: isCandidateQuotaResource(resource) ? CandidateQuotaPlan.CANDIDATE_PLUS : EmployerQuotaPlan.EMPLOYER_PRO,
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
}
