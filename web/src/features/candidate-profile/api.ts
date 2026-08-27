import { apiPatch, unwrapApiPayload, apiUrl } from "@/lib/api-client";
import type { CandidateProfilePayload } from "./types";

export async function getProfileResume() {
  const response = await fetch(apiUrl("/api/v1/resumes/profile"), { credentials: "include" });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || "Không thể tải hồ sơ");
  return unwrapApiPayload<any>(body);
}

export function saveProfileResume(payload: CandidateProfilePayload & Record<string, unknown>) {
  return apiPatch("/api/v1/resumes/profile", payload);
}

export async function uploadCandidateAvatar(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(apiUrl("/api/v1/upload/candidate-avatar"), {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || "Lỗi khi upload ảnh.");
  const avatarUrl = body?.data?.data?.avatar ?? body?.data?.avatar ?? body?.avatar;
  if (!avatarUrl) throw new Error("Upload ảnh thất bại.");
  return avatarUrl as string;
}
