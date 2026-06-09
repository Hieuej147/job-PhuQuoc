"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";

const AUTH_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:3000";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    // Auto-focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (newOtp.every((d) => d !== "") && newOtp.join("").length === 6) {
      handleVerify(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 0) return;

    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    setError("");

    // Focus last filled or next empty
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();

    // Auto-submit if all filled
    if (pasted.length === 6) {
      handleVerify(pasted);
    }
  };

  const handleVerify = async (otpCode: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${AUTH_URL}/api/auth/email-otp/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.message?.includes("too many") || data.message?.includes("exceeded")) {
          setError("Đã hết lượt thử. Vui lòng gửi lại OTP.");
          setCanResend(true);
          setTimer(0);
        } else if (data.message?.includes("expired")) {
          setError("Mã OTP đã hết hạn. Vui lòng gửi lại OTP.");
          setCanResend(true);
          setTimer(0);
        } else {
          setError("Mã OTP không chính xác.");
        }
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/auth/login?verified=true"), 1500);
    } catch {
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setCanResend(false);
    setTimer(60);
    setOtp(["", "", "", "", "", ""]);
    setError("");
    inputRefs.current[0]?.focus();
    try {
      await fetch(`${AUTH_URL}/api/auth/email-otp/send-verification-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "email-verification" }),
      });
    } catch {
      setError("Không thể gửi lại OTP. Vui lòng thử lại.");
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-muted-foreground">Không tìm thấy email. Vui lòng đăng ký lại.</p>
            <Button onClick={() => router.push("/auth/register")}>Đến trang đăng ký</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <div className="size-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="size-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Xác nhận thành công!</h2>
            <p className="text-sm text-muted-foreground">Đang chuyển đến trang đăng nhập...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md flex flex-col gap-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Trang chủ</Link>
          <span>›</span>
          <Link href="/auth/register" className="hover:text-foreground transition-colors">Đăng ký</Link>
          <span>›</span>
          <span className="text-foreground font-semibold">Xác nhận OTP</span>
        </div>

        <Card className="p-8">
          <CardContent className="flex flex-col gap-6 items-center text-center">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="size-8 text-primary" />
            </div>

            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-foreground">Xác nhận email</h1>
              <p className="text-sm text-muted-foreground">
                Mã OTP đã gửi đến <span className="font-semibold text-foreground">{email}</span>
              </p>
            </div>

            {/* OTP Input */}
            <div className="flex gap-2 justify-center">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  className="size-12 text-center text-xl font-bold rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-xl w-full">{error}</div>
            )}

            {/* Loading */}
            {loading && (
              <p className="text-sm text-muted-foreground">Đang xác nhận...</p>
            )}

            {/* Timer / Resend */}
            <div className="flex flex-col gap-2 items-center">
              {!canResend ? (
                <p className="text-sm text-muted-foreground">
                  Gửi lại OTP sau <span className="font-semibold text-foreground">{timer}s</span>
                </p>
              ) : (
                <Button variant="ghost" onClick={handleResend} className="text-sm font-semibold underline">
                  Gửi lại OTP
                </Button>
              )}
            </div>

            {/* Back */}
            <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Quay lại đăng nhập
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Đang tải...</p></div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}
