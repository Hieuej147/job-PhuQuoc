import type { Area } from "react-easy-crop";

export type CompanySize =
  | ""
  | "SIZE_1_50"
  | "SIZE_51_200"
  | "SIZE_201_500"
  | "SIZE_500_PLUS";

export interface AddressWard {
  id: string;
  name: string;
  districtId: string;
}

export interface AddressDistrict {
  id: string;
  name: string;
  provinceId: string;
  wards: AddressWard[];
}

export interface AddressProvince {
  id: string;
  name: string;
  districts: AddressDistrict[];
}

export interface Company {
  id: string;
  name: string;
  slug?: string | null;
  description: string | null;
  website: string | null;
  logo: string | null;
  wardId: string | null;
  addressDetail: string | null;
  size: CompanySize | null;
  industry: string | null;
  isApproved: boolean;
  ward?: {
    id: string;
    name: string;
    district?: {
      id: string;
      name: string;
      province?: {
        id: string;
        name: string;
      } | null;
    } | null;
  } | null;
}

export interface LogoCropState {
  imageUrl: string;
  crop: { x: number; y: number };
  zoom: number;
  onCropChange: (crop: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  onCropComplete: (_croppedArea: Area, areaPixels: Area) => void;
}

export const COMPANY_SIZES: { value: Exclude<CompanySize, "">; label: string }[] = [
  { value: "SIZE_1_50", label: "1-50 nhân viên" },
  { value: "SIZE_51_200", label: "51-200 nhân viên" },
  { value: "SIZE_201_500", label: "201-500 nhân viên" },
  { value: "SIZE_500_PLUS", label: "Trên 500 nhân viên" },
];
