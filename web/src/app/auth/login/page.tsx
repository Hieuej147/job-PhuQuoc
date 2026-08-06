"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Briefcase,
  CheckCircle,
} from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { GoogleButton } from "@/components/auth/google-button";
import { signIn, sendVerificationOtp } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailErr, setEmailErr] = useState("");
  const [passErr, setPassErr] = useState("");
  const toastShownRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    const redirect = searchParams.get("redirect");
    const role = user.role;
    if (!role) router.replace("/auth/select-role");
    else if (redirect) router.replace(redirect);
    else if (role === "EMPLOYER") router.replace("/employer/dashboard");
    else if (role === "ADMIN") router.replace("/");
    else router.replace("/candidate/dashboard");
  }, [router, user, searchParams]);

  useEffect(() => {
    if (toastShownRef.current) return;
    if (searchParams.get("verified") === "true") {
      toastShownRef.current = true;
      toast.success("Xác nhận email thành công! Vui lòng đăng nhập.");
    }
    if (searchParams.get("reset") === "true") {
      toastShownRef.current = true;
      toast.success("Đặt lại mật khẩu thành công! Vui lòng đăng nhập.");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailErr("");
    setPassErr("");

    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let ok = true;
    if (!emailReg.test(email)) {
      setEmailErr("Email không hợp lệ");
      ok = false;
    }
    if (password.length < 6) {
      setPassErr("Mật khẩu phải có ít nhất 6 ký tự");
      ok = false;
    }
    if (!ok) return;

    setLoading(true);
    try {
      const session = await signIn(email, password);
      const role = session.user?.role;
      setUser(session.user);
      toast.success("Đăng nhập thành công!");
      const redirect = searchParams.get("redirect");
      if (!role) router.push("/auth/select-role");
      else if (redirect) router.push(redirect);
      else if (role === "EMPLOYER") router.push("/employer/dashboard");
      else if (role === "ADMIN") router.push("/");
      else router.push("/candidate/dashboard");
    } catch (err: unknown) {
      const msg = (err as Error).message || "";
      if (
        msg.toLowerCase().includes("not verified") ||
        msg.toLowerCase().includes("email not verified")
      ) {
        try {
          await sendVerificationOtp(email);
          router.push(
            `/auth/verify-otp?email=${encodeURIComponent(email)}&mode=verify-email&next=login`,
          );
        } catch {
          toast.error("Không thể gửi OTP. Vui lòng thử lại.");
        }
        return;
      }
      toast.error("Sai mật khẩu hoặc tài khoản");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/auth/callback`,
      });
    } catch (err: unknown) {
      toast.error((err as Error).message || "Đăng nhập Google thất bại");
    }
  };

  return (
    <AuthLayout
      breadcrumb={[{ label: "Trang chủ", href: "/" }, { label: "Đăng nhập" }]}
    >
      <div className="bg-primary-foreground rounded-3xl border border-primary shadow-xl p-8 animate-in delay-100">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Chào mừng trở lại! 👋</h1>
          <p className="text-sm text-muted-foreground">
            Đăng nhập để tiếp tục hành trình tìm việc
          </p>
        </div>

        <div className="space-y-3 mb-5 animate-in delay-200">
          <GoogleButton
            onClick={handleGoogleLogin}
            label="Đăng nhập với Google"
          />
        </div>

        <div className="flex items-center gap-3 mb-5">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            hoặc đăng nhập bằng email
          </span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={handleLogin} className="space-y-4 animate-in delay-300">
          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-1.5">
              Email <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailErr("");
                }}
                placeholder="email@example.com"
                className="pl-10 h-11 rounded-xl bg-[#f7f9ff]"
              />
            </div>
            {emailErr && (
              <p className="text-destructive text-xs mt-1">{emailErr}</p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-semibold text-muted-foreground">
                Mật khẩu <span className="text-destructive">*</span>
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-primary font-semibold hover:opacity-70 transition-opacity"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPassErr("");
                }}
                placeholder="Nhập mật khẩu..."
                className="pl-10 pr-10 h-11 rounded-xl bg-[#f7f9ff]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {passErr && (
              <p className="text-destructive text-xs mt-1">{passErr}</p>
            )}
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer group">
            <div
              onClick={() => setRemember(!remember)}
              className={`size-5 rounded-md border-2 flex items-center justify-center transition-colors ${remember ? "border-primary bg-primary" : "border-border"}`}
            >
              {remember && (
                <CheckCircle className="size-3 text-primary-foreground" />
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              Ghi nhớ đăng nhập
            </span>
          </label>

          <Button
            type="submit"
            className="w-full h-11 font-bold rounded-xl bg-primary hover:bg-primary/80 shadow-md transition-all active:scale-[.98]"
            disabled={loading}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Chưa có tài khoản?
          <Link
            href="/auth/register"
            className="text-primary font-bold hover:opacity-70 transition-opacity ml-1"
          >
            Đăng ký ngay →
          </Link>
        </p>

        <div className="mt-5 p-3.5 rounded-xl bg-[#0E7490]/8 border border-[#0E7490]/20 flex items-center gap-3">
          <Briefcase className="size-5 text-[#0E7490] flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            Bạn là nhà tuyển dụng?
            <Link
              href="/auth/register"
              className="text-primary font-semibold hover:opacity-70 ml-1"
            >
              Đăng ký tại đây →
            </Link>
          </p>
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" /> Về trang chủ
        </Link>
      </div>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Spinner size="lg" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
