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
    </div>
  );
}
