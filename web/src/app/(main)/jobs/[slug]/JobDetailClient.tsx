/**
 * @file JobDetailClient.tsx
 * @description Component hiển thị chi tiết công việc.
 * @note [HuynhhThanh] Đã thêm logic kiểm tra đăng nhập (useAuth) khi nhấn "Ứng tuyển" và "Lưu việc làm". Tự động gọi API kiểm tra trạng thái lưu việc làm và yêu cầu người dùng đăng nhập để thao tác.
 */
"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { OverviewItem } from "@/types/job";
import { Briefcase, Loader2, X, CheckCircle2 } from "lucide-react";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { unwrapApiPayload } from "@/lib/api-client";
import { companyInitials, formatSalary, jobTypeLabel } from "@/lib/utils/format";

import JobDetailHero from "@/components/jobs/JobDetailHero";
import {
  JobDescription,
  JobRequirements,
  JobBenefits,
  JobApplySteps,
} from "@/components/jobs/JobContent";
import {
  JobApplySidebar,
  JobOverviewSidebar,
  JobCompanySidebar,
  JobShareSidebar,
} from "@/components/jobs/JobDetailSidebar";
import RelatedJobs from "@/components/jobs/RelatedJobs";
import JobStickyBarMobile from "@/components/jobs/JobStickyBarMobile";
import DeadlineCard from "@/components/jobs/DeadlineCard";

interface JobData {
  id: string;
  slug: string;
  title: string;
  description: string;
  benefits?: string | null;
  requirements?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  type: string;
  experience?: string | null;
  level?: string | null;
  status: string;
  deadline?: string | null;
  createdAt: string;
  quantity?: number;
  addressDetail?: string | null;
  company: {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    website?: string | null;
    description?: string | null;
    size?: string | null;
    industry?: string | null;
  };
  category?: { id: string; name: string; slug: string } | null;
  ward?: {
    id: string;
    name: string;
    slug: string;
    district?: { id: string; name: string; slug: string; province?: { name: string } | null } | null;
  } | null;
  applications?: { id: string }[];
  _count?: { applications?: number };
}

interface RelatedJob {
  id: string;
  slug: string;
  title: string;
  company: { name: string; logo?: string | null };
  type: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  ward?: { name: string } | null;
}

interface JobDetailClientProps {
  job: JobData;
  relatedJobs: RelatedJob[];
}

function extractResumeList(payload: any): any[] {
  const candidates = [
    payload?.data?.data?.items,
    payload?.data?.data,
    payload?.data?.items,
    payload?.data,
    payload?.items,
    payload,
  ];

  const list = candidates.find(Array.isArray);
  if (!list) return [];

  return list.filter((resume: any) => resume?.id && resume?.title !== "PROFILE_MASTER");
}

const EXP_LABELS: Record<string, string> = {
  NO_EXPERIENCE: "Không yêu cầu",
  UNDER_1_YEAR: "Dưới 1 năm",
  ONE_TO_THREE_YEARS: "1-3 năm",
  THREE_TO_FIVE_YEARS: "3-5 năm",
  OVER_FIVE_YEARS: "Trên 5 năm",
};

const LEVEL_LABELS: Record<string, string> = {
  INTERN: "Thực tập sinh",
  FRESHER: "Fresher",
  JUNIOR: "Junior",
  MID: "Middle",
  SENIOR: "Senior",
  LEAD: "Lead",
  MANAGER: "Manager",
  DIRECTOR: "Director",
};

function getLocation(job: JobData): string {
  if (job.ward) {
    const parts = [job.ward.name];
    if (job.ward.district?.name) parts.push(job.ward.district.name);
    parts.push("Phú Quốc");
    return parts.join(", ");
  }
  return job.addressDetail || "Phú Quốc, Kiên Giang";
}

