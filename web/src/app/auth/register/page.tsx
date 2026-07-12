"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { RegisterCard } from "@/features/auth-register/components/register-card";
import { useRegisterForm } from "@/features/auth-register/hooks/use-register-form";

export default function RegisterPage() {
  const form = useRegisterForm();

  return (
    <AuthLayout
      breadcrumb={[{ label: "Trang chủ", href: "/" }, { label: "Đăng ký" }]}
      maxWidth="lg"
      stepsGuide={form.stepsGuide}
      currentStep={form.step}
    >
      <RegisterCard form={form} />

      <div className="text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Về trang chủ
        </Link>
      </div>
    </AuthLayout>
  );
}
