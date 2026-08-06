"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { TEMPLATE_MAP } from "@/template";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { toTemplateResume, toTemplateUser } from "@/lib/resume-template-data";
import { apiUrl } from "@/lib/api-client";

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
    fetch(apiUrl(`/api/v1/resumes/${id}`), { credentials: "include" })
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
    document.title = "";
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

  const user = toTemplateUser(resume);
  const resumeData = toTemplateResume(resume);

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
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            scrollbar-width: none !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            height: auto !important;
            min-height: 0 !important;
          }
          *::-webkit-scrollbar {
            display: none !important;
          }
          /* Hide non-printable elements */
          header,
          footer,
          .print-toolbar,
          [class*="print-toolbar"],
          [class*="print:hidden"],
          [class*="copilotkit"],
          [class*="CopilotKit"],
          [id*="copilotkit"],
          .copilotkit-chat-button,
          iframe {
            display: none !important;
          }
          .readonly-cv-view {
            padding: 0 !important;
            margin: 0 !important;
            min-height: 297mm !important;
            height: 100% !important;
            background: transparent !important;
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
          .resume-print-page {
            width: 210mm !important;
            max-width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
          }
          .resume-print-page article {
            margin: 0 !important;
            box-shadow: none !important;
          }
          
          /* Force desktop responsive styles to be active during print preview */
          .resume-print-page [class~="md:flex-row"] {
            flex-direction: row !important;
          }
          .resume-print-page [class~="md:text-left"] {
            text-align: left !important;
          }
          .resume-print-page [class~="md:items-start"] {
            align-items: flex-start !important;
          }
          .resume-print-page [class~="md:items-center"] {
            align-items: center !important;
          }
          .resume-print-page [class~="md:justify-start"] {
            justify-content: flex-start !important;
          }
          .resume-print-page [class~="md:block"] {
            display: block !important;
          }
          .resume-print-page [class~="md:mx-0"] {
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
          .resume-print-page [class~="md:grid-cols-2"] {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .resume-print-page [class~="sm:grid-cols-2"] {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .resume-print-page [class~="md:grid-cols-[1fr_260px]"] {
            grid-template-columns: minmax(0, 1fr) 260px !important;
          }
          .resume-print-page [class~="md:grid-cols-[280px_1fr]"] {
            grid-template-columns: 280px minmax(0, 1fr) !important;
          }
          
          /* Semantic overrides for TemplateFuturistic (Tech Developer Pro) */
          .resume-print-page .futuristic-cv-header {
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
            text-align: left !important;
          }
          .resume-print-page .futuristic-cv-header .flex-grow {
            text-align: left !important;
          }
          .resume-print-page .futuristic-cv-header input {
            text-align: left !important;
          }
          .resume-print-page .futuristic-cv-header .justify-center {
            justify-content: flex-start !important;
          }
          .resume-print-page .futuristic-cv-grid {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) 260px !important;
            align-items: start !important;
          }
          .resume-print-page .futuristic-cv-grid > div:first-child {
            grid-column: span 1 !important;
            min-width: 0 !important;
          }
          .resume-print-page .futuristic-cv-grid > div:last-child,
          .resume-print-page .futuristic-cv-grid > aside {
            grid-column: span 1 !important;
            width: 260px !important;
          }
        }
      `}</style>
      <div className="print-toolbar print:hidden sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-3 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-slate-900">{resume.title || "CV"}</p>
          <p className="text-xs text-slate-500">Dùng Ctrl+P hoặc nút In/Lưu PDF để lưu file.</p>
        </div>
        <Button onClick={() => window.print()}>In / Lưu PDF</Button>
      </div>
      <div className="resume-print-page">
        {(() => {
          const tId = (resume as any).templateId || resume.template?.id || "tpl-minimal-03";
          const SelectedTemplate = TEMPLATE_MAP[tId] || TEMPLATE_MAP["tpl-minimal-03"];
          return <SelectedTemplate user={user} resume={resumeData} readOnly={true} />;
        })()}
      </div>
    </div>
  );
}
