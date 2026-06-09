"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2, Star, Download } from "lucide-react";
import { toast } from "sonner";

interface ResumeData {
  id: string;
  title: string;
  summary: string | null;
  skills: string | null;
  languages: string | null;
  isDefault: boolean;
  template: { id: string; name: string };
}

export default function ResumeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [renderedHtml, setRenderedHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [resumeRes, renderRes] = await Promise.all([
          fetch(`/api/v1/resumes/${id}`, { credentials: "include" }),
          fetch(`/api/v1/resumes/${id}/render`, { credentials: "include" }),
        ]);

        if (resumeRes.ok) {
          const d = await resumeRes.json();
          setResume(d.data?.data ?? d.data);
        }

        if (renderRes.ok) {
          const d = await renderRes.json();
          setRenderedHtml(d.data?.data?.html ?? d.data?.html ?? d.html ?? "");
        }
      } catch {
        toast.error("Không thể tải CV");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Xác nhận xóa hồ sơ này?")) return;
    await fetch(`/api/v1/resumes/${id}`, { method: "DELETE", credentials: "include" });
    toast.success("Đã xóa CV");
    router.push("/candidate/resumes");
  };

  const handleSetDefault = async () => {
    await fetch(`/api/v1/resumes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isDefault: true }),
    });
    setResume((prev) => prev ? { ...prev, isDefault: true } : prev);
    toast.success("Đã đặt làm mặc định");
  };

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const response = await fetch(`/api/v1/resumes/${id}/pdf`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to export PDF");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cv-${resume?.title || id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Đã tải PDF");
    } catch {
      toast.error("Không thể tạo PDF");
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  if (!resume) return <div className="p-6"><p>Không tìm thấy hồ sơ</p></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="size-4 mr-1" /> Quay lại
          </Button>
          <h1 className="text-2xl font-bold">{resume.title}</h1>
          {resume.isDefault && <Badge variant="default">Mặc định</Badge>}
        </div>
        <div className="flex gap-2">
          {!resume.isDefault && (
            <Button variant="outline" size="sm" onClick={handleSetDefault}>
              <Star className="size-4 mr-1" /> Đặt mặc định
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => router.push(`/candidate/resumes/${id}/edit`)}>
            <Edit className="size-4 mr-1" /> Sửa
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={exporting}>
            <Download className="size-4 mr-1" /> {exporting ? "Đang xuất..." : "Export PDF"}
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="size-4 mr-1" /> Xóa
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        <span>Mẫu: {resume.template?.name || "Không xác định"}</span>
        {resume.languages && <span> • {resume.languages}</span>}
      </div>

      {/* CV Preview */}
      {renderedHtml ? (
        <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
          <iframe
            srcDoc={renderedHtml}
            className="w-full"
            style={{ height: "1200px", border: "none" }}
            title="CV Preview"
          />
        </div>
      ) : (
        <div className="bg-muted rounded-xl p-8 text-center">
          <p className="text-muted-foreground">Không thể tải preview CV.</p>
        </div>
      )}
    </div>
  );
}
