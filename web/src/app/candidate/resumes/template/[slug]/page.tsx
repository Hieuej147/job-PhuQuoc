"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, notFound } from "next/navigation";
import { TEMPLATE_MAP, SLUG_TO_ID } from "@/template";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

export default function TemplatePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const resumeId = searchParams.get("resumeId") || undefined;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ user: any; resume: any } | null>(null);

  // Validate slug
  const templateId = SLUG_TO_ID[slug as keyof typeof SLUG_TO_ID] || slug;
  const TemplateComponent = TEMPLATE_MAP[templateId as keyof typeof TEMPLATE_MAP];

  useEffect(() => {
    const loadResumeData = async () => {
      if (!TemplateComponent) {
        setLoading(false);
        return;
      }

      if (!resumeId) {
        // Use Mock data
        setData({
          user: {
            name: "Nguyễn Văn Ngoan",
            email: "ngoan@gmail.com",
            phone: "090 123 4567",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
          },
          resume: {
            title: "Hồ sơ của tôi",
            address: "Dương Đông, Phú Quốc",
            summary: "Tôi là một lập trình viên năng động, đầy nhiệt huyết...",
            degree: "Cử nhân CNTT",
            languages: "Tiếng Anh (Giao tiếp), Tiếng Việt (Bản ngữ)",
            skills: "React, Next.js, Node.js, Tailwind CSS",
            socialLinks: [],
            education: [
              {
                school: "Đại học Công nghệ",
                degree: "Cử nhân",
                field: "Công nghệ phần mềm",
                startYear: "2019",
                endYear: "2023",
                GPA: "3.2",
                description: "Học bổng sinh viên xuất sắc kì II năm học 2021-2022"
              }
            ],
            experience: [
              {
                company: "Công ty Công nghệ PQ",
                position: "Frontend Developer",
                startYear: "2023",
                endYear: "Hiện tại",
                description: "Phát triển giao diện người dùng bằng React/Next.js."
              }
            ],
            projects: [
              {
                name: "Website Phú Quốc Jobs",
                position: "Developer chính",
                link: "https://phuquoc.jobs",
                description: "Xây dựng hệ thống tuyển dụng chất lượng cao cho Phú Quốc."
              }
            ],
          }
        });
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/v1/resumes/${resumeId}`, { credentials: "include" });
        if (!response.ok) throw new Error("Failed to load CV");
        const json = await response.json();
        const r = json.data?.data ?? json.data ?? json;
        
        const userObj = {
          name: r.user?.name || r.name || "Họ và Tên",
          email: r.user?.email || r.email || "",
          phone: r.user?.phone || r.phone || "",
          avatar: r.user?.image || r.avatar || "https://i.pravatar.cc/150?img=12",
        };

        const resumeObj = {
          title: r.title || "Hồ sơ của tôi",
          address: r.address || "",
          summary: r.summary || "",
          degree: r.degree || "",
          languages: r.languages || "",
          skills: r.skills || "",
          socialLinks: r.socialLinks || r.socicallink || [],
          education: r.education || [],
          experience: r.experience || [],
          projects: r.projects || [],
        };

        setData({ user: userObj, resume: resumeObj });
      } catch (err) {
        toast.error("Không thể tải thông tin CV của bạn.");
      } finally {
        setLoading(false);
      }
    };

    loadResumeData();
  }, [resumeId, TemplateComponent]);

  if (!TemplateComponent) {
    notFound();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center space-y-3">
          <Spinner size="lg" className="mx-auto" />
          <p className="text-stone-500 text-sm">Đang tải cấu hình CV...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="text-stone-500 text-sm">Không thể tải dữ liệu CV.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9ff] flex flex-col">
      <main className="grow">
        <TemplateComponent user={data.user} resume={data.resume} resumeId={resumeId} />
      </main>
    </div>
  );
}
