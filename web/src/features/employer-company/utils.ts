import type { AddressProvince } from "./types";

export function unwrapList<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

export function calculateCompanyProgress(values: {
  logo: string;
  name: string;
  description: string;
  provinceId: string;
  website: string;
}) {
  let score = 0;
  if (values.logo) score += 20;
  if (values.name) score += 20;
  if (values.description) score += 20;
  if (values.provinceId) score += 20;
  if (values.website) score += 10;
  return score;
}

export function getProvinceName(provinces: AddressProvince[], provinceId: string) {
  return provinceId ? provinces.find((province) => province.id === provinceId)?.name : "";
}
