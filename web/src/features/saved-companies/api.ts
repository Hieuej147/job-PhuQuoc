import { apiDelete, apiGet } from "@/lib/api-client";

export function getSavedCompanies(limit = 500) {
  return apiGet<any>(`/api/v1/saved/companies?limit=${limit}`);
}

export function deleteSavedCompany(companyId: string) {
  return apiDelete(`/api/v1/saved/companies/${companyId}`);
}
