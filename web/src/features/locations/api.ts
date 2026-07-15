import { apiGet } from "@/lib/api-client";

export type WorkLocation = {
  id: string;
  name: string;
  slug: string;
  district?: {
    name?: string | null;
    province?: { name?: string | null } | null;
  } | null;
};

export function getWorkLocations() {
  return apiGet<WorkLocation[]>("/api/v1/address/wards");
}
