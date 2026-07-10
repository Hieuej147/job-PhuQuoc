"use client";

import { useEffect, useMemo, useState } from "react";
import { createPaymentCheckout, getManagedJob, getPricingPackages } from "../api";
import type { EmployerJob, PricingPackage } from "../types";

export function useJobCheckout(jobId: string) {
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const [durationDays, setDurationDays] = useState<number | null>(null);
  const [boostLevel, setBoostLevel] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<EmployerJob | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      try {
        const [pkgResult, jobResult] = await Promise.allSettled([
          getPricingPackages(),
          getManagedJob(jobId),
        ]);
        if (!mounted) return;
        if (pkgResult.status === "fulfilled") setPackages(pkgResult.value);
        if (jobResult.status === "fulfilled") setJob(jobResult.value);
      } catch {
        if (mounted) setError("Không thể tải dữ liệu");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void fetchData();
    return () => {
      mounted = false;
    };
  }, [jobId]);

  const selectedPackage = packages.find((pkg) => pkg.id === selectedPkg);
  const effectiveDays = durationDays || selectedPackage?.days || 0;
  const listingAmount = selectedPackage && effectiveDays
    ? Math.round((selectedPackage.price / selectedPackage.days) * effectiveDays)
    : 0;
  const boostAmount = boostLevel * 50000 * effectiveDays;
  const estimatedTotal = listingAmount + boostAmount;
  const isArchivedJob = Boolean(job?.archivedAt);

  const checkout = async () => {
    if (!selectedPkg) return null;
    setCheckoutLoading(true);
    setError(null);
    try {
      return await createPaymentCheckout({
        jobId,
        packageId: selectedPkg,
        durationDays: durationDays ?? undefined,
        boostLevel,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thanh toán thất bại");
      return null;
    } finally {
      setCheckoutLoading(false);
    }
  };

  return useMemo(() => ({
    packages,
    selectedPkg,
    setSelectedPkg,
    durationDays,
    setDurationDays,
    boostLevel,
    setBoostLevel,
    loading,
    checkoutLoading,
    error,
    job,
    selectedPackage,
    effectiveDays,
    estimatedTotal,
    isArchivedJob,
    checkout,
  }), [packages, selectedPkg, durationDays, boostLevel, loading, checkoutLoading, error, job, selectedPackage, effectiveDays, estimatedTotal, isArchivedJob]);
}
