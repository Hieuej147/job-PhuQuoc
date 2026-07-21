import { apiGet, apiPatch, apiPost, unwrapApiPayload, apiUrl } from "@/lib/api-client";
import type { AddressProvince, Company } from "./types";

export function getAddressTree() {
  return apiGet<AddressProvince[]>("/api/v1/address/tree");
}

export async function getMyCompany() {
  const response = await fetch(apiUrl("/api/v1/companies/my"), { credentials: "include" });
  if (response.status === 404) return null;
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || "Không thể tải hồ sơ công ty");
  return unwrapApiPayload<Company>(body);
}

export function saveCompany(companyId: string | null, payload: Record<string, unknown>) {
  return companyId
    ? apiPatch<Company>(`/api/v1/companies/${companyId}`, payload)
    : apiPost<Company>("/api/v1/companies", payload);
}

export async function uploadCompanyLogo(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(apiUrl("/api/v1/upload/company-logo"), {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || "Upload logo thất bại");
  const uploadData = body?.data?.data ?? body?.data;
  if (!uploadData?.logo) throw new Error("Upload logo thất bại");
  return uploadData.logo as string;
}

export async function uploadCompanyCover(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(apiUrl("/api/v1/upload/company-cover"), {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || "Upload ảnh bìa thất bại");
  const uploadData = body?.data?.data ?? body?.data;
  if (!uploadData?.coverImage) throw new Error("Upload ảnh bìa thất bại");
  return uploadData.coverImage as string;
}
