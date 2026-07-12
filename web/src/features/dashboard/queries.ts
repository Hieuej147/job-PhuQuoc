import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { NotificationItem } from "@/features/notifications/queries";

export interface CandidateDashboardSummary {
  applications: { total: number; recent: any[] };
  savedJobs: { total: number; recent: any[] };
  savedCompanies: { total: number };
  resumes: { total: number; recent: any[] };
  notifications: { unreadCount: number; recent: NotificationItem[] };
  quota?: {
    plan?: string;
    applications: { used: number; limit: number };
    resumes: { used: number; limit: number };
    savedJobs: { used: number; limit: number };
    savedCompanies: { used: number; limit: number };
  };
}

export interface EmployerDashboardSummary {
  company: any | null;
  jobs: { total: number; active: number; pending: number; draft: number; recent: any[] };
  applications: { total: number; pending: number; recent: any[] };
  notifications: { unreadCount: number; recent: NotificationItem[] };
  quota?: {
    plan?: string;
    jobs: { used: number; limit: number };
    activeJobs: { used: number; limit: number };
    durationDaysMax: { used: number; limit: number };
    boostLevelMax: { used: number; limit: number };
  };
}

export function useCandidateDashboardSummary(enabled = true) {
  return useQuery({
    queryKey: ["dashboard", "candidate-summary"],
    queryFn: () => apiGet<CandidateDashboardSummary>("/api/v1/dashboard/candidate-summary"),
    staleTime: 30_000,
    enabled,
  });
}

export function useEmployerDashboardSummary(enabled = true) {
  return useQuery({
    queryKey: ["dashboard", "employer-summary"],
    queryFn: () => apiGet<EmployerDashboardSummary>("/api/v1/dashboard/employer-summary"),
    staleTime: 30_000,
    enabled,
  });
}
