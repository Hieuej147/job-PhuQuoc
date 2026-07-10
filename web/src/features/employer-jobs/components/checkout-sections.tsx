"use client";

import { CreditCard, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EmployerJob, PricingPackage } from "../types";

export function CheckoutJobSummary({ job }: { job: EmployerJob | null }) {
  if (!job) return null;
  const isArchivedJob = Boolean(job.archivedAt);
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-gray-500">Tin tuyển dụng</p>
        <p className="font-semibold">{job.title}</p>
        {isArchivedJob && (
          <p className="mt-2 text-sm text-amber-600 dark:text-amber-300">
            Tin này đang nằm trong Lưu trữ. Hãy khôi phục tin trước khi thanh toán hoặc gia hạn.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function PackageSelector({
  packages,
  selectedPkg,
  onSelect,
}: {
  packages: PricingPackage[];
  selectedPkg: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {packages.map((pkg, index) => (
        <Card
          key={pkg.id}
          className={`cursor-pointer transition-all hover:shadow-lg ${
            selectedPkg === pkg.id
              ? "scale-105 border-2 border-[#0E7490] shadow-lg dark:border-[#67e8f9]"
              : "border border-gray-200 dark:border-gray-700"
          }`}
          onClick={() => onSelect(pkg.id)}
        >
          <CardContent className="p-6 text-center">
            {index === 1 && (
              <span className="mb-3 inline-block rounded-full bg-[#F59E0B] px-3 py-1 text-xs font-bold text-white">
                Phổ biến nhất
              </span>
            )}
            <h3 className="mb-2 text-xl font-bold">{pkg.name}</h3>
            <p className="mb-1 text-3xl font-bold text-[#0E7490] dark:text-[#67e8f9]">
              {pkg.price.toLocaleString("vi-VN")}đ
            </p>
            <p className="mb-4 text-sm text-gray-500">{pkg.days} ngày hiển thị</p>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <p>• Tin hiển thị {pkg.days} ngày</p>
              <p>• Hiện trên trang tìm kiếm</p>
              <p>• Thông báo ứng viên phù hợp</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function CheckoutOptions({
  effectiveDays,
  durationDays,
  boostLevel,
  estimatedTotal,
  onDurationChange,
  onBoostChange,
}: {
  effectiveDays: number;
  durationDays: number | null;
  boostLevel: number;
  estimatedTotal: number;
  onDurationChange: (value: number | null) => void;
  onBoostChange: (value: number) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-amber-500" />
          Tùy chọn hiển thị thử nghiệm
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 md:grid-cols-[1fr_1fr_220px]">
        <div className="space-y-2">
          <label className="text-sm font-semibold">Số ngày đăng</label>
          <input
            type="number"
            min={1}
            max={365}
            value={(durationDays ?? effectiveDays) || ""}
            onChange={(event) => onDurationChange(Number(event.target.value) || null)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-[#0E7490]/30"
            placeholder="Chọn gói trước"
          />
          <p className="text-xs text-muted-foreground">Deadline sẽ được tính theo số ngày đăng sau khi thanh toán thành công.</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Boost/top bài đăng</label>
          <div className="grid grid-cols-4 gap-2">
            {[0, 3, 2, 1].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => onBoostChange(level)}
                className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                  boostLevel === level
                    ? "border-[#0E7490] bg-[#0E7490] text-white"
                    : "border-input bg-background hover:bg-muted"
                }`}
              >
                {level === 0 ? "Thường" : `Top ${4 - level}`}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Top 1 ưu tiên cao nhất trên trang việc làm và trang chủ.</p>
        </div>

        <div className="rounded-lg border bg-muted/40 p-4">
          <p className="text-xs text-muted-foreground">Ước tính</p>
          <p className="mt-1 text-2xl font-bold text-[#0E7490]">
            {estimatedTotal ? `${estimatedTotal.toLocaleString("vi-VN")}đ` : "Chọn gói"}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Đăng {effectiveDays || 0} ngày, {boostLevel > 0 ? `Top ${4 - boostLevel}` : "hiển thị thường"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function CheckoutButton({
  disabled,
  loading,
  onClick,
}: {
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex justify-end">
      <Button onClick={onClick} disabled={disabled || loading} className="px-8 py-3 text-base">
        {loading ? (
          <><Loader2 className="mr-2 size-5 animate-spin" /> Đang xử lý...</>
        ) : (
          <><CreditCard className="mr-2 size-5" /> Thanh toán</>
        )}
      </Button>
    </div>
  );
}
