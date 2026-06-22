"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { TEMPLATE_MAP } from "@/template";
import { Spinner } from "@/components/ui/spinner";

interface ResumeData {
  id: string;
  title: string;
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
    const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const bypass = searchParams?.get("bypass");
    const fetchUrl = bypass
      ? `/api/v1/resumes/${id}?bypass=${bypass}`
      : `/api/v1/resumes/${id}`;

    fetch(fetchUrl, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const resumeData = d.data?.data ?? d.data ?? d;
        setResume(resumeData);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (resume && !loading) {
      const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      if (searchParams?.get("print") !== "false") {
        // Auto-print after a short delay for rendering
        const timer = setTimeout(() => window.print(), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [resume, loading]);

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

  const TemplateComponent = TEMPLATE_MAP[resume.template.id as keyof typeof TEMPLATE_MAP];
  if (!TemplateComponent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p>Không tìm thấy mẫu CV</p>
      </div>
    );
  }

  const user = {
    name: resume.user?.name || "Họ và Tên",
    email: resume.user?.email || "",
    phone: resume.user?.phone || "",
    avatar: resume.user?.image || "",
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
    <div className="min-h-screen bg-white readonly-cv-view">
      <style>{`
        .readonly-cv-view input, 
        .readonly-cv-view textarea {
          border: none !important;
          background: transparent !important;
          outline: none !important;
          pointer-events: none !important;
          resize: none !important;
        }
        .readonly-cv-view button:not(.pdf-export-btn),
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
        .pdf-export-btn {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          z-index: 9999;
          background-color: #005a71;
          color: #ffffff;
          padding: 0.75rem 1.5rem;
          border-radius: 9999px;
          font-family: 'Be Vietnam Pro', sans-serif;
          font-weight: 600;
          font-size: 0.875rem;
          display: flex !important;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 4px 12px rgba(0, 90, 113, 0.3);
          border: none;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
        }
        .pdf-export-btn:hover {
          background-color: #004557;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 90, 113, 0.4);
        }
        .pdf-export-btn:active {
          transform: translateY(0);
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
          .pdf-export-btn {
            display: none !important;
          }
          .readonly-cv-view {
            padding: 10px !important;
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
        }
      `}</style>
      <TemplateComponent user={user} resume={resumeData} readOnly={true} />
      <button onClick={() => window.print()} className="pdf-export-btn">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        Xuất file PDF
      </button>
    </div>
  );
}
