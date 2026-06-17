/**
 * TÊN TRANG: Hồ sơ Công ty (Employer Company Profile)
 * MÔ TẢ: Cho phép nhà tuyển dụng xem, tạo và cập nhật đầy đủ hồ sơ công ty.
 * TƯƠNG TÁC DỮ LIỆU (FE-BE-DB):
 * - GET `/api/v1/companies/my`: lấy công ty của employer hiện tại.
 * - POST `/api/v1/companies`: tạo công ty nếu employer chưa có profile.
 * - PATCH `/api/v1/companies/:id`: cập nhật profile công ty đã có.
 * - GET `/api/v1/address/tree`: lấy cây tỉnh/thành → quận/huyện → phường/xã để chọn địa chỉ phân cấp.
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Building2, ImageIcon, MapPin, Save } from "lucide-react";

type CompanySize = "" | "SIZE_1_50" | "SIZE_51_200" | "SIZE_201_500" | "SIZE_500_PLUS";

interface AddressWard {
  id: string;
  name: string;
  districtId: string;
}

interface AddressDistrict {
  id: string;
  name: string;
  provinceId: string;
  wards: AddressWard[];
}

interface AddressProvince {
  id: string;
  name: string;
  districts: AddressDistrict[];
}

interface Company {
  id: string;
  name: string;
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

const COMPANY_SIZES: { value: Exclude<CompanySize, "">; label: string }[] = [
  { value: "SIZE_1_50", label: "1-50 nhân viên" },
  { value: "SIZE_51_200", label: "51-200 nhân viên" },
  { value: "SIZE_201_500", label: "201-500 nhân viên" },
  { value: "SIZE_500_PLUS", label: "Trên 500 nhân viên" },
];

function unwrapList<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

export default function EmployerCompanyPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [logo, setLogo] = useState("");
  const [industry, setIndustry] = useState("");
  const [size, setSize] = useState<CompanySize>("");
  const [addressDetail, setAddressDetail] = useState("");

  const [addressTree, setAddressTree] = useState<AddressProvince[]>([]);
  const [provinceId, setProvinceId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [wardId, setWardId] = useState("");

  useEffect(() => {
    fetch("/api/v1/address/tree", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setAddressTree(unwrapList<AddressProvince>(d)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/v1/companies/my", { credentials: "include" })
      .then((r) => {
        if (r.status === 404) return null;
        return r.json();
      })
      .then((d) => {
        const c = d?.data as Company | undefined;
        if (!c) return;

        setCompany(c);
        setName(c.name || "");
        setDescription(c.description || "");
        setWebsite(c.website || "");
        setLogo(c.logo || "");
        setIndustry(c.industry || "");
        setSize(c.size || "");
        setAddressDetail(c.addressDetail || "");
        setWardId(c.wardId || "");
        setDistrictId(c.ward?.district?.id || "");
        setProvinceId(c.ward?.district?.province?.id || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const provinces = addressTree;
  const districts = useMemo(() => provinces.find((p) => p.id === provinceId)?.districts || [], [provinces, provinceId]);
  const wards = useMemo(() => districts.find((d) => d.id === districtId)?.wards || [], [districts, districtId]);

  const handleProvinceChange = (value: string) => {
    setProvinceId(value);
    setDistrictId("");
    setWardId("");
  };

  const handleDistrictChange = (value: string) => {
    setDistrictId(value);
    setWardId("");
  };

  const buildPayload = () => ({
    name: name.trim(),
    description: description.trim() || null,
    website: website.trim() || null,
    logo: logo.trim() || null,
    industry: industry.trim() || null,
    size: size || null,
    wardId: wardId || null,
    addressDetail: addressDetail.trim() || null,
  });

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Vui lòng nhập tên công ty");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = buildPayload();
      const res = await fetch(company ? `/api/v1/companies/${company.id}` : "/api/v1/companies", {
        method: company ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const d = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(d?.message || "Lưu hồ sơ công ty thất bại");
      }

      setCompany((d?.data || d) as Company);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lưu hồ sơ công ty thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Hồ sơ công ty</h1>

      {company?.isApproved === false && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Công ty chưa được phê duyệt. Một số tính năng có thể bị giới hạn.
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Thông tin cơ bản</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Tên công ty <span className="text-red-500">*</span></label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input value={name} onChange={(e) => setName(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Lĩnh vực</label>
              <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="VD: Khách sạn & Resort" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Website</label>
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Quy mô công ty</label>
              <select value={size} onChange={(e) => setSize(e.target.value as CompanySize)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#0d2d42] dark:border-gray-600">
                <option value="">Chọn quy mô</option>
                {COMPANY_SIZES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Logo URL</label>
            <div className="relative">
              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input value={logo} onChange={(e) => setLogo(e.target.value)} className="pl-10" placeholder="https://example.com/logo.png" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Mô tả công ty</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Giới thiệu về công ty..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Địa chỉ công ty</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Tỉnh/thành</label>
              <select value={provinceId} onChange={(e) => handleProvinceChange(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#0d2d42] dark:border-gray-600">
                <option value="">Chọn tỉnh/thành</option>
                {provinces.map((province) => (
                  <option key={province.id} value={province.id}>{province.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Quận/huyện</label>
              <select value={districtId} onChange={(e) => handleDistrictChange(e.target.value)} disabled={!provinceId} className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#0d2d42] dark:border-gray-600 disabled:opacity-60">
                <option value="">Chọn quận/huyện</option>
                {districts.map((district) => (
                  <option key={district.id} value={district.id}>{district.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Phường/xã</label>
              <select value={wardId} onChange={(e) => setWardId(e.target.value)} disabled={!districtId} className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#0d2d42] dark:border-gray-600 disabled:opacity-60">
                <option value="">Chọn phường/xã</option>
                {wards.map((ward) => (
                  <option key={ward.id} value={ward.id}>{ward.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Địa chỉ chi tiết</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input value={addressDetail} onChange={(e) => setAddressDetail(e.target.value)} className="pl-10" placeholder="Số nhà, đường, khu phố..." />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="size-4 mr-1.5" /> {saving ? "Đang lưu..." : company ? "Lưu thay đổi" : "Tạo công ty"}
        </Button>
      </div>
    </div>
  );
}
