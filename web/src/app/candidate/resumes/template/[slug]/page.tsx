"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, notFound } from "next/navigation";
import { TEMPLATE_MAP, SLUG_TO_ID } from "@/template";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

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
          const response = await fetch("/api/v1/auth/me", { credentials: "include" });
          const json = response.ok ? await response.json() : {};
          const u = json.user || {};
          setData({
            user: {
              name: u.name || "Họ và Tên",
              email: u.email || "",
              phone: u.phone || "",
              avatar: u.image || "https://i.pravatar.cc/150?img=12",
            },
            resume: {
              title: "Hồ sơ của tôi",
              address: "Phú Quốc, Kiên Giang",
              degree: "Cử nhân / Vị trí ứng tuyển",
              summary: "Bản tóm tắt nghề nghiệp giới thiệu năng lực bản thân bạn...",
              languages: "Tiếng Việt, Tiếng Anh",
              skills: "Lập trình, Giao tiếp",
              socialLinks: [],
              education: [],
              experience: [],
              projects: [],
            }
          });
        } catch (err) {
          setData({ user: {}, resume: {} });
        } finally {
          setLoading(false);
        }
        return;
      }

      try {
        const response = await fetch(`/api/v1/resumes/${resumeId}`, { credentials: "include" });
        if (!response.ok) throw new Error("Failed to load CV");
        const json = await response.json();
        const r = json.data?.data ?? json.data ?? json;
        
        const userObj = {
          name: r.user?.name || r.name || "Họ và Tên",
          email: r.user?.email || r.email || "",
          phone: r.user?.phone || r.phone || "",
          avatar: r.user?.image || r.avatar || "https://i.pravatar.cc/150?img=12",
        };

        const resumeObj = {
          title: r.title || "Hồ sơ của tôi",
          address: r.address || "",
          summary: r.summary || "",
          degree: r.degree || "",
          languages: r.languages || "",
          skills: r.skills || "",
          socialLinks: r.socialLinks || r.socicallink || [],
          education: r.education || [],
          experience: r.experience || [],
          projects: r.projects || [],
        };

        setData({ user: userObj, resume: resumeObj });
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
