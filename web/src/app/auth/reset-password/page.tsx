"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const AUTH_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:3000";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passErr, setPassErr] = useState("");
  const [confirmErr, setConfirmErr] = useState("");
  const [success, setSuccess] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer <= 0) { setCanResend(true); return; }
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

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
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
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
    for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];
    setOtp(newOtp);
    setError("");
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const getStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strengthColors = ["bg-red-500", "bg-yellow-500", "bg-teal-500", "bg-[#0E7490]"];
  const strengthLabels = ["Rất yếu", "Yếu", "Trung bình", "Mạnh"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPassErr("");
    setConfirmErr("");

    const otpCode = otp.join("");
    if (otpCode.length !== 6) { setError("Vui lòng nhập đầy đủ 6 số OTP"); return; }
    if (password.length < 8) { setPassErr("Mật khẩu phải có ít nhất 8 ký tự"); return; }
    if (password !== confirmPass) { setConfirmErr("Mật khẩu xác nhận không khớp"); return; }

    setLoading(true);
    try {
      const res = await fetch(`${AUTH_URL}/api/auth/email-otp/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode, password }),
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
          setError(data.message || "Mã OTP không chính xác.");
        }
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/auth/login?reset=true"), 2000);
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
      await fetch(`${AUTH_URL}/api/auth/email-otp/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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
            <p className="text-sm text-muted-foreground">Không tìm thấy email. Vui lòng thử lại.</p>
            <Button onClick={() => router.push("/auth/forgot-password")}>Quay lại</Button>
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
            <h2 className="text-xl font-bold text-foreground">Đặt lại mật khẩu thành công!</h2>
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
          <Link href="/auth/login" className="hover:text-foreground transition-colors">Đăng nhập</Link>
          <span>›</span>
          <span className="text-foreground font-semibold">Đặt lại mật khẩu</span>
        </div>

        <Card className="p-8">
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-1 text-center">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Lock className="size-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Đặt lại mật khẩu</h1>
              <p className="text-sm text-muted-foreground">
                Nhập OTP gửi đến <span className="font-semibold text-foreground">{email}</span> và mật khẩu mới
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-xl">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* OTP Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-muted-foreground">Mã OTP <span className="text-destructive">*</span></label>
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
                {!canResend ? (
                  <p className="text-xs text-muted-foreground text-center">Gửi lại OTP sau <span className="font-semibold">{timer}s</span></p>
                ) : (
                  <button type="button" onClick={handleResend} className="text-xs text-primary font-semibold hover:opacity-70 transition-opacity text-center">
                    Gửi lại OTP
                  </button>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-muted-foreground">Mật khẩu mới <span className="text-destructive">*</span></label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setPassErr(""); }} placeholder="Tối thiểu 8 ký tự..." className="pl-10 pr-10 h-11" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-1.5">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="flex-1 h-1 rounded-full bg-border overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all", i < getStrength() ? strengthColors[Math.min(getStrength() - 1, 3)] : "w-0")} style={{ width: i < getStrength() ? "100%" : "0%" }} />
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground">Độ bảo mật: {strengthLabels[Math.min(getStrength(), 3)] || "Rất mạnh"}</p>
                  </div>
                )}
                {passErr && <p className="text-destructive text-xs">{passErr}</p>}
              </div>

              {/* Confirm password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-muted-foreground">Xác nhận mật khẩu <span className="text-destructive">*</span></label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input type={showConfirm ? "text" : "password"} value={confirmPass} onChange={(e) => { setConfirmPass(e.target.value); setConfirmErr(""); }} placeholder="Nhập lại mật khẩu..." className="pl-10 pr-10 h-11" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {confirmErr && <p className="text-destructive text-xs">{confirmErr}</p>}
              </div>

              <Button type="submit" className="w-full h-11 font-bold" disabled={loading}>
                {loading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
              </Button>
            </form>

            <div className="text-center">
              <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="size-4" /> Quay lại đăng nhập
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Đang tải...</p></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
