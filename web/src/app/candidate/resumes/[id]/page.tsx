"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2, Star, Download } from "lucide-react";
import { toast } from "sonner";
import { ResumePrintDocument } from "@/components/resume/resume-print-document";

import { TEMPLATE_MAP } from "@/template";

interface ResumeData {
  id: string;
  title: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  address: string | null;
  summary: string | null;
  skills: string | null;
  degree: string | null;
  languages: string | null;
  socialLinks: any;
  education: any;
  experience: any;
  projects: any;
  isDefault: boolean;
  templateId?: string;
  template: { id: string; name: string };
  user: { name: string; email: string; phone: string | null; image: string | null };
}

export default function ResumeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const resumeRes = await fetch(`/api/v1/resumes/${id}`, { credentials: "include" });

        if (resumeRes.ok) {
          const d = await resumeRes.json();
          setResume(d.data?.data ?? d.data);
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
    if (!window.confirm("Xác nhận xóa hồ sơ này?")) return;
    try {
      const res = await fetch(`/api/v1/resumes/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const body = await res.text();
      if (!res.ok) {
        toast.error(`Xóa thất bại (${res.status}): ${body}`);
        console.error("Delete failed:", res.status, body);
        return;
      }
      toast.success("Đã xóa CV");
      router.push("/candidate/resumes");
    } catch (err) {
      toast.error(`Lỗi kết nối: ${String(err)}`);
      console.error("Delete error:", err);
    }
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
    window.open(`/resumes/${id}/print?print=1`, "_blank", "noopener,noreferrer");
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  if (!resume) return <div className="p-6"><p>Không tìm thấy hồ sơ</p></div>;

  const userProps = {
    name: resume.name || resume.user?.name || "Họ và Tên",
    email: resume.email || resume.user?.email || "",
    phone: resume.phone || resume.user?.phone || "",
    avatar: resume.avatar || resume.user?.image || "",
  };

  const resumeProps = {
    title: resume.title,
    address: resume.address || "",
    summary: resume.summary || "",
    degree: resume.degree || "",
    languages: resume.languages || "",
    skills: resume.skills || "",
    socialLinks: resume.socialLinks || [],
    education: resume.education || [],
    experience: resume.experience || [],
    projects: resume.projects || [],
  };

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
          <Button variant="outline" size="sm" onClick={handleExportPdf}>
            <Download className="size-4 mr-1" /> Xem/In PDF
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

      <div className="overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 py-8 shadow-inner readonly-cv-view">
        <style>{`
          .readonly-cv-view input, 
          .readonly-cv-view textarea {
            border: none !important;
            background: transparent !important;
            outline: none !important;
            pointer-events: none !important;
            resize: none !important;
          }
          .readonly-cv-view button,
          .readonly-cv-view .print\\:hidden,
          .readonly-cv-view label {
            display: none !important;
          }
        `}</style>
        {(() => {
          const tId = resume.templateId || resume.template?.id || "tpl-minimal-03";
          const TemplateComponent = TEMPLATE_MAP[tId];
          if (TemplateComponent) {
            return <TemplateComponent user={userProps} resume={resumeProps} resumeId={id} readOnly={true} />;
          }
          return <ResumePrintDocument user={userProps} resume={resumeProps} templateId={tId} />;
        })()}
      </div>
    </div>
  );
}
