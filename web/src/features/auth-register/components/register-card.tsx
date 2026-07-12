"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { Building2, CheckCircle, Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { GoogleButton } from "@/components/auth/google-button";
import { cn } from "@/lib/utils";
import { useRegisterForm } from "../hooks/use-register-form";
import type { RegisterRole } from "../types";

const strengthColors = ["bg-red-500", "bg-yellow-500", "bg-teal-500", "bg-[#0E7490]"];
const strengthLabels = ["Rất yếu", "Yếu", "Trung bình", "Mạnh"];

export function RegisterCard({ form }: { form: ReturnType<typeof useRegisterForm> }) {
  return (
    <div className="animate-in rounded-3xl border border-primary bg-primary-foreground p-8 shadow-xl delay-100">
      <div className="flex flex-col gap-5">
        <RegisterHeader />
        <StepIndicator step={form.step} totalSteps={form.totalSteps} />

        {form.step === 1 && <RoleStep form={form} />}
        {form.step === 2 && <ProfileStep form={form} />}
        {form.step === 3 && <PasswordStep form={form} />}

        <p className="text-center text-sm text-muted-foreground">
          Đã có tài khoản?{" "}
          <Link href="/auth/login" className="ml-1 font-bold text-primary transition-opacity hover:opacity-70">
            Đăng nhập →
          </Link>
        </p>
      </div>
    </div>
  );
}

function RegisterHeader() {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="mb-1 text-2xl font-bold text-secondary-foreground">Tạo tài khoản mới 🚀</h1>
      <p className="text-sm text-muted-foreground">Tham gia PQJobs — kết nối với việc làm Phú Quốc</p>
    </div>
  );
}

function StepIndicator({ step, totalSteps }: { step: number; totalSteps: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }, (_, index) => index + 1).map((item) => (
        <div key={item} className="contents">
          {item > 1 && (
            <div className={cn("h-0.5 flex-1 rounded-full transition-colors", item <= step ? "bg-[#0D9488]" : "bg-border")} />
          )}
          <div
            className={cn(
              "size-3 rounded-full transition-all",
              item < step ? "bg-[#0D9488]" : item === step ? "scale-125 bg-[#0E7490]" : "bg-border",
            )}
          />
        </div>
      ))}
      <span className="ml-2 whitespace-nowrap text-xs text-muted-foreground">Bước {step}/{totalSteps}</span>
    </div>
  );
}

function RoleStep({ form }: { form: ReturnType<typeof useRegisterForm> }) {
  const roles = [
    { value: "CANDIDATE" as RegisterRole, icon: User, label: "Ứng viên", desc: "Tìm việc làm" },
    { value: "EMPLOYER" as RegisterRole, icon: Building2, label: "Nhà tuyển dụng", desc: "Đăng tuyển dụng" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <GoogleButton onClick={form.handleGoogleRegister} label="Đăng ký với Google" />
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="whitespace-nowrap text-xs text-muted-foreground">hoặc đăng ký bằng email</span>
        <Separator className="flex-1" />
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-muted-foreground">
          Bạn muốn dùng PQJobs với tư cách? <span className="text-destructive">*</span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          {roles.map((role) => (
            <button
              key={role.value}
              type="button"
              onClick={() => form.setRole(role.value)}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 p-5 transition-all",
                form.role === role.value ? "border-[#0E7490] bg-[#0E7490]/7" : "border-border bg-background hover:border-[#0E7490]/50",
              )}
            >
              <div className={cn("flex size-12 items-center justify-center rounded-2xl", form.role === role.value ? "bg-[#0E7490]/15" : "bg-muted")}>
                <role.icon className={cn("size-6", form.role === role.value ? "text-[#0E7490]" : "text-muted-foreground")} />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">{role.label}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{role.desc}</p>
              </div>
              <div className={cn("flex size-5 items-center justify-center rounded-full border-2", form.role === role.value ? "border-[#0E7490] bg-[#0E7490]" : "border-border")}>
                {form.role === role.value && <CheckCircle className="size-3 text-white" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      <Button onClick={form.goNext} className="h-11 w-full rounded-xl bg-[#0E7490] font-bold text-secondary-foreground shadow-md hover:bg-[#005a71]">
        Tiếp tục →
      </Button>
    </div>
  );
}

function ProfileStep({ form }: { form: ReturnType<typeof useRegisterForm> }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold text-muted-foreground">Điền thông tin tài khoản</p>
      <TextField icon={User} label="Họ và tên" required value={form.name} error={form.errors.name} placeholder="Nguyễn Văn A" onChange={(value) => { form.setName(value); form.setFieldError("name", ""); }} />
      <TextField icon={Mail} label="Email" required type="email" value={form.email} error={form.errors.email} placeholder="email@example.com" onChange={(value) => { form.setEmail(value); form.setFieldError("email", ""); }} />
      <TextField icon={Phone} label="Số điện thoại" value={form.phone} placeholder="0912 345 678" hint="(tuỳ chọn)" onChange={form.setPhone} />
      <StepButtons onBack={form.goBack} onNext={form.goNext} nextLabel="Tiếp tục →" />
    </div>
  );
}

function PasswordStep({ form }: { form: ReturnType<typeof useRegisterForm> }) {
  const strength = form.getStrength();
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold text-muted-foreground">Thiết lập mật khẩu</p>
      <PasswordField label="Mật khẩu" value={form.password} show={form.showPassword} setShow={form.setShowPassword} error={form.errors.password} onChange={(value) => { form.setPassword(value); form.setFieldError("password", ""); }} />
      {form.password.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="h-1 flex-1 overflow-hidden rounded-full bg-border">
                <div className={cn("h-full rounded-full transition-all", index < strength ? strengthColors[Math.min(strength - 1, 3)] : "w-0")} style={{ width: index < strength ? "100%" : "0%" }} />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">Độ bảo mật: {strengthLabels[Math.min(strength, 3)] || "Rất mạnh"}</p>
        </div>
      )}
      <PasswordField label="Xác nhận mật khẩu" value={form.confirmPass} show={form.showConfirm} setShow={form.setShowConfirm} error={form.errors.confirm} onChange={(value) => { form.setConfirmPass(value); form.setFieldError("confirm", ""); }} />
      <TermsCheckbox checked={form.terms} onChange={() => form.setTerms(!form.terms)} />
      <StepButtons onBack={form.goBack} onNext={form.handleRegister} nextLabel={form.loading ? "Đang tạo..." : "Tạo tài khoản 🎉"} disabled={form.loading} submit />
    </div>
  );
}

