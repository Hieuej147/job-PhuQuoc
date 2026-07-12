"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiGet, apiPost } from "@/lib/api-client";

interface QuotaCheckoutResponse {
  purchase: {
    id: string;
    gatewayRef: string;
    targetPlan: string;
    durationMonths: number;
    amount: number;
    status: string;
    package?: { name: string; durationMonths: number; price: number } | null;
  };
  plans: {
    candidatePlan: string;
    employerPlan: string;
    candidatePlanExpiresAt?: string | null;
    employerPlanExpiresAt?: string | null;
  };
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

function formatDate(value?: string | null) {
  if (!value) return "Chưa có";
  return new Date(value).toLocaleDateString("vi-VN");
}

export default function QuotaCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const sessionId = searchParams.get("session_id") || "";
  const [checkout, setCheckout] = useState<QuotaCheckoutResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [payerName, setPayerName] = useState("");
  const [cardNumber, setCardNumber] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    apiGet<QuotaCheckoutResponse>(`/api/v1/quota/checkout/${encodeURIComponent(sessionId)}`)
      .then(setCheckout)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Không tải được checkout quota"))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const currentExpiry = useMemo(() => {
    if (!checkout) return null;
    return checkout.purchase.targetPlan.startsWith("CANDIDATE_")
      ? checkout.plans.candidatePlanExpiresAt
      : checkout.plans.employerPlanExpiresAt;
  }, [checkout]);

  const handleComplete = async () => {
    if (!sessionId) return;
    if (!payerName.trim() || cardNumber.replace(/\s/g, "").length < 8) {
      toast.error("Vui lòng nhập tên thanh toán và số thẻ mock hợp lệ.");
      return;
    }
    setSubmitting(true);
    try {
      await apiPost("/api/v1/quota/mock-complete", { sessionId });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["quota"] }),
      ]);
      toast.success("Thanh toán mock thành công. Gói quota đã được cập nhật.");
      router.push(checkout?.purchase.targetPlan.startsWith("EMPLOYER_") ? "/employer/dashboard" : "/candidate/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Thanh toán quota thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#0E7490]" />
      </div>
    );
  }

  if (!checkout) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="font-semibold">Không tìm thấy phiên thanh toán quota.</p>
            <Button className="mt-4" variant="outline" onClick={() => router.back()}>
              Quay lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pkg = checkout.purchase.package;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 size-4" /> Quay lại
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Thanh toán nâng gói quota</h1>
          <p className="text-sm text-muted-foreground">Mock checkout dùng cho demo/local, chưa trừ tiền thật.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="size-5 text-[#0E7490]" /> Thông tin thanh toán mock
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Tên trên thẻ</label>
              <Input value={payerName} onChange={(event) => setPayerName(event.target.value)} placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Số thẻ mock</label>
              <Input value={cardNumber} onChange={(event) => setCardNumber(event.target.value)} placeholder="4242 4242 4242 4242" />
            </div>
            <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
              <ShieldCheck className="mb-2 size-5 text-emerald-500" />
              Đây là form mock giống flow thanh toán đăng tin. Không gửi thông tin thẻ tới Stripe thật trong phase này.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tóm tắt gói</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Gói nâng cấp</p>
              <p className="text-lg font-bold">{pkg?.name || checkout.purchase.targetPlan}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Thời hạn</p>
                <p className="font-semibold">{checkout.purchase.durationMonths} tháng</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Hết hạn hiện tại</p>
                <p className="font-semibold">{formatDate(currentExpiry)}</p>
              </div>
            </div>
            <div className="rounded-xl bg-[#0E7490]/10 p-4">
              <p className="text-sm text-muted-foreground">Tổng thanh toán</p>
              <p className="text-3xl font-bold text-[#0E7490]">{formatMoney(checkout.purchase.amount)}</p>
            </div>
            <Button className="w-full" size="lg" onClick={handleComplete} disabled={submitting || checkout.purchase.status === "COMPLETED"}>
              {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle2 className="mr-2 size-4" />}
              {checkout.purchase.status === "COMPLETED" ? "Đã thanh toán" : "Hoàn tất thanh toán mock"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
