"use client";

import { useEffect, useMemo, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2,
  ImageIcon,
  MapPin,
  Save,
  Globe,
  Eye,
  CheckCircle2,
  Users,
  Briefcase,
  Lightbulb,
  ChevronRight,
  ExternalLink,
  BarChart3,
  Circle,
  Info,
} from "lucide-react";
import Link from "next/link";

type CompanySize =
  | ""
  | "SIZE_1_50"
  | "SIZE_51_200"
  | "SIZE_201_500"
  | "SIZE_500_PLUS";

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

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function createCroppedImageFile(
  imageSrc: string,
  crop: Area,
  fileName: string,
  fileType: string,
) {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Không thể xử lý ảnh trên trình duyệt này");
  }

  canvas.width = 512;
  canvas.height = 512;
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    512,
    512,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (!result) {
        reject(new Error("Không thể tạo ảnh đã crop"));
        return;
      }
      resolve(result);
    }, fileType);
  });

  return new File([blob], fileName, { type: fileType });
}

export default function EmployerCompanyPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("basic");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [logo, setLogo] = useState("");
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState("");
  const [cropImageUrl, setCropImageUrl] = useState("");
  const [cropSourceName, setCropSourceName] = useState("");
  const [cropSourceType, setCropSourceType] = useState("");
  const [cropOpen, setCropOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File vượt quá giới hạn 5MB");
      e.target.value = "";
      return;
    }

    if (cropImageUrl) URL.revokeObjectURL(cropImageUrl);
    setError(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCropSourceName(file.name);
    setCropSourceType(file.type);
    setCropImageUrl(URL.createObjectURL(file));
    setCropOpen(true);
    e.target.value = "";
  };

  const handleCropCancel = () => {
    setCropOpen(false);
    if (cropImageUrl) {
      URL.revokeObjectURL(cropImageUrl);
      setCropImageUrl("");
    }
  };

  const handleCropConfirm = async () => {
    if (!cropImageUrl || !croppedAreaPixels) return;

    try {
      const croppedFile = await createCroppedImageFile(
        cropImageUrl,
        croppedAreaPixels,
        cropSourceName || "company-logo.webp",
        cropSourceType || "image/webp",
      );
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
      setSelectedLogoFile(croppedFile);
      setLogoPreviewUrl(URL.createObjectURL(croppedFile));
      setCropOpen(false);
      URL.revokeObjectURL(cropImageUrl);
      setCropImageUrl("");
    } catch {
      setError("Không thể crop ảnh. Vui lòng thử ảnh khác.");
    }
  };

  const handleLogoUpload = async () => {
    if (!selectedLogoFile) {
      setError("Vui lòng chọn logo trước khi tải lên");
      return;
    }

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append("file", selectedLogoFile);

    try {
      const res = await fetch("/api/v1/upload/company-logo", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const d = await res.json().catch(() => null);
      const uploadData = d?.data?.data ?? d?.data;

      if (res.ok && uploadData?.logo) {
        setLogo(uploadData.logo);
        setSelectedLogoFile(null);
        if (logoPreviewUrl) {
          URL.revokeObjectURL(logoPreviewUrl);
          setLogoPreviewUrl("");
        }
      } else {
        setError(d?.message || "Upload logo thất bại");
      }
    } catch (err) {
      setError("Lỗi mạng khi upload ảnh.");
    } finally {
      setUploadingLogo(false);
    }
  };

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
    return () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  useEffect(() => {
    return () => {
      if (cropImageUrl) {
        URL.revokeObjectURL(cropImageUrl);
      }
    };
  }, [cropImageUrl]);

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
  const districts = useMemo(
    () => provinces.find((p) => p.id === provinceId)?.districts || [],
    [provinces, provinceId],
  );
  const wards = useMemo(
    () => districts.find((d) => d.id === districtId)?.wards || [],
    [districts, districtId],
  );

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
      const res = await fetch(
        company ? `/api/v1/companies/${company.id}` : "/api/v1/companies",
        {
          method: company ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        },
      );

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

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );

  const calculateProgress = () => {
    let score = 0;
    if (logo) score += 20;
    if (name) score += 20;
    if (description) score += 20;
    if (provinceId) score += 20;
    if (website) score += 10;
    return score;
  };
  const progress = calculateProgress();

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <Dialog open={cropOpen} onOpenChange={(open) => {
        if (!open) handleCropCancel();
      }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Căn chỉnh logo</DialogTitle>
            <DialogDescription>
              Kéo ảnh để căn logo vào khung vuông, dùng thanh zoom nếu cần.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative h-[360px] overflow-hidden rounded-lg border bg-black">
              {cropImageUrl ? (
                <Cropper
                  image={cropImageUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="rect"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_croppedArea, areaPixels) => setCroppedAreaPixels(areaPixels)}
                />
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCropCancel}>
              Hủy
            </Button>
            <Button type="button" onClick={handleCropConfirm}>
              Dùng ảnh này
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Breadcrumb + Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <Link
            href="/employer/dashboard"
            className="hover:text-primary transition-colors"
          >
            Dashboard
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-amber-500 font-semibold">Hồ sơ công ty</span>
        </div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="text-amber-500" /> Hồ sơ công ty
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Cập nhật thông tin công ty để thu hút ứng viên tốt hơn
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {company?.slug ? (
              <Link
                href={`/companies/${company.slug}`}
                target="_blank"
                className="flex items-center gap-2 px-4 py-2 border border-border text-muted-foreground font-semibold text-sm rounded-xl hover:bg-muted/50 transition-colors"
              >
                <ExternalLink className="size-4.5" /> Xem trang công ty
              </Link>
            ) : (
              <Button variant="outline" disabled className="rounded-xl">
                <ExternalLink className="size-4.5 mr-2" /> Xem trang công ty
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-sm rounded-xl hover:opacity-90 transition-all shadow-md h-10 border-none"
            >
              {saving ? <Spinner size="sm" /> : <Save className="size-4" />} Lưu
              thay đổi
            </Button>
          </div>
        </div>
      </div>

      {/* Completion progress banner */}
      <Card className="p-5 mb-6 shadow-sm border-amber-200 dark:border-amber-900/50">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="text-amber-500 size-6" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">
                Mức độ hoàn thiện hồ sơ
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Hồ sơ càng đầy đủ, ứng viên càng tin tưởng và ứng tuyển nhiều
                hơn
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-2xl font-bold text-amber-500">
              {progress}%
            </span>
            <div className="w-32 h-2.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mt-4 pt-4 border-t">
          <div className="flex items-center gap-1.5">
            <CheckCircle2
              className={`size-4 ${logo ? "text-green-500 fill-green-50" : "text-muted-foreground"}`}
            />
            <span className="text-sm text-muted-foreground">Logo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2
              className={`size-4 ${name ? "text-green-500 fill-green-50" : "text-muted-foreground"}`}
            />
            <span className="text-sm text-muted-foreground">Tên công ty</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2
              className={`size-4 ${description ? "text-green-500 fill-green-50" : "text-muted-foreground"}`}
            />
            <span className="text-sm text-muted-foreground">Mô tả</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2
              className={`size-4 ${provinceId ? "text-green-500 fill-green-50" : "text-muted-foreground"}`}
            />
            <span className="text-sm text-muted-foreground">Địa chỉ</span>
          </div>
          <div className="flex items-center gap-1.5">
            {website ? (
              <CheckCircle2 className="size-4 text-green-500 fill-green-50" />
            ) : (
              <Circle className="size-4 text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground">Website</span>
          </div>
        </div>
      </Card>

      {/* Tab navigation */}
      <Card className="mb-6 overflow-hidden shadow-sm">
        <div className="flex gap-1 p-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("basic")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-colors ${activeTab === "basic" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
          >
            <Info className="size-4" /> Thông tin cơ bản
          </button>
        </div>
      </Card>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === "basic" && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="border-b pb-4 mb-4">
                  <CardTitle className="text-base flex items-center gap-2 text-primary">
                    <ImageIcon className="size-5" /> Logo & Ảnh bìa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Cover */}
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Ảnh bìa công ty <span className="text-xs text-muted-foreground">(sắp ra mắt)</span>
                    </label>
                    <div className="w-full h-[140px] rounded-2xl border-2 border-dashed flex items-center justify-center bg-muted/30 relative overflow-hidden">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <ImageIcon className="size-8 text-muted-foreground/60" />
                        <p className="text-xs font-semibold">
                          Tính năng ảnh bìa sẽ được bổ sung sau
                        </p>
                        <p className="text-[11px] opacity-70">
                          PNG, JPG • Tối đa 5MB • 1200×400px
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Logo */}
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Logo công ty <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-[100px] h-[100px] rounded-2xl border-2 border-dashed flex items-center justify-center bg-amber-50 dark:bg-amber-500/10 relative overflow-hidden group hover:border-primary hover:bg-primary/5 transition-all flex-shrink-0">
                        {logoPreviewUrl || logo ? (
                          <img
                            src={logoPreviewUrl || logo}
                            alt="Logo"
                            className="w-full h-full object-contain bg-white"
                          />
                        ) : (
                          <span className="text-2xl font-bold text-amber-600 dark:text-amber-500">
                            {name ? name.substring(0, 2).toUpperCase() : "VW"}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-3">
                          Logo hiển thị trên trang tuyển dụng và các tin đăng
                          của công ty
                        </p>
                        <div className="flex flex-wrap gap-2 relative max-w-sm mb-1.5">
                          <div className="relative">
                            <Input type="file" accept="image/png, image/jpeg, image/jpg, image/webp" onChange={handleLogoFileChange} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" disabled={uploadingLogo} />
                            <Button type="button" variant="outline" size="sm" className="h-8 text-xs px-3" disabled={uploadingLogo}>
                              <ImageIcon className="size-3.5 mr-1.5" />
                              Chọn ảnh
                            </Button>
                          </div>
                          <Button type="button" size="sm" className="h-8 text-xs px-3" disabled={uploadingLogo || !selectedLogoFile} onClick={handleLogoUpload}>
                            {uploadingLogo ? <Spinner size="sm" className="mr-1.5" /> : null}
                            {uploadingLogo ? "Đang tải..." : "Tải logo lên"}
                          </Button>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          PNG, JPG, WEBP • tối đa 5MB • preview trước khi upload
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b pb-4 mb-4">
                  <CardTitle className="text-base flex items-center gap-2 text-primary">
                    <Building2 className="size-5" /> Thông tin công ty
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Tên công ty <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        Ngành nghề <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Chọn ngành nghề</option>
                        <option value="Khách sạn & Resort">
                          Khách sạn & Resort
                        </option>
                        <option value="Nhà hàng & F&B">Nhà hàng & F&B</option>
                        <option value="Du lịch & Lữ hành">
                          Du lịch & Lữ hành
                        </option>
                        <option value="Bán lẻ & Dịch vụ">
                          Bán lẻ & Dịch vụ
                        </option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        Quy mô nhân sự <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={size}
                        onChange={(e) => setSize(e.target.value as CompanySize)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Chọn quy mô</option>
                        {COMPANY_SIZES.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Giới thiệu công ty <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      placeholder="Giới thiệu về công ty..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Tối thiểu 100 ký tự. Mô tả rõ ràng giúp ứng viên hiểu về
                      văn hoá công ty.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b pb-4 mb-4">
                  <CardTitle className="text-base flex items-center gap-2 text-primary">
                    <MapPin className="size-5" /> Địa chỉ
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        Khu vực (Tỉnh/thành){" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={provinceId}
                        onChange={(e) => handleProvinceChange(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Chọn tỉnh/thành</option>
                        {provinces.map((province) => (
                          <option key={province.id} value={province.id}>
                            {province.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        Quận/huyện <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={districtId}
                        onChange={(e) => handleDistrictChange(e.target.value)}
                        disabled={!provinceId}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Chọn quận/huyện</option>
                        {districts.map((district) => (
                          <option key={district.id} value={district.id}>
                            {district.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        Phường/xã <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={wardId}
                        onChange={(e) => setWardId(e.target.value)}
                        disabled={!districtId}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Chọn phường/xã</option>
                        {wards.map((ward) => (
                          <option key={ward.id} value={ward.id}>
                            {ward.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Địa chỉ cụ thể <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        value={addressDetail}
                        onChange={(e) => setAddressDetail(e.target.value)}
                        className="pl-10"
                        placeholder="Số nhà, tên đường, khu phố..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b pb-4 mb-4">
                  <CardTitle className="text-base flex items-center gap-2 text-primary">
                    <Globe className="size-5" /> Thông tin liên hệ
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Website
                    </label>
                    <Input
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Cột phụ (Preview & Tips) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <Card className="overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b bg-muted/30 flex items-center gap-2">
                <Eye className="size-4 text-amber-500" />
                <span className="text-sm font-bold text-foreground">
                  Xem trước trang công ty
                </span>
              </div>

              {/* Mini preview */}
              <div className="m-4 rounded-xl overflow-hidden border bg-card text-card-foreground shadow-sm">
                <div className="h-16 bg-gradient-to-r from-teal-700 to-teal-600 relative">
                  <div className="absolute bottom-0 left-4 translate-y-1/2">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 border-2 border-white flex items-center justify-center text-sm font-bold text-amber-600 shadow-md overflow-hidden">
                      {logoPreviewUrl || logo ? (
                        <img
                          src={logoPreviewUrl || logo}
                          alt="Logo"
                          className="w-full h-full object-contain bg-white"
                        />
                      ) : name ? (
                        name.substring(0, 2).toUpperCase()
                      ) : (
                        "VW"
                      )}
                    </div>
                  </div>
                </div>
                <div className="pt-8 px-4 pb-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-bold text-sm text-foreground">
                        {name || "Tên công ty"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {industry || "Ngành nghề"}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full flex-shrink-0">
                      <CheckCircle2 className="size-3" /> Đã xác minh
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground mb-3">
                    <span className="flex items-center gap-0.5">
                      <MapPin className="size-3" />{" "}
                      {provinceId
                        ? provinces.find((p) => p.id === provinceId)?.name
                        : "Khu vực"}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Users className="size-3" />{" "}
                      {COMPANY_SIZES.find((s) => s.value === size)?.label ||
                        "Quy mô"}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Briefcase className="size-3" /> 0 việc làm
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                    {description || "Chưa có mô tả công ty..."}
                  </p>
                </div>
              </div>

              {/* Tips */}
              <div className="mx-4 mb-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-1.5 flex items-center gap-1">
                  <Lightbulb className="size-3.5" /> Mẹo tối ưu
                </p>
                <ul className="text-[11px] text-muted-foreground space-y-1">
                  <li>• Thêm ảnh bìa đẹp tăng 3x lượt xem</li>
                  <li>• Mô tả từ 200+ ký tự thu hút ứng viên hơn</li>
                  <li>• Cập nhật đầy đủ phúc lợi tăng 40% đơn ứng tuyển</li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="size-4 mr-1.5" />{" "}
          {saving ? "Đang lưu..." : company ? "Lưu thay đổi" : "Tạo công ty"}
        </Button>
      </div>
    </div>
  );
}
