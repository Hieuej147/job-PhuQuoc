"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import type { Area } from "react-easy-crop";
import { Info, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { CompanyBasicForm } from "@/features/employer-company/components/company-basic-form";
import { CompanyCompletionCard } from "@/features/employer-company/components/company-completion-card";
import { ImageCropDialog } from "@/components/media/image-crop-dialog";
import { createCroppedImageFile, isSupportedImage } from "@/components/media/image-crop";
import { CompanyPageHeader } from "@/features/employer-company/components/company-page-header";
import { CompanyPreviewSidebar } from "@/features/employer-company/components/company-preview-sidebar";
import type { AddressProvince, Company, CompanySize } from "@/features/employer-company/types";
import { calculateCompanyProgress, unwrapList } from "@/features/employer-company/utils";
import { getAddressTree, getMyCompany, saveCompany, uploadCompanyCover, uploadCompanyLogo } from "@/features/employer-company/api";

type CropTarget = "logo" | "cover";

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
  const [coverImage, setCoverImage] = useState("");
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState("");
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");
  const [cropImageUrl, setCropImageUrl] = useState("");
  const [cropSourceName, setCropSourceName] = useState("");
  const [cropSourceType, setCropSourceType] = useState("");
  const [cropTarget, setCropTarget] = useState<CropTarget>("logo");
  const [cropOpen, setCropOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [industry, setIndustry] = useState("");
  const [size, setSize] = useState<CompanySize>("");
  const [addressDetail, setAddressDetail] = useState("");

  const [addressTree, setAddressTree] = useState<AddressProvince[]>([]);
  const [provinceId, setProvinceId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [wardId, setWardId] = useState("");

  useEffect(() => {
    getAddressTree()
      .then((items) => setAddressTree(unwrapList<AddressProvince>(items)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    };
  }, [logoPreviewUrl]);

  useEffect(() => {
    return () => {
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    };
  }, [coverPreviewUrl]);

  useEffect(() => {
    return () => {
      if (cropImageUrl) URL.revokeObjectURL(cropImageUrl);
    };
  }, [cropImageUrl]);

  useEffect(() => {
    getMyCompany()
      .then((currentCompany) => {
        if (!currentCompany) return;

        setCompany(currentCompany);
        setName(currentCompany.name || "");
        setDescription(currentCompany.description || "");
        setWebsite(currentCompany.website || "");
        setLogo(currentCompany.logo || "");
        setCoverImage(currentCompany.coverImage || "");
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

  const openCropper = (file: File, target: CropTarget, event?: ChangeEvent<HTMLInputElement>) => {
    if (!isSupportedImage(file)) {
      setError("Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP");
      if (event) event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File vượt quá giới hạn 5MB");
      if (event) event.target.value = "";
      return;
    }

    if (cropImageUrl) URL.revokeObjectURL(cropImageUrl);
    setError(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCropTarget(target);
    setCropSourceName(file.name);
    setCropSourceType(file.type);
    setCropImageUrl(URL.createObjectURL(file));
    setCropOpen(true);
    if (event) event.target.value = "";
  };

  const handleLogoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    openCropper(file, "logo", event);
  };

  const handleCoverFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    openCropper(file, "cover", event);
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
        cropSourceName || (cropTarget === "cover" ? "company-cover.webp" : "company-logo.webp"),
        cropSourceType || "image/webp",
        cropTarget === "cover" ? { width: 1600, height: 500 } : { width: 512, height: 512 },
      );
      if (cropTarget === "cover") {
        if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
        setSelectedCoverFile(croppedFile);
        setCoverPreviewUrl(URL.createObjectURL(croppedFile));
      } else {
        if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
        setSelectedLogoFile(croppedFile);
        setLogoPreviewUrl(URL.createObjectURL(croppedFile));
      }
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
    try {
      const logoUrl = await uploadCompanyLogo(selectedLogoFile);
      setLogo(logoUrl);
      setSelectedLogoFile(null);
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
        setLogoPreviewUrl("");
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Lỗi mạng khi upload ảnh.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCoverUpload = async () => {
    if (!selectedCoverFile) {
      setError("Vui lòng chọn ảnh bìa trước khi tải lên");
      return;
    }

    setUploadingCover(true);
    try {
      const coverUrl = await uploadCompanyCover(selectedCoverFile);
      setCoverImage(coverUrl);
      setSelectedCoverFile(null);
      if (coverPreviewUrl) {
        URL.revokeObjectURL(coverPreviewUrl);
        setCoverPreviewUrl("");
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Lỗi mạng khi upload ảnh bìa.");
    } finally {
      setUploadingCover(false);
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
    coverImage: coverImage.trim() || null,
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
      setCompany(await saveCompany(company?.id ?? null, buildPayload()));
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
      <ImageCropDialog
        open={cropOpen}
        title={cropTarget === "cover" ? "Căn chỉnh ảnh bìa" : "Căn chỉnh logo"}
        description={cropTarget === "cover"
          ? "Kéo ảnh để chọn vùng banner hiển thị trên trang công ty."
          : "Kéo ảnh để căn logo vào khung vuông, dùng thanh zoom nếu cần."
        }
        aspect={cropTarget === "cover" ? 16 / 5 : 1}
        cropShape="rect"
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
              coverImage={coverImage}
              coverPreviewUrl={coverPreviewUrl}
              selectedCoverFile={selectedCoverFile}
              uploadingCover={uploadingCover}
              onCoverFileChange={handleCoverFileChange}
              onCoverUpload={handleCoverUpload}
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
          coverImage={coverImage}
          coverPreviewUrl={coverPreviewUrl}
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
