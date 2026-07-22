import { apiDelete, apiGet, apiPost, unwrapApiPayload, apiUrl } from "@/lib/api-client";

export interface CandidateResumeOption {
  id: string;
  title: string;
  isDefault?: boolean;
  template?: {
    name?: string | null;
  } | null;
}

function extractResumeList(payload: any): CandidateResumeOption[] {
  const candidates = [
    payload?.data?.data?.items,
    payload?.data?.data,
    payload?.data?.items,
    payload?.data,
    payload?.items,
    payload,
  ];

  const list = candidates.find(Array.isArray);
  if (!list) return [];

  return list.filter((resume: any) => resume?.id && resume?.title !== "PROFILE_MASTER");
}

export async function getSavedJobIds() {
  const payload = await apiGet<any>("/api/v1/saved/jobs?limit=200");
  const items = payload?.items || payload || [];
  return new Set<string>(items.map((item: any) => item.jobId).filter(Boolean));
}

export async function checkApplication(jobId: string) {
  const response = await fetch(apiUrl(`/api/v1/applications/check/${jobId}`), { credentials: "include" });
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

export async function fetchMyResumes() {
  const payload = await apiGet<any>("/api/v1/resumes/my");
  return extractResumeList(payload);
}

export async function uploadCandidateCv(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const payload = await apiPost<any>("/api/v1/upload/candidate-cv", formData);
  const uploadData = payload?.data?.data ?? payload?.data ?? payload;
  if (!uploadData?.cvUrl) {
    throw new Error("Upload CV không trả về URL hợp lệ");
  }

  return uploadData.cvUrl as string;
}
