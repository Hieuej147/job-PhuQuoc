import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import type { EmployerJob, EmployerJobsResponse, JobCategory, JobSort, JobStats, JobStatus, PricingPackage } from "./types";

export function getCategories() {
  return apiGet<{ items?: JobCategory[] } | JobCategory[]>("/api/v1/categories");
}

export function getManagedJob(jobId: string) {
  return apiGet<EmployerJob>(`/api/v1/jobs/manage/${jobId}`);
}

export function createJob(payload: Record<string, unknown>) {
  return apiPost<EmployerJob>("/api/v1/jobs", payload);
}

export function updateJob(jobId: string, payload: Record<string, unknown>) {
  return apiPatch<EmployerJob>(`/api/v1/jobs/${jobId}`, payload);
}

export function listEmployerJobs(params: { status: JobStatus; sort: JobSort; search?: string }) {
  const query = new URLSearchParams({ limit: "100", status: params.status, sort: params.sort });
  if (params.search) query.set("search", params.search);
  return apiGet<EmployerJobsResponse>(`/api/v1/jobs/my?${query.toString()}`);
}

export function getEmployerJobStats() {
  return apiGet<Partial<JobStats>>("/api/v1/jobs/my/stats");
}

export function closeEmployerJob(jobId: string) {
  return apiPatch<Partial<EmployerJob>>(`/api/v1/jobs/${jobId}/close`);
}

export function archiveEmployerJob(jobId: string) {
  return apiDelete<{ mode?: "archived"; message?: string }>(`/api/v1/jobs/${jobId}/employer`);
}

export function getPricingPackages() {
  return apiGet<PricingPackage[]>("/api/v1/pricing?active=true");
}

export function createPaymentCheckout(payload: {
  jobId: string;
  packageId: string;
  durationDays?: number;
  boostLevel: number;
}) {
  return apiPost<{ url?: string; gateway?: "stripe" | "mock" }>("/api/v1/payments/checkout", payload);
}
