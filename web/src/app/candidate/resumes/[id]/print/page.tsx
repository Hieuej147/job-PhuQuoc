"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { TemplateRenderer } from "@/components/cv/template-renderer";

export default function PrintResumePage() {
  const params = useParams();
  const id = params.id as string;
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/resumes/${id}/render?mode=view`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setHtmlContent(d.data?.html || d.html || (typeof d.data === 'string' ? d.data : "")))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (htmlContent && !loading) {
      // Auto-print after a short delay for rendering
      const timer = setTimeout(() => window.print(), 1000);
      return () => clearTimeout(timer);
    }
  }, [htmlContent, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!htmlContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Không tìm thấy hồ sơ hoặc lỗi kết xuất</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white print:m-0 print:p-0">
      <TemplateRenderer html={htmlContent} editMode={false} className="w-full h-full min-h-screen" />
    </div>
  );
}
