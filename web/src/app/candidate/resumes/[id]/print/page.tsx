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

export default function PrintResumePage() {
  const params = useParams();
  const id = params.id as string;
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/resumes/${id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setResume(d.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (resume && !loading) {
      // Auto-print after a short delay for rendering
      const timer = setTimeout(() => window.print(), 1000);
      return () => clearTimeout(timer);
    }
  }, [resume, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Không tìm thấy hồ sơ</p>
      </div>
    );
  }

  const TemplateComponent = TEMPLATE_MAP[resume.template.id as keyof typeof TEMPLATE_MAP];
  if (!TemplateComponent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Không tìm thấy mẫu CV</p>
      </div>
    );
  }

  const user = {
    name: resume.user.name,
    email: resume.user.email,
    phone: resume.user.phone || "",
    avatar: resume.user.image || "",
  };

  const resumeData = {
    title: resume.title,
    address: resume.address || "",
    summary: resume.summary || "",
    degree: resume.degree || "",
    languages: resume.languages || "",
    skills: resume.skills || "",
    socicallink: resume.socialLinks || [],
    education: resume.education || [],
    experience: resume.experience || [],
    projects: resume.projects || [],
  };

  return (
    <div className="min-h-screen bg-white">
      <TemplateComponent user={user} resume={resumeData} />
    </div>
  );
}
