"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, ArrowRight, Globe } from "lucide-react";
import { useState, useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { TEMPLATE_DISPLAY, TEMPLATE_MAP } from "@/template";

interface ResumeTemplate {
  id: string;
  name: string;
  description?: string | null;
  previewUrl?: string | null;
}

const FALLBACK_TEMPLATES: ResumeTemplate[] = Object.entries(TEMPLATE_DISPLAY).map(
  ([id, template]) => ({
    id,
    name: template.name,
    description: template.style,
  }),
);

function getRenderableTemplates(list: ResumeTemplate[]) {
  return list.filter((template) => template.id in TEMPLATE_MAP);
}

export default function TemplateGalleryPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingId, setCreatingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/resumes/templates", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch templates");
        return res.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.data || []);
        const renderableTemplates = getRenderableTemplates(list);
        setTemplates(renderableTemplates.length > 0 ? renderableTemplates : FALLBACK_TEMPLATES);
      })
      .catch((err) => {
        console.error("Error fetching templates:", err);
        setTemplates(FALLBACK_TEMPLATES);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);
  const handleUseTemplate = (templateId: string) => {
    router.push(`/candidate/resumes/new?templateId=${templateId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Spinner size="lg" className="text-primary" />
        <p className="text-sm text-gray-500 animate-pulse">Đang tải danh sách mẫu CV...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Chọn mẫu CV thiết kế</h1>
        <p className="text-gray-500 mt-1">
          Chọn mẫu CV phù hợp để bắt đầu nhập trực tiếp thông tin của bạn
        </p>
      </div>

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] border border-dashed rounded-2xl bg-slate-50/50 p-8 text-center">
          <FileText className="size-12 text-slate-300 mb-3" />
          <h3 className="font-semibold text-slate-700">Không tìm thấy mẫu CV nào</h3>
          <p className="text-sm text-slate-400 mt-1">Vui lòng kiểm tra lại cấu hình mẫu CV trong cơ sở dữ liệu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group flex flex-col justify-between"
              onClick={() => handleUseTemplate(template.id)}
            >
              {/* Visual Preview Card header */}
              <div className="h-44 bg-slate-50 border-b flex items-center justify-center relative overflow-hidden">
                {template.previewUrl ? (
                  <img
                    src={template.previewUrl}
                    alt={template.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      // Fallback to icon if image fails to load
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <FileText className="size-16 text-slate-300 group-hover:scale-110 transition-transform duration-300" />
                )}
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary" className="text-xs">
                    <Globe className="size-3 mr-1" /> Trực quan
                  </Badge>
                </div>
              </div>

              <CardHeader className="pb-2">
                <CardTitle className="text-base">{template.name}</CardTitle>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col justify-between pt-0">
                <p className="text-sm text-gray-500 mb-6">
                  {template.description || "Mẫu CV thiết kế chuyên nghiệp."}
                </p>

                <Button
                  disabled={creatingId !== null}
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUseTemplate(template.id);
                  }}
                >
                  {creatingId === template.id ? (
                    <>
                      <Spinner className="mr-2" size="sm" /> Đang tạo...
                    </>
                  ) : (
                    <>
                      Sử dụng mẫu này <ArrowRight className="size-4 ml-1" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
