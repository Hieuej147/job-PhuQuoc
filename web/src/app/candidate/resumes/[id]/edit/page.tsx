"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TEMPLATE_MAP } from "@/template";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

export default function EditResumePage() {
  const params = useParams();
  const id = params.id as string;
  const ID_TO_SLUG: Record<string, string> = {
  "tpl-modern-01": "modern",
  "tpl-classic-02": "classic",
  "tpl-creative-04": "creative",
  "tpl-dev-05": "futuristic",
  "tpl-minimal-03": "minimalist",
};

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ user: any; resume: any; templateId: string } | null>(null);

  useEffect(() => {
    const loadResume = async () => {
      try {
        const response = await fetch(`/api/v1/resumes/${id}`, { credentials: "include" });
        if (!response.ok) throw new Error("Failed to load CV");
        const json = await response.json();
        const r = json.data?.data ?? json.data ?? json;

        if (r) {
          const userObj = {
            name: r.name || r.user?.name || "Họ và Tên",
            email: r.email || r.user?.email || "",
            phone: r.phone || r.user?.phone || "",
            avatar: r.avatar || r.user?.image || "https://i.pravatar.cc/150?img=12",
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

          setData({
            user: userObj,
            resume: resumeObj,
            templateId: r.templateId || r.template?.id || "tpl-minimal-02",
          });
        } else {
          toast.error("Không tìm thấy CV");
        }
      } catch (err) {
        toast.error("Không thể tải thông tin CV");
      } finally {
        setLoading(false);
      }
    };
    loadResume();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center space-y-3">
          <Spinner size="lg" className="mx-auto" />
          <p className="text-stone-500 text-sm font-medium">Đang tải cấu hình CV...</p>
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

  const TemplateComponent = TEMPLATE_MAP[data.templateId as keyof typeof TEMPLATE_MAP];
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
        <TemplateComponent user={data.user} resume={data.resume} resumeId={id} />
      </main>
    </div>
  );
}