export default function JobDetailClient({ job, relatedJobs }: JobDetailClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [isApplied, setIsApplied] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsSaved(false);
      setIsApplied(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        // Kiểm tra đã lưu việc làm chưa
        const resSaved = await fetch("/api/v1/saved/jobs?limit=200", { credentials: "include" });
        if (resSaved.ok) {
          const dataSaved = await resSaved.json();
          const itemsSaved = dataSaved.data?.items || dataSaved.items || [];
          if (active) {
            setIsSaved(itemsSaved.some((item: any) => item.jobId === job.id));
          }
        }
      } catch {}

      try {
        // Kiểm tra đã ứng tuyển việc làm chưa
        const resApp = await fetch(`/api/v1/applications/check/${job.id}`, { credentials: "include" });
        if (resApp.ok) {
          const dataApp = await resApp.json();
          const appliedState = unwrapApiPayload<{ applied?: boolean }>(dataApp);
          if (active) {
            setIsApplied(Boolean(appliedState?.applied));
          }
        }
      } catch {}
    })();
    return () => { active = false; };
  }, [user, job.id]);

  const toggleSave = useCallback(async () => {
    if (!user) {
      router.push(`/auth/login?redirect=/jobs/${job.slug}`);
      return;
    }
    try {
      const res = await fetch(`/api/v1/saved/jobs/${job.id}`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) setIsSaved((prev) => !prev);
    } catch {}
  }, [user, router, job.id, job.slug]);

  const deadlinePercent = useMemo(() => {
    if (!job.deadline) return 0;
    const start = new Date(job.createdAt).getTime();
    const end = new Date(job.deadline).getTime();
    const now = Date.now();
    if (now >= end) return 100;
    if (now <= start) return 0;
    return Math.round(((now - start) / (end - start)) * 100);
  }, [job.createdAt, job.deadline]);

  const daysLeft = useMemo(() => {
    if (!job.deadline) return 0;
    const diff = new Date(job.deadline).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [job.deadline]);

  const salary = formatSalary(job.salaryMin, job.salaryMax);
  const location = getLocation(job);
  const companyInitialsText = companyInitials(job.company.name);

  const overviewItems: OverviewItem[] = [
    { icon: "work", iconColor: "text-[#005a71]", bgColor: "bg-[#005a71]/10", label: "Loại hình", value: jobTypeLabel(job.type) },
    { icon: "payments", iconColor: "text-[#0d9488]", bgColor: "bg-[#0d9488]/10", label: "Mức lương", value: salary },
    { icon: "timeline", iconColor: "text-[#D97706]", bgColor: "bg-[#F59E0B]/10", label: "Kinh nghiệm", value: EXP_LABELS[job.experience || ""] || "Không yêu cầu" },
    { icon: "leaderboard", iconColor: "text-[#8b5cf6]", bgColor: "bg-[#8b5cf6]/10", label: "Cấp bậc", value: LEVEL_LABELS[job.level || ""] || "Chưa cập nhật" },
    { icon: "location_on", iconColor: "text-[#0ea5e9]", bgColor: "bg-[#0ea5e9]/10", label: "Địa điểm", value: location },
    ...(job.deadline
      ? [{ icon: "calendar_today", iconColor: "text-red-500", bgColor: "bg-red-100", label: "Hạn nộp", value: new Date(job.deadline).toLocaleDateString("vi-VN"), valueColor: "text-red-500" }]
      : []),
    { icon: "people", iconColor: "text-[#0d9488]", bgColor: "bg-[#0d9488]/10", label: "Số lượng", value: `${job.quantity || 1} người` },
  ];

  const mappedJob = {
    ...job,
    company: job.company.name,
    companyLogo: job.company.logo,
    contractType: jobTypeLabel(job.type),
    salary,
    experience: EXP_LABELS[job.experience || ""] || "Không yêu cầu",
    level: LEVEL_LABELS[job.level || ""] || "",
    location,
    companyInitials: companyInitialsText,
    logoColor: "#0E7490",
    textColor: "#ffffff",
    isFeatured: false,
    isUrgent: false,
    daysLeft,
    postedDate: job.createdAt,
    tags: [jobTypeLabel(job.type), salary, EXP_LABELS[job.experience || ""] || ""],
    startDate: job.createdAt,
    totalSlots: job.quantity || 1,
    companySize: job.company.size || "",
    companyWebsite: job.company.website || "",
    companyIndustry: job.company.industry || "",
    companyAddress: location,
    views: 0,
    applicants: job._count?.applications ?? job.applications?.length ?? 0,
    industry: job.company.industry || "",
    required: job.requirements ? [job.requirements] : [],
    preferred: [],
    benefits: job.benefits
      ? [{ icon: "payments", iconColor: "text-[#0e7490]", bgColor: "bg-[#0e7490]/5", title: "Phúc lợi", description: job.benefits }]
      : [],
  };

  const mappedRelated = relatedJobs.map((r) => ({
    id: r.id,
    slug: r.slug,
    logoTextColor: "#ffffff",
    companyInitials: companyInitials(r.company.name),
    title: r.title,
    company: r.company.name,
    contractType: jobTypeLabel(r.type),
    salary: formatSalary(r.salaryMin, r.salaryMax),
    location: r.ward?.name || "Phú Quốc",
  }));

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applyTab, setApplyTab] = useState<"select" | "upload">("select");
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const openApplyModal = async () => {
    if (!user) {
      router.push(`/auth/login?redirect=/jobs/${job.slug}`);
      return;
    }
    if (isApplied) return;
    setShowApplyModal(true);
    setApplyError(null);
    // Fetch user's resumes
    try {
      const res = await fetch("/api/v1/resumes/my", { credentials: "include" });
      if (res.ok) {
        const d = await res.json();
        const list = extractResumeList(d);
        setResumes(list);
        const defaultResume = list.find((r: any) => r.isDefault);
        if (defaultResume) setSelectedResumeId(defaultResume.id);
        else if (list.length > 0) setSelectedResumeId(list[0].id);
      }
    } catch {}
  };

  const handleApply = async () => {
    setApplying(true);
    setApplyError(null);
    try {
      const body: Record<string, unknown> = { jobId: job.id };
      if (coverLetter) body.coverLetter = coverLetter;
      if (applyTab === "select" && selectedResumeId) body.resumeId = selectedResumeId;
      if (applyTab === "upload") {
        if (!uploadedFile) {
          throw new Error("Vui lòng chọn file CV PDF");
        }

        const formData = new FormData();
        formData.append("file", uploadedFile);
        const uploadRes = await fetch("/api/v1/upload/candidate-cv", {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        const uploadBody = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) {
          throw new Error(uploadBody?.message || "Upload CV thất bại");
        }

        const uploadData = uploadBody?.data?.data ?? uploadBody?.data;
        if (!uploadData?.cvUrl) {
          throw new Error("Upload CV không trả về URL hợp lệ");
        }
        body.cvUrl = uploadData.cvUrl;
      }

      const res = await fetch("/api/v1/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || `HTTP ${res.status}`);
      }
      setApplySuccess(true);
      setIsApplied(true);
      setShowApplyModal(false);
      setCoverLetter("");
      setUploadedFile(null);
    } catch (e) {
      setApplyError(e instanceof Error ? e.message : "Ứng tuyển thất bại");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0 transition-colors duration-200">
      <JobDetailHero job={mappedJob as any} onBookmark={toggleSave} isBookmarked={isSaved} />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-5">
            <DeadlineCard daysLeft={daysLeft} startDate={job.createdAt} deadline={job.deadline || ""} deadlinePercent={deadlinePercent} />
            <JobDescription description={job.description || "<p>Đang cập nhật</p>"} />
            <JobRequirements required={job.requirements || undefined} preferred={undefined} />
            <JobBenefits benefits={job.benefits || undefined} />
            <JobApplySteps />
          </div>

          <div className="space-y-5">
            <JobApplySidebar onApply={openApplyModal} onSave={toggleSave} isSaved={isSaved} isApplied={isApplied} />
            <JobOverviewSidebar items={overviewItems} />
            <JobCompanySidebar
              companyLogo={job.company.logo}
              companyName={job.company.name}
              companySlug={job.company.slug}
              industry={job.company.industry || ""}
              size={job.company.size || ""}
              address={location}
              website={job.company.website || ""}
            />
            <JobShareSidebar jobTitle={job.title} />
          </div>
        </div>

        <RelatedJobs jobs={mappedRelated} />
      </div>

      <JobStickyBarMobile onApply={openApplyModal} onBookmark={toggleSave} isBookmarked={isSaved} isApplied={isApplied} />

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0d2d42] rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Ứng tuyển: {job.title}</h3>
              <button onClick={() => setShowApplyModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Tại {job.company.name}</p>

            {applyError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">{applyError}</div>
            )}

            {/* CV Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setApplyTab("select")}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${applyTab === "select" ? "bg-[#0E7490] text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
              >
                CV đã lưu
              </button>
              <button
                onClick={() => setApplyTab("upload")}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${applyTab === "upload" ? "bg-[#0E7490] text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
              >
                Upload PDF
              </button>
            </div>

            {/* Tab Content */}
            {applyTab === "select" ? (
              <div className="mb-4">
                <label className="text-sm font-medium mb-1.5 block">Chọn CV</label>
                {resumes.length === 0 ? (
                  <p className="text-sm text-gray-500">Bạn chưa có CV. Hãy tạo CV trước khi ứng tuyển.</p>
                ) : (
                  <select
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#071a2b] dark:border-gray-600"
                  >
                    {resumes.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        {r.title} {r.isDefault ? "(Mặc định)" : ""} — {r.template?.name || ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              <div className="mb-4">
                <label className="text-sm font-medium mb-1.5 block">Upload CV (PDF)</label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="cv-upload"
                  />
                  <label htmlFor="cv-upload" className="cursor-pointer">
                    <div className="text-gray-500 dark:text-gray-400">
                      <p className="text-sm">Kéo thả hoặc click để chọn file PDF</p>
                      <p className="text-xs mt-1">Tối đa 10MB</p>
                    </div>
                  </label>
                  {uploadedFile && (
                    <p className="mt-2 text-sm text-[#0E7490] font-medium">{uploadedFile.name}</p>
                  )}
                </div>
              </div>
            )}

            {/* Cover Letter */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-1.5 block">Thư giới thiệu (tùy chọn)</label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={3}
                placeholder="Giới thiệu ngắn gọn về bản thân và lý do bạn phù hợp với vị trí này..."
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#071a2b] dark:border-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-[#0E7490]"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowApplyModal(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Hủy</button>
              <button onClick={handleApply} disabled={applying || (applyTab === "select" && resumes.length === 0)} className="px-6 py-2 text-sm bg-[#0E7490] hover:bg-[#005a71] text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2">
                {applying ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang gửi...</> : "Gửi đơn ứng tuyển"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {applySuccess && (
        <div className="fixed bottom-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-medium">Ứng tuyển thành công! Nhà tuyển dụng sẽ phản hồi sớm.</span>
          <button onClick={() => setApplySuccess(false)} className="ml-2 hover:bg-green-700 rounded p-0.5"><X className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}
