import { apiGet, apiPost, apiDelete } from "@/lib/api-client";

export function getWards() {
  return apiGet<any>("/api/v1/address/wards?limit=50");
}

export function searchJobs(queryString: string) {
  return apiGet<any>(`/api/v1/jobs?${queryString}`);
}

export function getSavedJobIdsForSearch() {
  return apiGet<any>("/api/v1/saved/jobs?limit=200");
}

export function saveJobFromSearch(jobId: string) {
  return apiPost(`/api/v1/saved/jobs/${jobId}`);
}

export function unsaveJobFromSearch(jobId: string) {
  return apiDelete(`/api/v1/saved/jobs/${jobId}`);
}
