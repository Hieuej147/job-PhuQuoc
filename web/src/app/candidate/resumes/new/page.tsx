"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TEMPLATE_MAP } from "@/template";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

function NewCvContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("templateId");

  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (!templateId) {
      router.push("/candidate/resumes/templates");
      return;
    }

    const loadProfile = async () => {
      try {
        const response = await fetch("/api/v1/auth/me", { credentials: "include" });
        if (!response.ok) throw new Error("Failed to load user profile");
        const json = await response.json();
        const u = json.user;

        if (u) {
          setUserProfile({
            name: u.name || "Họ và Tên",
            email: u.email || "",
            phone: u.phone || "",
            avatar: u.image || "https://i.pravatar.cc/150?img=12",
          });
        }
      } catch (err) {
        toast.error("Không thể tải thông tin tài khoản");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [templateId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center space-y-3">
          <Spinner size="lg" className="mx-auto" />
          <p className="text-stone-500 text-sm font-medium">Đang tải giao diện khởi tạo CV...</p>
        </div>
      </div>
    );
  }

  const TemplateComponent = TEMPLATE_MAP[templateId as keyof typeof TEMPLATE_MAP];
  if (!TemplateComponent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="text-stone-500 text-sm">Mẫu CV không hợp lệ hoặc không tồn tại.</p>
      </div>
    );
  }

  // Pre-fill CV default values
  const defaultResume = {
    title: "Hồ sơ mới tạo",
    address: "Phú Quốc, Kiên Giang",
    degree: "Cử nhân / Vị trí ứng tuyển",
    summary: "Bản tóm tắt nghề nghiệp giới thiệu năng lực bản thân bạn...",
    languages: "Tiếng Việt, Tiếng Anh",
    skills: "Lập trình, Giao tiếp",
    socialLinks: [],
    education: [],
    experience: [
      {
        company: "Tên công ty",
        position: "Chức vụ",
        startYear: "2023",
        endYear: "Hiện tại",
        description: "Mô tả công việc và thành tựu..."
      }
    ],
    projects: [],
  };

  return (
    <div className="min-h-screen bg-[#f7f9ff] flex flex-col">
      <main className="grow">
        <TemplateComponent user={userProfile || {}} resume={defaultResume} />
      </main>
    </div>
  );
}

export default function NewCvPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Spinner size="lg" /></div>}>
      <NewCvContent />
    </Suspense>
  );
}
