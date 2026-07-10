"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useJobCheckout } from "@/features/employer-jobs/hooks/use-job-checkout";
import { CheckoutButton, CheckoutJobSummary, CheckoutOptions, PackageSelector } from "@/features/employer-jobs/components/checkout-sections";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const checkoutState = useJobCheckout(jobId);

  const handleCheckout = async () => {
    const result = await checkoutState.checkout();
    if (!result) return;
    if (result.url) {
      window.location.href = result.url;
      return;
    }
    router.push("/employer/jobs");
  };

  if (checkoutState.loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#0E7490]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 size-4" /> Quay lại
        </Button>
        <h1 className="text-2xl font-bold">Chọn gói đăng tin</h1>
      </div>

      <CheckoutJobSummary job={checkoutState.job} />

      {checkoutState.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {checkoutState.error}
        </div>
      )}

      <PackageSelector
        packages={checkoutState.packages}
        selectedPkg={checkoutState.selectedPkg}
        onSelect={checkoutState.setSelectedPkg}
      />

      <CheckoutOptions
        effectiveDays={checkoutState.effectiveDays}
        durationDays={checkoutState.durationDays}
        boostLevel={checkoutState.boostLevel}
        estimatedTotal={checkoutState.estimatedTotal}
        onDurationChange={checkoutState.setDurationDays}
        onBoostChange={checkoutState.setBoostLevel}
      />

      <CheckoutButton
        disabled={!checkoutState.selectedPkg || checkoutState.isArchivedJob}
        loading={checkoutState.checkoutLoading}
        onClick={handleCheckout}
      />
    </div>
  );
}
