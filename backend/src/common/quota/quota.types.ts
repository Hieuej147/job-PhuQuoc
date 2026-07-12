import type { CandidateQuotaPlan, EmployerQuotaPlan } from '@prisma/client';
import type { STORAGE_QUOTA } from './quota.constants';

export type StorageQuotaResource = keyof typeof STORAGE_QUOTA;
export type QuotaPlan = 'CANDIDATE_FREE' | 'CANDIDATE_PLUS' | 'EMPLOYER_BASIC' | 'EMPLOYER_PRO';
export type QuotaUpgradePlan = CandidateQuotaPlan | EmployerQuotaPlan;

