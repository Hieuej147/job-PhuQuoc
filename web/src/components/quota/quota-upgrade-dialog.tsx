"use client";

import { Crown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiGet, apiPost } from "@/lib/api-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface QuotaUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource?: string;
  used?: number;
  limit?: number;
}

const resourceLabel: Record<string, string> = {
  candidateApplications: "đơn ứng tuyển",
  candidateResumes: "CV",
  savedJobs: "việc làm đã lưu",
  savedCompanies: "công ty theo dõi",
  employerJobs: "tin tuyển dụng",
  employerActiveJobs: "tin đang chạy",
  employerDurationDaysMax: "số ngày đăng tin",
  employerBoostLevelMax: "mức nổi bật",
  applicationMessages: "tin nhắn trong đơn ứng tuyển",
};

interface QuotaPackage {
  id: string;
  name: string;
  targetPlan: string;
  durationMonths: number;
  price: number;
}

export function QuotaUpgradeDialog({ open, onOpenChange, resource, used, limit }: QuotaUpgradeDialogProps) {
  const queryClient = useQueryClient();
  const [upgrading, setUpgrading] = useState(false);
  const [packages, setPackages] = useState<QuotaPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const label = resource ? resourceLabel[resource] || resource : "dung lượng";
  const upgradePlan = resource?.startsWith("employer") ? "EMPLOYER_PRO" : "CANDIDATE_PLUS";

  useEffect(() => {
    if (!open) return;
    apiGet<QuotaPackage[]>("/api/v1/quota/packages")
      .then((list) => {
        const normalized = Array.isArray(list) ? list : [];
        setPackages(normalized);
        const first = normalized.find((item: QuotaPackage) => item.targetPlan === upgradePlan);
        setSelectedPackageId(first?.id ?? "");
      })
      .catch(() => setPackages([]));
  }, [open, upgradePlan]);

  const availablePackages = useMemo(
    () => packages.filter((item) => item.targetPlan === upgradePlan),
    [packages, upgradePlan],
  );

  const handleUpgrade = async () => {
    if (!selectedPackageId) {
      toast.error("Vui lòng chọn gói nâng cấp.");
      return;
    }
    setUpgrading(true);
    try {
      const checkoutBody = await apiPost<{ sessionId?: string }>("/api/v1/quota/checkout", {
        packageId: selectedPackageId,
      });
      const sessionId = checkoutBody.sessionId;
      if (!sessionId) throw new Error("Thiếu session thanh toán quota");

      await apiPost("/api/v1/quota/mock-complete", { sessionId });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["quota"] }),
      ]);
      toast.success("Đã nâng gói quota demo");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể nâng gói quota");
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Dung lượng đã đầy
          </DialogTitle>
          <DialogDescription>
            Bạn đã chạm giới hạn {label}
            {typeof used === "number" && typeof limit === "number" ? ` (${used}/${limit}).` : "."}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          Chọn thời hạn gói demo. Phase này dùng mock payment, chưa cần Stripe thật.
        </div>
        <div className="grid gap-2">
          {availablePackages.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedPackageId(item.id)}
              className={`rounded-lg border px-4 py-3 text-left text-sm transition ${
                selectedPackageId === item.id
                  ? "border-[#005a71] bg-[#005a71]/10"
                  : "border-border hover:bg-muted"
              }`}
            >
              <div className="font-semibold">{item.name}</div>
              <div className="text-xs text-muted-foreground">
                {item.durationMonths} tháng - {new Intl.NumberFormat("vi-VN").format(item.price)} VNĐ
              </div>
            </button>
          ))}
          {availablePackages.length === 0 && (
            <div className="rounded-lg border px-4 py-3 text-sm text-muted-foreground">
              Chưa có package nâng cấp phù hợp.
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={upgrading}>
            Để sau
          </Button>
          <Button type="button" onClick={handleUpgrade} disabled={upgrading}>
            {upgrading ? "Đang nâng..." : "Nâng gói demo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