function TextField(props: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
  hint?: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-muted-foreground">
        {props.label} {props.required && <span className="text-destructive">*</span>} {props.hint && <span className="text-xs font-normal">{props.hint}</span>}
      </label>
      <div className="relative">
        <props.icon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input type={props.type || "text"} value={props.value} onChange={(event) => props.onChange(event.target.value)} placeholder={props.placeholder} className="h-11 rounded-xl bg-[#f7f9ff] pl-10" />
      </div>
      {props.error && <p className="text-xs text-destructive">{props.error}</p>}
    </div>
  );
}

function PasswordField(props: {
  label: string;
  value: string;
  show: boolean;
  setShow: (show: boolean) => void;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-muted-foreground">
        {props.label} <span className="text-destructive">*</span>
      </label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input type={props.show ? "text" : "password"} value={props.value} onChange={(event) => props.onChange(event.target.value)} placeholder="Tối thiểu 8 ký tự..." className="h-11 rounded-xl bg-[#f7f9ff] pl-10 pr-10" />
        <button type="button" onClick={() => props.setShow(!props.show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground">
          {props.show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {props.error && <p className="text-xs text-destructive">{props.error}</p>}
    </div>
  );
}

function TermsCheckbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <label className="group flex cursor-pointer items-start gap-3">
      <div onClick={onChange} className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors", checked ? "border-primary bg-primary" : "border-border")}>
        {checked && <CheckCircle className="size-3 text-primary-foreground" />}
      </div>
      <span className="text-xs leading-relaxed text-muted-foreground">
        Tôi đồng ý với <span className="font-semibold text-primary hover:opacity-70">Điều khoản sử dụng</span> và <span className="font-semibold text-primary hover:opacity-70">Chính sách bảo mật</span> của PQJobs
      </span>
    </label>
  );
}

function StepButtons(props: { onBack: () => void; onNext: () => void; nextLabel: string; disabled?: boolean; submit?: boolean }) {
  return (
    <div className="flex gap-3">
      <Button variant="outline" onClick={props.onBack} className="h-11 flex-1 rounded-xl font-bold">
        ← Quay lại
      </Button>
      <Button onClick={props.onNext} disabled={props.disabled} className={cn("h-11 flex-1 rounded-xl font-bold shadow-md", props.submit ? "bg-[#F59E0B] text-white hover:bg-[#D97706]" : "bg-[#0E7490] text-secondary-foreground hover:bg-[#005a71]")}>
        {props.nextLabel}
      </Button>
    </div>
  );
}
