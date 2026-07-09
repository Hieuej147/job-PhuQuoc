import { ForbiddenException } from '@nestjs/common';
import { CandidateQuotaPlan, EmployerQuotaPlan } from '@prisma/client';
import { QUOTA_PLANS, STORAGE_QUOTA } from './quota.constants';
import type { QuotaPlan, StorageQuotaResource } from './quota.types';

export type UserQuotaPlansRuntime = {
  candidatePlan: CandidateQuotaPlan;
  employerPlan: EmployerQuotaPlan;
  candidatePlanExpiresAt: Date | null;
  employerPlanExpiresAt: Date | null;
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

export function isCandidateQuotaResource(resource: StorageQuotaResource) {
  return ['candidateApplications', 'candidateResumes', 'savedJobs', 'savedCompanies'].includes(resource);
}

export function resolvePlanForResource(
  resource: StorageQuotaResource,
  plans: { candidatePlan: CandidateQuotaPlan; employerPlan: EmployerQuotaPlan },
): QuotaPlan {
  return isCandidateQuotaResource(resource) ? plans.candidatePlan : plans.employerPlan;
}

export function resolveUserPlansRuntime(
  existing?: {
    candidatePlan?: CandidateQuotaPlan | null;
    employerPlan?: EmployerQuotaPlan | null;
    candidatePlanExpiresAt?: Date | null;
    employerPlanExpiresAt?: Date | null;
  } | null,
): UserQuotaPlansRuntime {
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

export function getQuotaLimit(resource: StorageQuotaResource, plans: { candidatePlan: CandidateQuotaPlan; employerPlan: EmployerQuotaPlan }) {
  const plan = resolvePlanForResource(resource, plans);
  return QUOTA_PLANS[plan]?.[resource] ?? STORAGE_QUOTA[resource];
}

export function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

