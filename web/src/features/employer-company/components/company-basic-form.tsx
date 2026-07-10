import type { ChangeEvent, ReactNode } from "react";
import { Building2, Globe, ImageIcon, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { COMPANY_SIZES, type AddressDistrict, type AddressProvince, type AddressWard, type CompanySize } from "../types";

interface CompanyBasicFormProps {
  name: string;
  setName: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  website: string;
  setWebsite: (value: string) => void;
  industry: string;
  setIndustry: (value: string) => void;
  size: CompanySize;
  setSize: (value: CompanySize) => void;
  logo: string;
  coverImage: string;
  coverPreviewUrl: string;
  selectedCoverFile: File | null;
  uploadingCover: boolean;
  onCoverFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onCoverUpload: () => void;
  logoPreviewUrl: string;
  selectedLogoFile: File | null;
  uploadingLogo: boolean;
  onLogoFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onLogoUpload: () => void;
  provinces: AddressProvince[];
  districts: AddressDistrict[];
  wards: AddressWard[];
  provinceId: string;
  districtId: string;
  wardId: string;
  addressDetail: string;
  onProvinceChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  setWardId: (value: string) => void;
  setAddressDetail: (value: string) => void;
}

export function CompanyBasicForm(props: CompanyBasicFormProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="mb-4 border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-base text-primary">
            <ImageIcon className="size-5" /> Logo & Ảnh bìa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Ảnh bìa công ty
            </label>
            <div className="relative flex h-[140px] w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-muted/30">
              {props.coverPreviewUrl || props.coverImage ? (
                <img
                  src={props.coverPreviewUrl || props.coverImage}
                  alt="Ảnh bìa công ty"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImageIcon className="size-8 text-muted-foreground/60" />
                  <p className="text-xs font-semibold">Thêm ảnh bìa để trang công ty nổi bật hơn</p>
                  <p className="text-[11px] opacity-70">PNG, JPG, WEBP • Tối đa 5MB • Khuyến nghị 1600×500px</p>
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <div className="relative">
                <Input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={props.onCoverFileChange}
                  className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  disabled={props.uploadingCover}
                />
                <Button type="button" variant="outline" size="sm" className="h-8 px-3 text-xs" disabled={props.uploadingCover}>
                  <ImageIcon className="mr-1.5 size-3.5" />
                  Chọn ảnh bìa
                </Button>
              </div>
              <Button
                type="button"
                size="sm"
                className="h-8 px-3 text-xs"
                disabled={props.uploadingCover || !props.selectedCoverFile}
                onClick={props.onCoverUpload}
              >
                {props.uploadingCover ? <Spinner size="sm" className="mr-1.5" /> : null}
                {props.uploadingCover ? "Đang tải..." : "Tải ảnh bìa lên"}
              </Button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Logo công ty <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-4">
              <div className="group relative flex h-[100px] w-[100px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-amber-50 transition-all hover:border-primary hover:bg-primary/5 dark:bg-amber-500/10">
                {props.logoPreviewUrl || props.logo ? (
                  <img
                    src={props.logoPreviewUrl || props.logo}
                    alt="Logo"
                    className="h-full w-full bg-white object-contain"
                  />
                ) : (
                  <span className="text-2xl font-bold text-amber-600 dark:text-amber-500">
                    {props.name ? props.name.substring(0, 2).toUpperCase() : "VW"}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="mb-3 text-xs text-muted-foreground">
                  Logo hiển thị trên trang tuyển dụng và các tin đăng của công ty
                </p>
                <div className="relative mb-1.5 flex max-w-sm flex-wrap gap-2">
                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={props.onLogoFileChange}
                      className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                      disabled={props.uploadingLogo}
                    />
                    <Button type="button" variant="outline" size="sm" className="h-8 px-3 text-xs" disabled={props.uploadingLogo}>
                      <ImageIcon className="mr-1.5 size-3.5" />
                      Chọn ảnh
                    </Button>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    disabled={props.uploadingLogo || !props.selectedLogoFile}
                    onClick={props.onLogoUpload}
                  >
                    {props.uploadingLogo ? <Spinner size="sm" className="mr-1.5" /> : null}
                    {props.uploadingLogo ? "Đang tải..." : "Tải logo lên"}
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
        <CardHeader className="mb-4 border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-base text-primary">
            <Building2 className="size-5" /> Thông tin công ty
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Tên công ty <span className="text-red-500">*</span>
            </label>
            <Input value={props.name} onChange={(event) => props.setName(event.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Ngành nghề <span className="text-red-500">*</span>
              </label>
              <select
                value={props.industry}
                onChange={(event) => props.setIndustry(event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Chọn ngành nghề</option>
                <option value="Khách sạn & Resort">Khách sạn & Resort</option>
                <option value="Nhà hàng & F&B">Nhà hàng & F&B</option>
                <option value="Du lịch & Lữ hành">Du lịch & Lữ hành</option>
                <option value="Bán lẻ & Dịch vụ">Bán lẻ & Dịch vụ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Quy mô nhân sự <span className="text-red-500">*</span>
              </label>
              <select
                value={props.size}
                onChange={(event) => props.setSize(event.target.value as CompanySize)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
            <label className="mb-1.5 block text-sm font-medium">
              Giới thiệu công ty <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={props.description}
              onChange={(event) => props.setDescription(event.target.value)}
              rows={5}
              placeholder="Giới thiệu về công ty..."
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Tối thiểu 100 ký tự. Mô tả rõ ràng giúp ứng viên hiểu về văn hoá công ty.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="mb-4 border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-base text-primary">
            <MapPin className="size-5" /> Địa chỉ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <AddressSelect label="Khu vực (Tỉnh/thành)" value={props.provinceId} onChange={props.onProvinceChange}>
              {props.provinces.map((province) => (
                <option key={province.id} value={province.id}>{province.name}</option>
              ))}
            </AddressSelect>
            <AddressSelect label="Quận/huyện" value={props.districtId} onChange={props.onDistrictChange} disabled={!props.provinceId}>
              {props.districts.map((district) => (
                <option key={district.id} value={district.id}>{district.name}</option>
              ))}
            </AddressSelect>
            <AddressSelect label="Phường/xã" value={props.wardId} onChange={props.setWardId} disabled={!props.districtId}>
              {props.wards.map((ward) => (
                <option key={ward.id} value={ward.id}>{ward.name}</option>
              ))}
            </AddressSelect>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Địa chỉ cụ thể <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={props.addressDetail}
                onChange={(event) => props.setAddressDetail(event.target.value)}
                className="pl-10"
                placeholder="Số nhà, tên đường, khu phố..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="mb-4 border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-base text-primary">
            <Globe className="size-5" /> Thông tin liên hệ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Website</label>
            <Input
              value={props.website}
              onChange={(event) => props.setWebsite(event.target.value)}
              placeholder="https://example.com"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AddressSelect(props: {
  label: string;
  value: string;
  disabled?: boolean;
  children: ReactNode;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">
        {props.label} <span className="text-red-500">*</span>
      </label>
      <select
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        disabled={props.disabled}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">Chọn {props.label.toLowerCase()}</option>
        {props.children}
      </select>
    </div>
  );
}
