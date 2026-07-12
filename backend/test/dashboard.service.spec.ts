import { describe, expect, it, vi } from 'vitest';
import { DashboardService } from '../src/modules/dashboard/dashboard.service';

const createQuotaServiceMock = () => ({
  getUserQuotaSnapshot: vi.fn().mockImplementation(async (_userId: string, usage = {}) => ({
    plans: {
      candidatePlan: 'CANDIDATE_FREE',
      employerPlan: 'EMPLOYER_BASIC',
      candidatePlanExpiresAt: null,
      employerPlanExpiresAt: null,
    },
    limits: {
      candidateApplications: { used: usage.candidateApplications ?? 0, limit: 100 },
      candidateResumes: { used: usage.candidateResumes ?? 0, limit: 20 },
      savedJobs: { used: usage.savedJobs ?? 0, limit: 100 },
      savedCompanies: { used: usage.savedCompanies ?? 0, limit: 50 },
      employerJobs: { used: usage.employerJobs ?? 0, limit: 50 },
      employerActiveJobs: { used: usage.employerActiveJobs ?? 0, limit: 10 },
      employerDurationDaysMax: { used: usage.employerDurationDaysMax ?? 0, limit: 60 },
      employerBoostLevelMax: { used: usage.employerBoostLevelMax ?? 0, limit: 3 },
    },
    availablePlans: {},
    packages: [],
  })),
});

describe('DashboardService quota summary', () => {
  it('should include candidate quota usage', async () => {
    const prisma = {
      jobApplication: { count: vi.fn().mockResolvedValue(7), findMany: vi.fn().mockResolvedValue([]) },
      savedJob: { count: vi.fn().mockResolvedValue(3), findMany: vi.fn().mockResolvedValue([]) },
      savedCompany: { count: vi.fn().mockResolvedValue(2) },
      candidateResume: { count: vi.fn().mockResolvedValue(4), findMany: vi.fn().mockResolvedValue([]) },
      notification: { count: vi.fn().mockResolvedValue(1), findMany: vi.fn().mockResolvedValue([]) },
    };
    const service = new DashboardService(prisma as any, createQuotaServiceMock() as any);

    const result = await service.getCandidateSummary('candidate1');

    expect(result.quota).toEqual({
      plan: 'CANDIDATE_FREE',
      expiresAt: null,
      applications: { used: 7, limit: 100 },
      resumes: { used: 4, limit: 20 },
      savedJobs: { used: 3, limit: 100 },
      savedCompanies: { used: 2, limit: 50 },
    });
  });

  it('should include employer quota usage', async () => {
    const prisma = {
      company: { findFirst: vi.fn().mockResolvedValue({ id: 'company1' }) },
      job: {
        count: vi.fn()
          .mockResolvedValueOnce(12) // visible workspace jobs
          .mockResolvedValueOnce(14) // usage quota, includes consumed archived jobs
          .mockResolvedValueOnce(5)
          .mockResolvedValueOnce(2)
          .mockResolvedValueOnce(3)
          .mockResolvedValueOnce(4),
        findMany: vi.fn().mockResolvedValue([]),
      },
      jobApplication: { count: vi.fn().mockResolvedValue(9), findMany: vi.fn().mockResolvedValue([]) },
      notification: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
    };
    const service = new DashboardService(prisma as any, createQuotaServiceMock() as any);

    const result = await service.getEmployerSummary('employer1');

    expect(result.quota).toEqual({
      plan: 'EMPLOYER_BASIC',
      expiresAt: null,
      jobs: { used: 14, limit: 50 },
      activeJobs: { used: 5, limit: 10 },
      durationDaysMax: { used: 60, limit: 60 },
      boostLevelMax: { used: 3, limit: 3 },
    });
  });
});
