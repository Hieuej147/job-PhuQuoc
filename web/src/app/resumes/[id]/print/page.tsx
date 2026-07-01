"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ResumePrintDocument } from "@/components/resume/resume-print-document";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

interface ResumeData {
  id: string;
  title: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar?: string | null;
  address: string | null;
  summary: string | null;
  skills: string | null;
  degree: string | null;
  languages: string | null;
  socialLinks: any;
  education: any;
  experience: any;
  projects: any;
  template: { id: string; name: string };
  user: { name: string; email: string; phone: string | null; image: string | null };
}

export default function PublicPrintResumePage() {
  const params = useParams();
  const id = params.id as string;
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/resumes/${id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const resumeData = d.data?.data ?? d.data ?? d;
        setResume(resumeData);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (loading || !resume) return;
    const shouldPrint = new URLSearchParams(window.location.search).get("print") === "1";
    if (!shouldPrint) return;
    const timer = window.setTimeout(() => window.print(), 300);
    return () => window.clearTimeout(timer);
  }, [loading, resume]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p>Không tìm thấy hồ sơ</p>
      </div>
    );
  }

  const user = {
    name: resume.name || resume.user?.name || "Họ và Tên",
    email: resume.email || resume.user?.email || "",
    phone: resume.phone || resume.user?.phone || "",
    avatar: resume.avatar || resume.user?.image || "",
  };

  const resumeData = {
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
    <div className="min-h-screen bg-slate-200 readonly-cv-view">
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
        /* Hide CopilotKit and any chat elements globally on this page */
        [class*="copilotkit"],
        [class*="CopilotKit"],
        [id*="copilotkit"],
        .copilotkit-chat-button,
        iframe[src*="copilotkit"] {
          display: none !important;
        }
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            overflow: visible !important;
            height: auto !important;
            min-height: 0 !important;
          }
          /* Hide scrollbars and show overflow content when printing */
          * {
            overflow: visible !important;
            scrollbar-width: none !important;
          }
          *::-webkit-scrollbar {
            display: none !important;
          }
          .readonly-cv-view {
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            min-height: 0 !important;
            height: auto !important;
          }
          .readonly-cv-view > div {
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            min-height: 0 !important;
            height: auto !important;
          }
          .readonly-cv-view div[class*="max-w-"],
          .readonly-cv-view div[class*="mx-auto"] {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            min-height: 0 !important;
            height: auto !important;
          }
          .print-toolbar {
            display: none !important;
          }
          body * {
            visibility: hidden !important;
          }
          .resume-print-page,
          .resume-print-page * {
            visibility: visible !important;
          }
          .resume-print-page {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 210mm !important;
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
          <p className="text-sm font-semibold text-slate-900">{resume.title || "CV"}</p>
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
