/**
 * TÊN TRANG: Thanh toán / Chọn Gói Đăng Tin (Checkout Job Package)
 * MÔ TẢ: Hiển thị danh sách các gói đăng tin (Pricing packages) cho nhà tuyển dụng chọn lựa sau khi tạo tin thành công.
 * TƯƠNG TÁC DỮ LIỆU (FE-BE-DB):
 * - GET `/api/v1/pricing`: Lấy danh sách các gói cước từ bảng `Pricing` trong DB.
 * - GET `/api/v1/jobs/:id`: Lấy thông tin tin tuyển dụng vừa tạo để xác nhận.
 * - POST `/api/v1/payments/checkout`: Gửi yêu cầu thanh toán xuống BE để tích hợp cổng thanh toán (ví dụ VNPay, Stripe) hoặc ghi nhận giao dịch vào DB.
 */
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, CheckCircle2, CreditCard } from "lucide-react";

interface PricingPackage {
  id: string;
  name: string;
  days: number;
  price: number;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pkgRes, jobRes] = await Promise.allSettled([
          fetch("/api/v1/pricing?active=true", { credentials: "include" }),
          fetch(`/api/v1/jobs/${jobId}`, { credentials: "include" }),
        ]);

        if (pkgRes.status === "fulfilled" && pkgRes.value.ok) {
          const d = await pkgRes.value.json();
          setPackages(d.data || []);
        }

        if (jobRes.status === "fulfilled" && jobRes.value.ok) {
          const d = await jobRes.value.json();
          setJob(d.data || d);
        }
      } catch {
        setError("Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [jobId]);

  const handleCheckout = async () => {
    if (!selectedPkg) return;

    setCheckoutLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ jobId, packageId: selectedPkg }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || `HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data.data?.url || data.url) {
        window.location.href = data.data?.url || data.url;
      } else {
        router.push(`/employer/jobs`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Thanh toán thất bại");
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#0E7490]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="size-4 mr-1" /> Quay lại
        </Button>
        <h1 className="text-2xl font-bold">Chọn gói đăng tin</h1>
      </div>

      {job && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Tin tuyển dụng</p>
            <p className="font-semibold">{job.title}</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg, i) => (
          <Card
            key={pkg.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedPkg === pkg.id
                ? "border-2 border-[#0E7490] dark:border-[#67e8f9] shadow-lg scale-105"
                : "border border-gray-200 dark:border-gray-700"
            }`}
            onClick={() => setSelectedPkg(pkg.id)}
          >
            <CardContent className="p-6 text-center">
              {i === 1 && (
                <span className="bg-[#F59E0B] text-white text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block">
                  Phổ biến nhất
                </span>
              )}
              <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
              <p className="text-3xl font-bold text-[#0E7490] dark:text-[#67e8f9] mb-1">
                {pkg.price.toLocaleString("vi-VN")}đ
              </p>
              <p className="text-sm text-gray-500 mb-4">{pkg.days} ngày hiển thị</p>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p>• Tin hiển thị {pkg.days} ngày</p>
                <p>• Hiện trên trang tìm kiếm</p>
                <p>• Thông báo ứng viên phù hợp</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleCheckout}
          disabled={!selectedPkg || checkoutLoading}
          className="px-8 py-3 text-base"
        >
          {checkoutLoading ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Đang xử lý...</>
          ) : (
            <><CreditCard className="w-5 h-5 mr-2" /> Thanh toán</>
          )}
        </Button>
      </div>
    </div>
  );
}
