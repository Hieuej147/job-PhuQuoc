"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, notFound } from "next/navigation";
import { TEMPLATE_MAP, SLUG_TO_ID } from "@/template";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { toNewTemplateResume, toTemplateResume, toTemplateUser } from "@/lib/resume-template-data";
import { apiUrl } from "@/lib/api-client";

export default function TemplatePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const resumeId = searchParams.get("resumeId") || undefined;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ user: any; resume: any } | null>(null);

  // Validate slug
  const templateId = SLUG_TO_ID[slug as keyof typeof SLUG_TO_ID] || slug;
  const TemplateComponent = TEMPLATE_MAP[templateId as keyof typeof TEMPLATE_MAP];

  useEffect(() => {
    const loadResumeData = async () => {
      if (!TemplateComponent) {
        setLoading(false);
        return;
      }

      if (!resumeId) {
        try {
          const [authResponse, profileResponse] = await Promise.all([
            fetch(apiUrl("/api/v1/auth/me"), { credentials: "include" }),
            fetch(apiUrl("/api/v1/resumes/profile"), { credentials: "include" }),
          ]);
          const authJson = authResponse.ok ? await authResponse.json() : {};
          const profileJson = profileResponse.ok ? await profileResponse.json() : {};
          const authUser = authJson.user || {};
          const profile = profileJson.data?.data ?? profileJson.data ?? profileJson;
          const mergedProfile = { ...authUser, ...profile };

          setData({
            user: toTemplateUser(mergedProfile),
            resume: toNewTemplateResume(profile),
          });
        } catch (err) {
          setData({ user: toTemplateUser(), resume: toNewTemplateResume() });
        } finally {
          setLoading(false);
        }
        return;
      }

      try {
        const response = await fetch(apiUrl(`/api/v1/resumes/${resumeId}`), { credentials: "include" });
        if (!response.ok) throw new Error("Failed to load CV");
        const json = await response.json();
        const r = json.data?.data ?? json.data ?? json;
        
        setData({ user: toTemplateUser(r), resume: toTemplateResume(r) });
      } catch (err) {
        toast.error("Không thể tải thông tin CV của bạn.");
      } finally {
        setLoading(false);
      }
    };

    loadResumeData();
  }, [resumeId, TemplateComponent]);

  if (!TemplateComponent) {
    notFound();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center space-y-3">
          <Spinner size="lg" className="mx-auto" />
          <p className="text-stone-500 text-sm">Đang tải cấu hình CV...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="text-stone-500 text-sm">Không thể tải dữ liệu CV.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9ff] flex flex-col">
      <main className="grow">
        <TemplateComponent user={data.user} resume={data.resume} resumeId={resumeId} />
      </main>
    </div>
  );
}
