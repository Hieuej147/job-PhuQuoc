import { apiDelete, apiGet, apiPost, unwrapApiPayload } from "@/lib/api-client";

export async function getSavedJobIds() {
  const payload = await apiGet<any>("/api/v1/saved/jobs?limit=200");
  const items = payload?.items || payload || [];
  return new Set<string>(items.map((item: any) => item.jobId).filter(Boolean));
}

export async function checkApplication(jobId: string) {
  const response = await fetch(`/api/v1/applications/check/${jobId}`, { credentials: "include" });
  if (!response.ok) return false;
  const data = await response.json();
  const appliedState = unwrapApiPayload<{ applied?: boolean }>(data);
  return Boolean(appliedState?.applied);
}

export function saveJob(jobId: string) {
  return apiPost(`/api/v1/saved/jobs/${jobId}`);
}

export function unsaveJob(jobId: string) {
  return apiDelete(`/api/v1/saved/jobs/${jobId}`);
}

export function applyToJob(payload: Record<string, unknown>) {
  return apiPost("/api/v1/applications", payload);
}
