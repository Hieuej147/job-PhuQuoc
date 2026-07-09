"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import type { Area } from "react-easy-crop";
import { Info, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { CompanyBasicForm } from "@/features/employer-company/components/company-basic-form";
import { CompanyCompletionCard } from "@/features/employer-company/components/company-completion-card";
import { CompanyLogoCropDialog } from "@/features/employer-company/components/company-logo-crop-dialog";
import { CompanyPageHeader } from "@/features/employer-company/components/company-page-header";
import { CompanyPreviewSidebar } from "@/features/employer-company/components/company-preview-sidebar";
import type { AddressProvince, Company, CompanySize } from "@/features/employer-company/types";
import { calculateCompanyProgress, unwrapList } from "@/features/employer-company/utils";

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

  if (!ctx) throw new Error("Không thể xử lý ảnh trên trình duyệt này");

  canvas.width = 512;
  canvas.height = 512;
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, 512, 512);

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

  const [industry, setIndustry] = useState("");
  const [size, setSize] = useState<CompanySize>("");
  const [addressDetail, setAddressDetail] = useState("");

  const [addressTree, setAddressTree] = useState<AddressProvince[]>([]);
  const [provinceId, setProvinceId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [wardId, setWardId] = useState("");

  useEffect(() => {
    fetch("/api/v1/address/tree", { credentials: "include" })
      .then((response) => response.json())
      .then((body) => setAddressTree(unwrapList<AddressProvince>(body)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    };
  }, [logoPreviewUrl]);

  useEffect(() => {
    return () => {
      if (cropImageUrl) URL.revokeObjectURL(cropImageUrl);
    };
  }, [cropImageUrl]);

  useEffect(() => {
    fetch("/api/v1/companies/my", { credentials: "include" })
      .then((response) => {
        if (response.status === 404) return null;
        return response.json();
      })
      .then((body) => {
        const currentCompany = body?.data as Company | undefined;
        if (!currentCompany) return;

        setCompany(currentCompany);
        setName(currentCompany.name || "");
        setDescription(currentCompany.description || "");
        setWebsite(currentCompany.website || "");
        setLogo(currentCompany.logo || "");
        setIndustry(currentCompany.industry || "");
        setSize(currentCompany.size || "");
        setAddressDetail(currentCompany.addressDetail || "");
        setWardId(currentCompany.wardId || "");
        setDistrictId(currentCompany.ward?.district?.id || "");
        setProvinceId(currentCompany.ward?.district?.province?.id || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const provinces = addressTree;
  const districts = useMemo(
    () => provinces.find((province) => province.id === provinceId)?.districts || [],
    [provinces, provinceId],
  );
  const wards = useMemo(
    () => districts.find((district) => district.id === districtId)?.wards || [],
    [districts, districtId],
  );

  const progress = calculateCompanyProgress({ logo, name, description, provinceId, website });

  const completionItems = [
    { label: "Logo", complete: Boolean(logo) },
    { label: "Tên công ty", complete: Boolean(name) },
    { label: "Mô tả", complete: Boolean(description) },
    { label: "Địa chỉ", complete: Boolean(provinceId) },
    { label: "Website", complete: Boolean(website), optional: true },
  ];

  const handleLogoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File vượt quá giới hạn 5MB");
      event.target.value = "";
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
    event.target.value = "";
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
      const response = await fetch("/api/v1/upload/company-logo", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const body = await response.json().catch(() => null);
      const uploadData = body?.data?.data ?? body?.data;

      if (response.ok && uploadData?.logo) {
        setLogo(uploadData.logo);
        setSelectedLogoFile(null);
        if (logoPreviewUrl) {
          URL.revokeObjectURL(logoPreviewUrl);
          setLogoPreviewUrl("");
        }
      } else {
        setError(body?.message || "Upload logo thất bại");
      }
    } catch {
      setError("Lỗi mạng khi upload ảnh.");
    } finally {
      setUploadingLogo(false);
    }
  };

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
      const response = await fetch(
        company ? `/api/v1/companies/${company.id}` : "/api/v1/companies",
        {
          method: company ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(buildPayload()),
        },
      );

      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message || "Lưu hồ sơ công ty thất bại");
      setCompany((body?.data || body) as Company);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Lưu hồ sơ công ty thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <CompanyLogoCropDialog
        open={cropOpen}
        cropState={{
          imageUrl: cropImageUrl,
          crop,
          zoom,
          onCropChange: setCrop,
          onZoomChange: setZoom,
          onCropComplete: (_croppedArea, areaPixels) => setCroppedAreaPixels(areaPixels),
        }}
        onCancel={handleCropCancel}
        onConfirm={handleCropConfirm}
      />

      <CompanyPageHeader company={company} saving={saving} onSave={handleSave} />

      <CompanyCompletionCard progress={progress} items={completionItems} />

      <Card className="mb-6 overflow-hidden shadow-sm">
        <div className="flex gap-1 overflow-x-auto p-2">
          <button
            type="button"
            onClick={() => setActiveTab("basic")}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === "basic" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Info className="size-4" /> Thông tin cơ bản
          </button>
        </div>
      </Card>

      {company?.isApproved === false && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Công ty chưa được phê duyệt. Một số tính năng có thể bị giới hạn.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {activeTab === "basic" && (
            <CompanyBasicForm
              name={name}
              setName={setName}
              description={description}
              setDescription={setDescription}
              website={website}
              setWebsite={setWebsite}
              industry={industry}
              setIndustry={setIndustry}
              size={size}
              setSize={setSize}
              logo={logo}
              logoPreviewUrl={logoPreviewUrl}
              selectedLogoFile={selectedLogoFile}
              uploadingLogo={uploadingLogo}
              onLogoFileChange={handleLogoFileChange}
              onLogoUpload={handleLogoUpload}
              provinces={provinces}
              districts={districts}
              wards={wards}
              provinceId={provinceId}
              districtId={districtId}
              wardId={wardId}
              addressDetail={addressDetail}
              onProvinceChange={handleProvinceChange}
              onDistrictChange={handleDistrictChange}
              setWardId={setWardId}
              setAddressDetail={setAddressDetail}
            />
          )}
        </div>

        <CompanyPreviewSidebar
          name={name}
          logo={logo}
          logoPreviewUrl={logoPreviewUrl}
          industry={industry}
          size={size}
          provinceId={provinceId}
          provinces={provinces}
          description={description}
        />
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-1.5 size-4" />
          {saving ? "Đang lưu..." : company ? "Lưu thay đổi" : "Tạo công ty"}
        </Button>
      </div>
    </div>
  );
}
