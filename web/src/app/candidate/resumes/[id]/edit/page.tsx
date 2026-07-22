"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { TEMPLATE_MAP } from "@/template";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { toTemplateResume, toTemplateUser } from "@/lib/resume-template-data";
import { apiUrl } from "@/lib/api-client";

export default function EditResumePage() {
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ user: any; resume: any; templateId: string } | null>(null);

  useEffect(() => {
    const loadResume = async () => {
      try {
        const response = await fetch(apiUrl(`/api/v1/resumes/${id}`), { credentials: "include" });
        if (!response.ok) throw new Error("Failed to load CV");
        const json = await response.json();
        const r = json.data?.data ?? json.data ?? json;

        if (r) {
          setData({
            user: toTemplateUser(r),
            resume: toTemplateResume(r),
            templateId: r.templateId || r.template?.id || "tpl-minimal-03",
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
