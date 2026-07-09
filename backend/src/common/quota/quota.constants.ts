import type { QuotaPlan, StorageQuotaResource } from './quota.types';

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

