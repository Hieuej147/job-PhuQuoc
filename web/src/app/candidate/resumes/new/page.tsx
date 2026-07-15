"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TEMPLATE_MAP } from "@/template";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { toNewTemplateResume, toTemplateUser } from "@/lib/resume-template-data";
import { apiUrl } from "@/lib/api-client";

function NewCvContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("templateId");
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [resumeDraft, setResumeDraft] = useState<any>(null);

  useEffect(() => {
    if (!templateId) {
      router.push("/candidate/resumes/templates");
      return;
    }
    const loadProfile = async () => {
      try {
        const [authResponse, profileResponse] = await Promise.all([
          fetch(apiUrl("/api/v1/auth/me"), { credentials: "include" }),
          fetch(apiUrl("/api/v1/resumes/profile"), { credentials: "include" }),
        ]);

        if (!authResponse.ok) throw new Error("Failed to load user profile");

        const authJson = await authResponse.json();
        const profileJson = profileResponse.ok ? await profileResponse.json() : {};
        const authUser = authJson.user || {};
        const profile = profileJson.data?.data ?? profileJson.data ?? profileJson;
        const mergedProfile = { ...authUser, ...profile };

        setUserProfile(toTemplateUser(mergedProfile));
        setResumeDraft(toNewTemplateResume(profile));
      } catch (err) {
        toast.error("Không thể tải thông tin tài khoản");
        setUserProfile(toTemplateUser());
        setResumeDraft(toNewTemplateResume());
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

  return (
    <div className="min-h-screen bg-[#f7f9ff] flex flex-col">
      <main className="grow">
        <TemplateComponent user={userProfile || {}} resume={resumeDraft || toNewTemplateResume()} />
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
