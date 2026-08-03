/**
 * @file JobDetailClient.tsx
 * @description Component hiển thị chi tiết công việc.
 * @note [HuynhhThanh] Đã thêm logic kiểm tra đăng nhập (useAuth) khi nhấn "Ứng tuyển" và "Lưu việc làm". Tự động gọi API kiểm tra trạng thái lưu việc làm và yêu cầu người dùng đăng nhập để thao tác.
 */
"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { OverviewItem } from "@/types/job";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { companyInitials, formatSalary, jobTypeLabel } from "@/lib/utils/format";
import { checkApplication, getSavedJobIds, saveJob, unsaveJob } from "@/features/job-detail/api";
import { JobApplyModal } from "@/features/job-detail/job-apply-modal";
import { useJobApplyFlow } from "@/features/job-detail/use-job-apply-flow";

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
import { ReportModal } from "@/components/common/ReportModal";
import { Button } from "@/components/ui/button";
import { Flag } from "lucide-react";
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
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
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
        const savedIds = await getSavedJobIds();
        if (active) {
          setIsSaved(savedIds.has(job.id));
        }
      } catch {}

      try {
        const applied = await checkApplication(job.id);
        if (active) {
          setIsApplied(applied);
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
      if (isSaved) await unsaveJob(job.id);
      else await saveJob(job.id);
      setIsSaved((prev) => !prev);
    } catch {}
  }, [user, router, job.id, job.slug, isSaved]);

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

  const applyFlow = useJobApplyFlow({
    jobId: job.id,
    jobSlug: job.slug,
    user,
    isApplied,
    onApplied: () => setIsApplied(true),
  });

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
            <JobApplySidebar onApply={applyFlow.openApplyModal} onSave={toggleSave} isSaved={isSaved} isApplied={isApplied} />
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

            <div className="bg-card border rounded-xl p-5 text-center">
              <p className="text-sm text-muted-foreground mb-3">Bạn thấy tin tuyển dụng này có vấn đề?</p>
              <Button variant="outline" className="w-full text-muted-foreground hover:text-destructive" onClick={() => setIsReportModalOpen(true)}>
                <Flag className="w-4 h-4 mr-2" /> Báo cáo việc làm
              </Button>
            </div>
          </div>
        </div>

        <RelatedJobs jobs={mappedRelated} />
      </div>

      <JobStickyBarMobile onApply={applyFlow.openApplyModal} onBookmark={toggleSave} isBookmarked={isSaved} isApplied={isApplied} />

      <JobApplyModal jobTitle={job.title} companyName={job.company.name} applyFlow={applyFlow} />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        entityType="job"
        entityId={job.id}
        entityTitle={job.title}
      />
    </div>
  );
}
