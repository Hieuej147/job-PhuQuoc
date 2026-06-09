"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Mail, Lock } from "lucide-react";
import { createAuthClient } from "better-auth/client";

const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:3000",
});

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailErr, setEmailErr] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailErr("");

    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailReg.test(email)) { setEmailErr("Email không hợp lệ"); return; }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:3000"}/api/auth/email-otp/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.message?.includes("not found") || data.message?.includes("no user")) {
          setError("Email không tồn tại trong hệ thống.");
        } else if (data.message?.includes("google") || data.message?.includes("social")) {
          setError("Tài khoản này đăng ký bằng Google. Vui lòng đăng nhập với Google.");
        } else {
          setError(data.message || "Không thể gửi OTP. Vui lòng thử lại.");
        }
        return;
      }
      router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
    } catch {
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await authClient.signIn.social({ provider: "google", callbackURL: `${window.location.origin}/auth/callback` });
    } catch {
      setError("Đăng nhập Google thất bại");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md flex flex-col gap-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Trang chủ</Link>
          <span>›</span>
          <Link href="/auth/login" className="hover:text-foreground transition-colors">Đăng nhập</Link>
          <span>›</span>
          <span className="text-foreground font-semibold">Quên mật khẩu</span>
        </div>

        <Card className="p-8">
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-1 text-center">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Lock className="size-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Quên mật khẩu?</h1>
              <p className="text-sm text-muted-foreground">Nhập email để nhận mã OTP đặt lại mật khẩu</p>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-xl">{error}</div>
            )}

            {/* Google login suggestion */}
            {error.includes("Google") && (
              <Button variant="outline" className="w-full h-11 gap-3 font-semibold" onClick={handleGoogleLogin}>
                <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
                Đăng nhập với Google
              </Button>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-muted-foreground">Email <span className="text-destructive">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setEmailErr(""); setError(""); }} placeholder="email@example.com" className="pl-10 h-11" />
                </div>
                {emailErr && <p className="text-destructive text-xs">{emailErr}</p>}
              </div>

              <Button type="submit" className="w-full h-11 font-bold" disabled={loading}>
                {loading ? "Đang gửi..." : "Gửi mã OTP"}
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
