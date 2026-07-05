"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ResumePrintDocument } from "@/components/resume/resume-print-document";

type ResumeInfo = {
  id: string;
  title?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar?: string | null;
  address?: string | null;
  summary?: string | null;
  degree?: string | null;
  languages?: string | null;
  skills?: string | null;
  socialLinks?: any;
  education?: any;
  experience?: any;
  projects?: any;
  template?: { id: string; name: string } | null;
  user?: { name: string; email: string; phone?: string | null; image?: string | null } | null;
};

type CvPayload = { type: "uploaded"; url: string } | { type: "resume"; resume: ResumeInfo };

export default function EmployerApplicationResumePrintPage() {
  const params = useParams();
  const id = params.id as string;
  const [payload, setPayload] = useState<CvPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/applications/${id}/resume`, { credentials: "include" })
      .then((response) => response.json())
      .then((body) => setPayload(body.data?.data ?? body.data ?? body))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (loading || payload?.type !== "resume") return;
    const shouldPrint = new URLSearchParams(window.location.search).get("print") === "1";
    if (!shouldPrint) return;
    const timer = window.setTimeout(() => window.print(), 300);
    return () => window.clearTimeout(timer);
  }, [loading, payload]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p>Không tìm thấy CV</p>
      </div>
    );
  }

  if (payload.type === "uploaded") {
    const fileUrl = `/api/v1/applications/${id}/resume-file`;

    return (
      <div className="min-h-screen bg-slate-200">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-3 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">CV PDF ứng viên</p>
          <Button onClick={() => window.open(fileUrl, "_blank", "noopener,noreferrer")}>Mở file PDF</Button>
        </div>
        <iframe src={fileUrl} title="CV PDF ứng viên" className="h-[calc(100vh-58px)] w-full bg-white" />
      </div>
    );
  }

  const resume = payload.resume;
  const user = {
    name: resume.name || resume.user?.name || "Họ và Tên",
    email: resume.email || resume.user?.email || "",
    phone: resume.phone || resume.user?.phone || "",
    avatar: resume.avatar || resume.user?.image || "",
  };
  const resumeData = {
    title: resume.title || "CV ứng viên",
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
    <div className="min-h-screen bg-slate-200">
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header,
          footer,
          .print-toolbar,
          .print\:hidden,
          [class*="copilotkit"],
          [class*="CopilotKit"],
          [id*="copilotkit"],
          .copilotkit-chat-button,
          iframe {
            display: none !important;
          }
          .resume-print-page {
            width: 210mm !important;
            margin: 0 auto !important;
            background: #ffffff !important;
          }
          .resume-print-page article {
            margin: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
      <div className="print-toolbar sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-3 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-slate-900">{resume.title || "CV ứng viên"}</p>
          <p className="text-xs text-slate-500">Dùng Ctrl+P hoặc nút In/Lưu PDF để lưu file.</p>
        </div>
        <Button onClick={() => window.print()}>In / Lưu PDF</Button>
      </div>
      <div className="resume-print-page py-8 print:py-0">
        <ResumePrintDocument user={user} resume={resumeData} templateId={resume.template?.id} />
      </div>
    </div>
  );
}
