"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";

import { PersonalInfoSection } from "@/components/profile/PersonalInfoSection";
import { ExperienceSection } from "@/components/profile/ExperienceSection";
import { EducationSection } from "@/components/profile/EducationSection";
import { ProjectSection } from "@/components/profile/ProjectSection";
import { SocialSection } from "@/components/profile/SocialSection";
import { SecuritySection } from "@/components/profile/SecuritySection";

type ActiveTab = "personal" | "experience" | "education" | "projects" | "social" | "security";

export default function ProfilePage() {
  const { user, setUser, refresh } = useAuth();
  
  const [activeTab, setActiveTab] = useState<ActiveTab>("personal");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Resume state
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [resumeData, setResumeData] = useState<{
    address: string;
    degree: string;
    languages: string;
    summary: string;
    experience: any[];
    education: any[];
    projects: any[];
    socialLinks: any[];
    templateId: string;
  } | null>(null);

  // Fetch candidate resumes to find default or first one
  const loadProfileAndResume = async () => {
    setLoading(true);
    try {
      // Fetch resumes
      const res = await fetch("/api/v1/resumes/my", { credentials: "include" });
      if (res.ok) {
        const result = await res.json();
        const resumes = result.data?.data ?? result.data ?? [];
        
        // Find default or first resume
        const defaultResume = resumes.find((r: any) => r.isDefault) || resumes[0];
        
        if (defaultResume) {
          setResumeId(defaultResume.id);
          setResumeData({
            address: defaultResume.address || "",
            degree: defaultResume.degree || "Đại học",
            languages: defaultResume.languages || "",
            summary: defaultResume.summary || "",
            experience: defaultResume.experience || [],
            education: defaultResume.education || [],
            projects: defaultResume.projects || [],
            socialLinks: defaultResume.socialLinks || [],
            templateId: defaultResume.templateId || "",
          });
        } else {
          // If no resume, fetch templates to have a fallback templateId when creating
          const tRes = await fetch("/api/v1/resumes/templates", { credentials: "include" });
          let templateId = "tpl-minimal-03"; // fallback
          if (tRes.ok) {
            const templates = await tRes.json();
            if (templates && templates.length > 0) {
              templateId = templates[0].id;
            }
          }
          
          setResumeData({
            address: "",
            degree: "Đại học",
            languages: "",
            summary: "",
            experience: [],
            education: [],
            projects: [],
            socialLinks: [],
            templateId: templateId,
          });
        }
      }
    } catch (err) {
      console.error("Error loading profile/resume:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileAndResume();
  }, []);

  // Save changes wrapper
  const handleSaveData = async (updates: Partial<typeof resumeData> & { 
    name?: string; 
    phone?: string; 
    image?: string | null; 
  }) => {
    setSaving(true);
    try {
      // 1. Update user profile if user fields are updated
      if (updates.name !== undefined || updates.phone !== undefined || updates.image !== undefined) {
        const patchBody: any = {};
        if (updates.name !== undefined) patchBody.name = updates.name;
        if (updates.phone !== undefined) patchBody.phone = updates.phone;
        if (updates.image !== undefined) patchBody.image = updates.image;

        const res = await fetch("/api/v1/auth/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(patchBody),
        });

        if (res.ok) {
          const payload = await res.json().catch(() => null);
          const updated = payload?.data?.user || payload?.user || null;
          if (updated) {
            setUser(updated);
          }
        } else {
          throw new Error("Không thể cập nhật thông tin tài khoản");
        }
      }

      // 2. Update resume if resume fields are updated
      const hasResumeUpdates = 
        updates.address !== undefined ||
        updates.degree !== undefined ||
        updates.languages !== undefined ||
        updates.summary !== undefined ||
        updates.experience !== undefined ||
        updates.education !== undefined ||
        updates.projects !== undefined ||
        updates.socialLinks !== undefined;

      if (hasResumeUpdates && resumeData) {
        const url = resumeId ? `/api/v1/resumes/${resumeId}` : "/api/v1/resumes";
        const method = resumeId ? "PATCH" : "POST";
        
        const resumeBody = {
          title: "Hồ sơ của tôi",
          isDefault: true,
          templateId: resumeData.templateId,
          address: updates.address !== undefined ? updates.address : resumeData.address,
          degree: updates.degree !== undefined ? updates.degree : resumeData.degree,
          languages: updates.languages !== undefined ? updates.languages : resumeData.languages,
          summary: updates.summary !== undefined ? updates.summary : resumeData.summary,
          experience: updates.experience !== undefined ? updates.experience : resumeData.experience,
          education: updates.education !== undefined ? updates.education : resumeData.education,
          projects: updates.projects !== undefined ? updates.projects : resumeData.projects,
          socialLinks: updates.socialLinks !== undefined ? updates.socialLinks : resumeData.socialLinks,
        };

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(resumeBody),
        });

        if (res.ok) {
          const result = await res.json();
          const savedResume = result.data?.data ?? result.data ?? result;
          if (savedResume && savedResume.id) {
            setResumeId(savedResume.id);
          }
          
          // Merge local updates
          setResumeData(prev => prev ? {
            ...prev,
            ...updates
          } : null);
        } else {
          throw new Error("Không thể cập nhật hồ sơ CV");
        }
      }

      toast.success("Cập nhật thông tin thành công!");
    } catch (err: any) {
      toast.error(err.message || "Đã xảy ra lỗi khi lưu thông tin");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  const tabsList = [
    { id: "personal", label: "Thông tin cá nhân" },
    { id: "experience", label: "Kinh nghiệm" },
    { id: "education", label: "Học vấn" },
    { id: "projects", label: "Dự án" },
    { id: "social", label: "Mạng xã hội" },
    { id: "security", label: "Bảo mật" },
  ] as const;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Title & Navigation */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Link href="/candidate/dashboard" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Hồ sơ cá nhân</h1>
        </div>
        <p className="text-muted-foreground text-sm pl-7">
          Cập nhật thông tin để tăng cơ hội được nhà tuyển dụng chú ý
        </p>
      </div>

      {/* Tabs Row */}
      <div className="flex flex-wrap gap-2 pb-2 overflow-x-auto scrollbar-none border-b border-border">
        {tabsList.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? "bg-teal-700 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Selected Component render */}
      <div className="mt-4 transition-all duration-300">
        {activeTab === "personal" && user && (
          <PersonalInfoSection
            user={user}
            resume={resumeData}
            saving={saving}
            onSave={handleSaveData}
          />
        )}
        {activeTab === "experience" && (
          <ExperienceSection
            experienceList={resumeData?.experience || []}
            saving={saving}
            onSave={(list) => handleSaveData({ experience: list })}
          />
        )}
        {activeTab === "education" && (
          <EducationSection
            educationList={resumeData?.education || []}
            saving={saving}
            onSave={(list) => handleSaveData({ education: list })}
          />
        )}
        {activeTab === "projects" && (
          <ProjectSection
            projectList={resumeData?.projects || []}
            saving={saving}
            onSave={(list) => handleSaveData({ projects: list })}
          />
        )}
        {activeTab === "social" && (
          <SocialSection
            socialLinks={resumeData?.socialLinks || []}
            saving={saving}
            onSave={(list) => handleSaveData({ socialLinks: list })}
          />
        )}
        {activeTab === "security" && <SecuritySection />}
      </div>
    </div>
  );
}
