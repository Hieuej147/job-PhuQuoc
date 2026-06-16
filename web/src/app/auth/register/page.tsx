"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  User,
  Building2,
  CheckCircle,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthLayout } from "@/components/auth/auth-layout";
import { GoogleButton } from "@/components/auth/google-button";
import { authClient } from "@/lib/auth-client";
import {
  registerEmail,
  savePendingRegisterPassword,
} from "@/lib/auth-registration";
import { toast } from "sonner";

type Role = "CANDIDATE" | "EMPLOYER";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role>("CANDIDATE");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nameErr, setNameErr] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [passErr, setPassErr] = useState("");
  const [confirmErr, setConfirmErr] = useState("");

  const totalSteps = role === "EMPLOYER" ? 4 : 3;

  const validateStep2 = () => {
    let ok = true;
    if (!name.trim()) {
      setNameErr("Vui lòng nhập họ tên");
      ok = false;
    } else setNameErr("");
    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailReg.test(email)) {
      setEmailErr("Email không hợp lệ");
      ok = false;
    } else setEmailErr("");
    return ok;
  };

  const validatePassword = () => {
    let ok = true;
    if (password.length < 8) {
      setPassErr("Mật khẩu phải có ít nhất 8 ký tự");
      ok = false;
    } else setPassErr("");
    if (password !== confirmPass) {
      setConfirmErr("Mật khẩu xác nhận không khớp");
      ok = false;
    } else setConfirmErr("");
    if (!terms) {
      toast.error("Vui lòng đồng ý với điều khoản sử dụng");
      ok = false;
    }
    return ok;
  };

  const goNext = () => {
    if (step === 1) {
      setStep(2);
      return;
    }
    if (step === 2 && validateStep2()) {
      setStep(role === "EMPLOYER" ? 3 : 3);
      return;
    }
    if (step === 3 && role === "EMPLOYER") {
      setStep(4);
      return;
    }
  };

  const goBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3 && role === "EMPLOYER") setStep(2);
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(3);
  };

  const handleRegister = async () => {
    if (!validatePassword()) return;
    setLoading(true);
    try {
      await registerEmail({
        name,
        email,
        password,
        role,
        phone: phone || undefined,
      });

      savePendingRegisterPassword(email, password);
      toast.success("Đăng ký thành công! Vui lòng xác nhận email.");
      router.push(
        `/auth/verify-otp?email=${encodeURIComponent(email)}&mode=register`,
      );
    } catch (err: unknown) {
      const msg = (err as Error).message || "";
      if (
        msg.toLowerCase().includes("already exists") ||
        msg.toLowerCase().includes("user already")
      ) {
        toast.error(
          "Email đã tồn tại. Vui lòng dùng email khác hoặc đăng nhập.",
        );
      } else {
        toast.error(msg || "Đăng ký thất bại");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/auth/callback`,
      });
    } catch (err: unknown) {
      toast.error((err as Error).message || "Đăng ký Google thất bại");
    }
  };

  const getStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strengthColors = [
    "bg-red-500",
    "bg-yellow-500",
    "bg-teal-500",
    "bg-[#0E7490]",
  ];
  const strengthLabels = ["Rất yếu", "Yếu", "Trung bình", "Mạnh"];

  const stepsGuide = [
    { n: 1, label: "Chọn vai trò", sub: "Ứng viên hoặc nhà tuyển dụng" },
    { n: 2, label: "Thông tin cơ bản", sub: "Tên, email, số điện thoại" },
    {
      n: role === "EMPLOYER" ? 3 : 3,
      label: role === "EMPLOYER" ? "Thông tin công ty" : "Thiết lập mật khẩu",
      sub: role === "EMPLOYER" ? "Tên, ngành, quy mô..." : "Bảo mật tài khoản",
    },
    ...(role === "EMPLOYER"
      ? [{ n: 4, label: "Thiết lập mật khẩu", sub: "Bảo mật tài khoản" }]
      : []),
  ];

  return (
    <AuthLayout
      breadcrumb={[{ label: "Trang chủ", href: "/" }, { label: "Đăng ký" }]}
      maxWidth="lg"
      stepsGuide={stepsGuide}
      currentStep={step}
    >
      {/* Card */}
      <div className="bg-primary-foreground rounded-3xl border border-primary shadow-xl p-8 animate-in delay-100">
        <div className="flex flex-col gap-5">
          {/* Header */}
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-secondary-foreground mb-1">
              Tạo tài khoản mới 🚀
            </h1>
            <p className="text-sm text-muted-foreground">
              Tham gia PQJobs — kết nối với việc làm Phú Quốc
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <div key={s} className="contents">
                {s > 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 rounded-full transition-colors",
                      s <= step ? "bg-[#0D9488]" : "bg-border",
                    )}
                  />
                )}
                <div
                  className={cn(
                    "size-3 rounded-full transition-all",
                    s < step
                      ? "bg-[#0D9488]"
                      : s === step
                        ? "bg-[#0E7490] scale-125"
                        : "bg-border",
                  )}
                />
              </div>
            ))}
            <span className="ml-2 text-xs text-muted-foreground whitespace-nowrap">
              Bước {step}/{totalSteps}
            </span>
          </div>

          {/* STEP 1: Role selection */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <GoogleButton
                onClick={handleGoogleRegister}
                label="Đăng ký với Google"
              />

              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  hoặc đăng ký bằng email
                </span>
                <Separator className="flex-1" />
              </div>

              {/* Role selection */}
              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-muted-foreground">
                  Bạn muốn dùng PQJobs với tư cách?{" "}
                  <span className="text-destructive">*</span>
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      value: "CANDIDATE" as Role,
                      icon: User,
                      label: "Ứng viên",
                      desc: "Tìm việc làm",
                    },
                    {
                      value: "EMPLOYER" as Role,
                      icon: Building2,
                      label: "Nhà tuyển dụng",
                      desc: "Đăng tuyển dụng",
                    },
                  ].map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setRole(r.value)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all cursor-pointer",
                        role === r.value
                          ? "border-[#0E7490] bg-[#0E7490]/7"
                          : "border-border hover:border-[#0E7490]/50 bg-background",
                      )}
                    >
                      <div
                        className={cn(
                          "size-12 rounded-2xl flex items-center justify-center",
                          role === r.value ? "bg-[#0E7490]/15" : "bg-muted",
                        )}
                      >
                        <r.icon
                          className={cn(
                            "size-6",
                            role === r.value
                              ? "text-[#0E7490]"
                              : "text-muted-foreground",
                          )}
                        />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-sm text-foreground">
                          {r.label}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {r.desc}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "size-5 rounded-full border-2 flex items-center justify-center",
                          role === r.value
                            ? "border-[#0E7490] bg-[#0E7490]"
                            : "border-border",
                        )}
                      >
                        {role === r.value && (
                          <CheckCircle className="size-3 text-white" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={goNext}
                className="w-full h-11 font-bold rounded-xl text-secondary-foreground bg-[#0E7490] hover:bg-[#005a71] shadow-md"
              >
                Tiếp tục →
              </Button>
            </div>
          )}

          {/* STEP 2: Personal info */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold text-muted-foreground">
                Điền thông tin tài khoản
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-muted-foreground">
                  Họ và tên <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setNameErr("");
                    }}
                    placeholder="Nguyễn Văn A"
                    className="pl-10 h-11 rounded-xl bg-[#f7f9ff]"
                  />
                </div>
                {nameErr && (
                  <p className="text-destructive text-xs">{nameErr}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-muted-foreground">
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
                  <p className="text-destructive text-xs">{emailErr}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-muted-foreground">
                  Số điện thoại{" "}
                  <span className="text-xs font-normal">(tuỳ chọn)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912 345 678"
                    className="pl-10 h-11 rounded-xl bg-[#f7f9ff]"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={goBack}
                  className="flex-1 h-11 font-bold rounded-xl"
                >
                  ← Quay lại
                </Button>
                <Button
                  onClick={goNext}
                  className="flex-1 h-11 font-bold text-secondary-foreground rounded-xl bg-[#0E7490] hover:bg-[#005a71] shadow-md"
                >
                  Tiếp tục →
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Password */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold text-muted-foreground">
                Thiết lập mật khẩu
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-muted-foreground">
                  Mật khẩu <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPassErr("");
                    }}
                    placeholder="Tối thiểu 8 ký tự..."
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
                {password.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-1.5">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="flex-1 h-1 rounded-full bg-border overflow-hidden"
                        >
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              i < getStrength()
                                ? strengthColors[Math.min(getStrength() - 1, 3)]
                                : "w-0",
                            )}
                            style={{ width: i < getStrength() ? "100%" : "0%" }}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Độ bảo mật:{" "}
                      {strengthLabels[Math.min(getStrength(), 3)] || "Rất mạnh"}
                    </p>
                  </div>
                )}
                {passErr && (
                  <p className="text-destructive text-xs">{passErr}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-muted-foreground">
                  Xác nhận mật khẩu <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPass}
                    onChange={(e) => {
                      setConfirmPass(e.target.value);
                      setConfirmErr("");
                    }}
                    placeholder="Nhập lại mật khẩu..."
                    className="pl-10 pr-10 h-11 rounded-xl bg-[#f7f9ff]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirm ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {confirmErr && (
                  <p className="text-destructive text-xs">{confirmErr}</p>
                )}
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div
                  onClick={() => setTerms(!terms)}
                  className={cn(
                    "size-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                    terms ? "border-primary bg-primary" : "border-border",
                  )}
                >
                  {terms && (
                    <CheckCircle className="size-3 text-primary-foreground" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Tôi đồng ý với{" "}
                  <span className="text-primary font-semibold hover:opacity-70">
                    Điều khoản sử dụng
                  </span>{" "}
                  và{" "}
                  <span className="text-primary font-semibold hover:opacity-70">
                    Chính sách bảo mật
                  </span>{" "}
                  của PQJobs
                </span>
              </label>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={goBack}
                  className="flex-1 h-11 font-bold rounded-xl"
                >
                  ← Quay lại
                </Button>
                <Button
                  onClick={handleRegister}
                  disabled={loading}
                  className="flex-1 h-11 font-bold rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-white shadow-md"
                >
                  {loading ? "Đang tạo..." : "Tạo tài khoản 🎉"}
                </Button>
              </div>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link
              href="/auth/login"
              className="text-primary font-bold hover:opacity-70 transition-opacity ml-1"
            >
              Đăng nhập →
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
