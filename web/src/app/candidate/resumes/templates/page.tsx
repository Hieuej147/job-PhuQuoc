"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText, Plus, Globe, Lock, ArrowRight } from "lucide-react";
import { TemplateRenderer } from "@/components/cv/template-renderer";

interface Template {
  id: string;
  name: string;
  description: string | null;
  previewUrl: string | null;
  isPublic: boolean;
  userId: string | null;
  createdAt: string;
}

export default function TemplateGalleryPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");

  useEffect(() => {
    fetch("/api/v1/resumes/templates", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setTemplates(d.data?.data ?? d.data ?? []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handlePreview = async (templateId: string) => {
    setPreviewTemplate(templateId);

    // Fetch template details to get HTML
    try {
      const res = await fetch(`/api/v1/resumes/templates/${templateId}`, {
        credentials: "include",
      });
      if (res.ok) {
        const result = await res.json();
        const tpl = result.data?.data ?? result.data;

        // Render with sample data
        const renderRes = await fetch("/api/v1/resumes/render-template", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
            body: JSON.stringify({
            templateId: tpl.id,
            data: {
              name: "Nguyễn Văn A",
              email: "nguyenvana@email.com",
              phone: "0909123456",
              address: "Phú Quốc, Kiên Giang",
              degree: "Cử nhân Công nghệ thông tin",
              summary:
                "Lập trình viên với 3 năm kinh nghiệm phát triển ứng dụng web. Thành thạo React, TypeScript, Node.js. Đam mê tạo ra sản phẩm chất lượng cao.",
              skills: "React, TypeScript, Node.js, PostgreSQL, Docker, Git",
              languages: "Tiếng Anh (IELTS 7.0), Tiếng Việt (Bản ngữ)",
              socialLinks: [
                { platform: "LinkedIn", url: "https://linkedin.com/in/nguyenvana" },
                { platform: "GitHub", url: "https://github.com/nguyenvana" },
              ],
              education: [
                {
                  school: "Đại học Cần Thơ",
                  degree: "Cử nhân",
                  field: "Công nghệ thông tin",
                  startYear: "2018",
                  endYear: "2022",
                  GPA: "3.5",
                  description: "Tốt nghiệp loại Giỏi",
                },
              ],
              experience: [
                {
                  company: "Công ty ABC",
                  position: "Frontend Developer",
                  startYear: "2022",
                  endYear: "Hiện tại",
                  description:
                    "Phát triển và bảo trì ứng dụng web sử dụng React, TypeScript. Làm việc với team 5 người.",
                },
              ],
              projects: [
                {
                  name: "E-commerce Platform",
                  position: "Fullstack Developer",
                  link: "https://example.com",
                  description:
                    "Xây dựng nền tảng thương mại điện tử với React và Node.js",
                },
              ],
            },
            mode: "view",
          }),
        });

        if (renderRes.ok) {
          const renderResult = await renderRes.json();
          setPreviewHtml(renderResult.data?.data?.html ?? renderResult.data?.html ?? "");
        }
      }
    } catch (error) {
      console.error("Failed to load template preview:", error);
    }
  };

  const handleUseTemplate = (templateId: string) => {
    router.push(`/candidate/resumes/new?templateId=${templateId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chọn mẫu CV</h1>
          <p className="text-gray-500 mt-1">
            Chọn mẫu CV phù hợp và bắt đầu tạo hồ sơ của bạn
          </p>
        </div>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Chưa có mẫu CV"
          description="Hiện tại chưa có mẫu CV nào khả dụng."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => handlePreview(template.id)}
            >
              {/* Preview thumbnail */}
              <div className="h-48 bg-gray-100 border-b overflow-hidden">
                {previewTemplate === template.id && previewHtml ? (
                  <div className="w-full h-full overflow-hidden" style={{ transform: "scale(0.3)", transformOrigin: "top left", width: "333%", height: "333%" }}>
                    <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="size-12 text-gray-300" />
                  </div>
                )}
              </div>

              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  {template.isPublic ? (
                    <Badge variant="secondary" className="text-xs">
                      <Globe className="size-3 mr-1" /> Công khai
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      <Lock className="size-3 mr-1" /> Riêng tư
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                {template.description && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {template.description}
                  </p>
                )}

                <Button
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUseTemplate(template.id);
                  }}
                >
                  Sử dụng mẫu này <ArrowRight className="size-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && previewHtml && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold">Xem trước mẫu CV</h2>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleUseTemplate(previewTemplate)}
                >
                  Sử dụng mẫu này
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPreviewTemplate(null);
                    setPreviewHtml("");
                  }}
                >
                  Đóng
                </Button>
              </div>
            </div>
            <div className="overflow-auto p-4" style={{ maxHeight: "calc(90vh - 80px)" }}>
              <div className="max-w-[210mm] mx-auto bg-white shadow-lg">
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
