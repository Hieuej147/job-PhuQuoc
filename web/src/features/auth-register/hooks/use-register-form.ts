"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { registerEmail, savePendingRegisterPassword } from "@/features/auth-register/api";
import type { RegisterRole, RegisterStepGuideItem } from "../types";

const EMAIL_REG = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useRegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<RegisterRole>("CANDIDATE");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ name: "", email: "", password: "", confirm: "" });

  const totalSteps = 3;
  const stepsGuide: RegisterStepGuideItem[] = [
    { n: 1, label: "Chọn vai trò", sub: "Ứng viên hoặc nhà tuyển dụng" },
    { n: 2, label: "Thông tin cơ bản", sub: "Tên, email, số điện thoại" },
    { n: 3, label: "Thiết lập mật khẩu", sub: "Bảo mật tài khoản" },
  ];

  const setFieldError = (key: keyof typeof errors, value: string) => {
    setErrors((prev) => ({ ...prev, [key]: value }));
  };

  const validateProfile = () => {
    let ok = true;
    if (!name.trim()) {
      setFieldError("name", "Vui lòng nhập họ tên");
      ok = false;
    } else setFieldError("name", "");

    if (!EMAIL_REG.test(email)) {
      setFieldError("email", "Email không hợp lệ");
      ok = false;
    } else setFieldError("email", "");
    return ok;
  };

  const validatePassword = () => {
    let ok = true;
    if (password.length < 8) {
      setFieldError("password", "Mật khẩu phải có ít nhất 8 ký tự");
      ok = false;
    } else setFieldError("password", "");

    if (password !== confirmPass) {
      setFieldError("confirm", "Mật khẩu xác nhận không khớp");
      ok = false;
    } else setFieldError("confirm", "");

    if (!terms) {
      toast.error("Vui lòng đồng ý với điều khoản sử dụng");
      ok = false;
    }
    return ok;
  };

  const goNext = () => {
    if (step === 1) setStep(2);
    if (step === 2 && validateProfile()) setStep(3);
  };

  const goBack = () => setStep((prev) => Math.max(1, prev - 1));

  const getStrength = () => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  };

  const handleRegister = async () => {
    if (!validatePassword()) return;
    setLoading(true);
    try {
      await registerEmail({ name, email, password, role, phone: phone || undefined });
      savePendingRegisterPassword(email, password);
      toast.success("Đăng ký thành công! Vui lòng xác nhận email.");
      router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}&mode=register`);
    } catch (err: unknown) {
      const msg = (err as Error).message || "";
      toast.error(
        msg.toLowerCase().includes("already exists") || msg.toLowerCase().includes("user already")
          ? "Email đã tồn tại. Vui lòng dùng email khác hoặc đăng nhập."
          : msg || "Đăng ký thất bại",
      );
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

  return {
    step,
    totalSteps,
    role,
    setRole,
    name,
    setName,
    email,
    setEmail,
    phone,
    setPhone,
    password,
    setPassword,
    confirmPass,
    setConfirmPass,
    showPassword,
    setShowPassword,
    showConfirm,
    setShowConfirm,
    terms,
    setTerms,
    loading,
    errors,
    stepsGuide,
    goNext,
    goBack,
    getStrength,
    handleRegister,
    handleGoogleRegister,
    setFieldError,
  };
}
