"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { apiPost } from "@/lib/api-client";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");
  const jobId = searchParams.get("jobId");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const completePayment = async () => {
      try {
        const data = await apiPost<{ message?: string }>("/api/v1/payments/mock-complete", { jobId, sessionId });
        setStatus("success");
        setMessage(data.message || "Thanh toán thành công! Tin tuyển dụng đã được kích hoạt.");
      } catch (error) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Không thể kết nối server.");
      }
    };

    if (jobId || sessionId) {
      completePayment();
    } else {
      setStatus("error");
      setMessage("Thiếu thông tin đơn hàng.");
    }
  }, [jobId, sessionId]);

  return (
    <div className="min-h-screen bg-[#f7f9ff] dark:bg-[#071a2b] flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="w-16 h-16 animate-spin text-[#0E7490] mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Đang xác nhận thanh toán...</h2>
              <p className="text-gray-500">Vui lòng đợi trong giây lát.</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2 text-green-700 dark:text-green-400">Thanh toán thành công!</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => router.push("/employer/jobs")} className="bg-[#0E7490] hover:bg-[#005a71]">
                  Xem tin tuyển dụng
                </Button>
                <Button variant="outline" onClick={() => router.push("/employer/dashboard")}>
                  Dashboard
                </Button>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2 text-red-700 dark:text-red-400">Thanh toán thất bại</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
              <Button onClick={() => router.push("/employer/jobs")} variant="outline">
                Quay lại
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Spinner size="lg" /></div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
