import { apiDelete, apiGet } from "@/lib/api-client";

export function getSavedJobs(limit = 500) {
  return apiGet<any>(`/api/v1/saved/jobs?limit=${limit}`);
}

export function deleteSavedJob(savedId: string) {
  return apiDelete(`/api/v1/saved/jobs/${savedId}`);
}
