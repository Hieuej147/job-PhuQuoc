"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, ArrowRight, Globe } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";

const REACT_TEMPLATES = [
  { id: "tpl-classic-02", name: "Classic Minimalist", slug: "classic", description: "Mẫu thiết kế tối giản cổ điển, thanh lịch và trang trọng." },
  { id: "tpl-modern-01", name: "Modern Navy", slug: "modern", description: "Phong cách hiện đại, nổi bật với các chi tiết màu xanh hải quân." },
  { id: "tpl-creative-04", name: "Creative Orange", slug: "creative", description: "Thiết kế sáng tạo trẻ trung, phù hợp với các ngành nghề năng động." },
  { id: "tpl-dev-05", name: "Tech Developer Pro", slug: "futuristic", description: "Phong cách tương lai chuyên biệt cho lập trình viên và kỹ sư công nghệ." },
  { id: "tpl-minimal-03", name: "Clean Teal", slug: "minimalist", description: "Mẫu CV gọn gàng, tinh tế và dễ nhìn với tông xanh ngọc mát mắt." },
];

export default function TemplateGalleryPage() {
  const router = useRouter();
  const [creatingId, setCreatingId] = useState<string | null>(null);

  const handleUseTemplate = (templateId: string) => {
    router.push(`/candidate/resumes/new?templateId=${templateId}`);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Chọn mẫu CV thiết kế</h1>
        <p className="text-gray-500 mt-1">
          Chọn mẫu CV phù hợp để bắt đầu nhập trực tiếp thông tin của bạn
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {REACT_TEMPLATES.map((template) => (
          <Card
            key={template.id}
            className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group flex flex-col justify-between"
            onClick={() => handleUseTemplate(template.id)}
          >
            {/* Visual Preview Card header */}
            <div className="h-44 bg-slate-50 border-b flex items-center justify-center relative">
              <FileText className="size-16 text-slate-300 group-hover:scale-110 transition-transform duration-300" />
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
                {template.description}
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
    </div>
  );
}
