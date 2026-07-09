import { Briefcase, CheckCircle2, Eye, Lightbulb, MapPin, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { COMPANY_SIZES, type AddressProvince, type CompanySize } from "../types";
import { getProvinceName } from "../utils";

interface CompanyPreviewSidebarProps {
  name: string;
  logo: string;
  logoPreviewUrl: string;
  industry: string;
  size: CompanySize;
  provinceId: string;
  provinces: AddressProvince[];
  description: string;
}

export function CompanyPreviewSidebar({
  name,
  logo,
  logoPreviewUrl,
  industry,
  size,
  provinceId,
  provinces,
  description,
}: CompanyPreviewSidebarProps) {
  const logoSrc = logoPreviewUrl || logo;

  return (
    <div className="lg:col-span-1">
      <div className="sticky top-24 space-y-6">
        <Card className="overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-3">
            <Eye className="size-4 text-amber-500" />
            <span className="text-sm font-bold text-foreground">Xem trước trang công ty</span>
          </div>

          <div className="m-4 overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="relative h-16 bg-gradient-to-r from-teal-700 to-teal-600">
              <div className="absolute bottom-0 left-4 translate-y-1/2">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-amber-100 text-sm font-bold text-amber-600 shadow-md">
                  {logoSrc ? (
                    <img src={logoSrc} alt="Logo" className="h-full w-full bg-white object-contain" />
                  ) : name ? (
                    name.substring(0, 2).toUpperCase()
                  ) : (
                    "VW"
                  )}
                </div>
              </div>
            </div>

            <div className="px-4 pb-4 pt-8">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-foreground">{name || "Tên công ty"}</p>
                  <p className="text-[11px] text-muted-foreground">{industry || "Ngành nghề"}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-900/20 dark:text-green-400">
                  <CheckCircle2 className="size-3" /> Đã xác minh
                </span>
              </div>

              <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <MapPin className="size-3" /> {getProvinceName(provinces, provinceId) || "Khu vực"}
                </span>
                <span className="flex items-center gap-0.5">
                  <Users className="size-3" /> {COMPANY_SIZES.find((item) => item.value === size)?.label || "Quy mô"}
                </span>
                <span className="flex items-center gap-0.5">
                  <Briefcase className="size-3" /> 0 việc làm
                </span>
              </div>

              <p className="line-clamp-3 text-[11px] leading-relaxed text-muted-foreground">
                {description || "Chưa có mô tả công ty..."}
              </p>
            </div>
          </div>

          <div className="mx-4 mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
            <p className="mb-1.5 flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
              <Lightbulb className="size-3.5" /> Mẹo tối ưu
            </p>
            <ul className="space-y-1 text-[11px] text-muted-foreground">
              <li>• Thêm ảnh bìa đẹp tăng 3x lượt xem</li>
              <li>• Mô tả từ 200+ ký tự thu hút ứng viên hơn</li>
              <li>• Cập nhật đầy đủ phúc lợi tăng 40% đơn ứng tuyển</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
