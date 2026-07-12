"use client"

import { useScrollAnimation } from "@/hooks/useScrollAnimation"
import { useState, useMemo, useEffect, use, Suspense } from "react"
import Link from "next/link"
import { Share2 } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"
import { CompanyLogo } from "@/components/company/company-logo"
import { Skeleton } from "@/components/ui/skeleton"
import { QuotaUpgradeDialog } from "@/components/quota/quota-upgrade-dialog"
import { timeAgo } from "@/lib/utils/date"
import { formatSalary, jobTypeLabel } from "@/lib/utils/format"

const SIZE_LABELS: Record<string, string> = {
  SIZE_1_50: "1-50 nhân viên",
  SIZE_51_200: "51-200 nhân viên",
  SIZE_201_500: "201-500 nhân viên",
  SIZE_500_PLUS: "500+ nhân viên",
}

interface CompanyData {
  id: string; name: string; slug: string; logo?: string | null;
  coverImage?: string | null;
  website?: string | null; description?: string | null;
  size?: string | null; industry?: string | null;
  addressDetail?: string | null; ward?: { name: string; district?: { name: string } } | null;
  isApproved?: boolean; _count?: { jobs?: number };
}

interface JobData {
  id: string; slug: string; title: string; type: string;
  salaryMin?: number | null; salaryMax?: number | null;
  ward?: { name: string } | null; addressDetail?: string | null;
  deadline?: string | null; createdAt: string;
}

interface Props { company: CompanyData; jobsPromise: Promise<JobData[]> }

export default function CompanyDetailClient({ company, jobsPromise }: Props) {
  useScrollAnimation()
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [quota, setQuota] = useState<{ resource?: string; used?: number; limit?: number } | null>(null)

  useEffect(() => {
    if (!user) {
      setFollowing(false);
      return;
    }

    fetch("/api/v1/saved/companies?limit=500", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        const items = d.data?.items ?? d.data ?? [];
        const isFollowing = items.some((s: any) =>
          s.companyId === company.id || s.company?.id === company.id
        );
        setFollowing(isFollowing);
      })
      .catch(() => { });
  }, [company.id, user]);

  const handleToggleFollow = async () => {
    if (!user) {
      router.push(`/auth/login?redirect=/companies/${company.slug}`);
      return;
    }
    setFollowLoading(true);
    try {
      const res = await fetch(`/api/v1/saved/companies/${company.id}`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const body = await res.json().catch(() => ({}));
        const nextFollowing = Boolean(body?.data?.saved ?? body?.saved);
        setFollowing(nextFollowing);
      } else {
        const body = await res.json().catch(() => ({}));
        const payload = typeof body?.message === "object" ? body.message : body;
        const details = payload?.details ?? payload;
        if (payload?.code === "QUOTA_EXCEEDED") {
          setQuota({ resource: details.resource, used: details.used, limit: details.limit });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFollowLoading(false);
    }
  };

  const location = company.ward
    ? `${company.ward.name}, ${company.ward.district?.name || "Phú Quốc"}`
    : company.addressDetail || "Phú Quốc"
  const jobCount = company._count?.jobs ?? 0

  const tabs = [
    { key: "overview", label: "Tổng quan" },
    { key: "jobs", label: `Việc làm (${jobCount})` },
    { key: "reviews", label: "Đánh giá" },
  ]

  return (
    <div className="bg-[#f7f9ff] dark:bg-[#0a1929] min-h-screen">
      {/* HERO */}
      <div>
        <div className="h-52 md:h-64 relative overflow-hidden" style={{ background: "linear-gradient(135deg,#0E7490,#0D9488)" }}>
          {company.coverImage ? (
            <img src={company.coverImage} alt="Ảnh bìa công ty" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 50%,#67e8f9 0%,transparent 50%),radial-gradient(circle at 80% 20%,#fcd34d 0%,transparent 40%)" }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#005a71]/70 via-[#0E7490]/35 to-[#0D9488]/45" />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#f7f9ff] dark:from-[#0a1929] to-transparent" />
          <div className="absolute top-4 left-4 md:left-8 flex items-center gap-2 text-xs text-white/70">
            <Link href="/" className="hover:text-white">Trang chủ</Link><span>›</span>
            <Link href="/companies" className="hover:text-white">Công ty</Link><span>›</span>
            <span className="text-white">{company.name}</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-12 relative z-10">
          <div className="fade-up stagger-1 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="flex items-end gap-4">
              <CompanyLogo
                name={company.name}
                logo={company.logo}
                className="w-20 h-20 md:w-24 md:h-24 rounded-2xl shadow-xl border-2 border-white dark:border-[#1e3a4f] flex-shrink-0"
                textClassName="text-2xl"
              />
              <div className="pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-bold text-[#001e30] dark:text-white">{company.name}</h1>
                  {company.isApproved && <span className="bg-[#0d9488]/10 text-[#0d9488] text-xs font-bold px-2 py-0.5 rounded-full">✓ Đã xác minh</span>}
                </div>
                <p className="text-sm text-[#3f484c] dark:text-gray-400 mt-0.5">{company.industry || "—"} · {location}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleToggleFollow}
                disabled={followLoading}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all disabled:opacity-60 ${following
                  ? "bg-[#005a71] text-white"
                  : "border border-[#005a71] text-[#005a71] hover:bg-[#005a71]/5"
                  }`}
              >
                {followLoading ? "..." : following ? "✓ Đang theo dõi" : "+ Theo dõi"}
              </button>
              <button className="p-2.5 rounded-full border border-[#bec8cd]/50 dark:border-gray-600 text-[#3f484c] dark:text-gray-300 hover:bg-[#e1efff] dark:hover:bg-[#1e3a4f] transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="fade-up stagger-2 mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: jobCount, label: "Việc đang tuyển", color: "text-[#005a71]" },
              { value: SIZE_LABELS[company.size || ""] || company.size || "—", label: "Nhân viên", color: "text-[#0d9488]" },
              { value: company.industry || "—", label: "Ngành nghề", color: "text-[#F59E0B]" },
              { value: location, label: "Địa chỉ", color: "text-[#8b5cf6]" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white dark:bg-[#0f2436] border border-[#E0F5FB] dark:border-[#1e3a4f] rounded-[0.875rem] p-5 text-center">
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-[#3f484c] dark:text-gray-400 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="fade-up stagger-3 mt-6 flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2.5 text-sm font-semibold rounded-full transition-all whitespace-nowrap ${activeTab === tab.key ? "bg-[#005a71] text-white" : "text-[#6f787d] dark:text-gray-400 hover:bg-[#005a71]/10 hover:text-[#005a71]"}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT */}
          <div className="flex-1 min-w-0">
            {activeTab === "overview" && (
              <div className="bg-white dark:bg-[#0f2436] border border-[#E0F5FB] dark:border-[#1e3a4f] rounded-2xl p-6">
                <h2 className="font-bold text-[#005a71] mb-4">Giới thiệu công ty</h2>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{company.description || "Chưa có mô tả."}</p>
              </div>
            )}

            {activeTab === "jobs" && (
              <Suspense fallback={
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-[#001e30] dark:text-white">Đang tải vị trí tuyển dụng...</p>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between gap-4 bg-white dark:bg-[#0f2436] border border-[#E0F5FB] dark:border-[#1e3a4f] rounded-xl px-5 py-4">
                      <div className="flex-1 min-w-0 space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <div className="flex gap-2 mt-2">
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-5 w-20" />
                          <Skeleton className="h-5 w-24" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              }>
                <JobsTabContent jobsPromise={jobsPromise} />
              </Suspense>
            )}

            {activeTab === "reviews" && (
              <div className="bg-white dark:bg-[#0f2436] border border-[#E0F5FB] dark:border-[#1e3a4f] rounded-2xl p-6 text-center">
                <p className="text-5xl font-bold text-[#F59E0B] mb-2">—</p>
                <p className="text-sm text-gray-500">Chưa có đánh giá. Chức năng đánh giá sẽ sớm được ra mắt.</p>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="w-full lg:w-80 flex-shrink-0 space-y-5">
            <div className="bg-white dark:bg-[#0f2436] border border-[#E0F5FB] dark:border-[#1e3a4f] rounded-2xl p-5">
              <h3 className="font-bold text-sm text-[#005a71] mb-4">Thông tin công ty</h3>
              <div className="space-y-3 text-sm">
                {[
                  { icon: "👥", label: "Quy mô", value: SIZE_LABELS[company.size || ""] || company.size || "—" },
                  { icon: "🏷️", label: "Ngành nghề", value: company.industry || "—" },
                  { icon: "📍", label: "Địa chỉ", value: location },
                  { icon: "🌐", label: "Website", value: company.website || "—", isLink: true },
                ].map((info) => (
                  <div key={info.label} className="flex items-start gap-3">
                    <span className="text-base mt-0.5">{info.icon}</span>
                    <div>
                      <p className="text-xs text-[#3f484c] dark:text-gray-400">{info.label}</p>
                      {info.isLink && info.value !== "—" ? (
                        <a href={`https://${info.value}`} className="font-semibold text-[#005a71] hover:underline">{info.value}</a>
                      ) : (
                        <p className="font-semibold text-[#001e30] dark:text-white">{info.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-[#0f2436] border border-[#E0F5FB] dark:border-[#1e3a4f] rounded-2xl p-5">
              <h3 className="font-bold text-sm text-[#005a71] mb-4">Công ty tương tự</h3>
              <p className="text-sm text-gray-500">Sẽ sớm cập nhật.</p>
            </div>
          </div>
        </div>
      </div>
      <QuotaUpgradeDialog
        open={Boolean(quota)}
        onOpenChange={(nextOpen) => !nextOpen && setQuota(null)}
        resource={quota?.resource}
        used={quota?.used}
        limit={quota?.limit}
      />
    </div>
  )
}

function JobsTabContent({ jobsPromise }: { jobsPromise: Promise<JobData[]> }) {
  const jobs = use(jobsPromise)

  const mappedJobs = useMemo(() => jobs.map(j => ({
    id: j.id, slug: j.slug, title: j.title,
    type: jobTypeLabel(j.type),
    salary: formatSalary(j.salaryMin, j.salaryMax),
    location: j.ward?.name || j.addressDetail || "Phú Quốc",
    daysAgo: timeAgo(j.createdAt),
    deadline: j.deadline ? new Date(j.deadline).toLocaleDateString("vi-VN") : "—",
  })), [jobs])

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-[#001e30] dark:text-white">{mappedJobs.length} vị trí đang tuyển dụng</p>
      {mappedJobs.length === 0 && <p className="text-sm text-gray-500 text-center py-8">Chưa có vị trí tuyển dụng nào.</p>}
      {mappedJobs.map((job) => (
        <Link key={job.id} href={`/jobs/${job.slug}`}
          className="flex items-center justify-between gap-4 bg-white dark:bg-[#0f2436] border border-[#E0F5FB] dark:border-[#1e3a4f] rounded-xl px-5 py-4 hover:shadow-md hover:translate-x-1 transition-all group">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-[#001e30] dark:text-white group-hover:text-[#005a71] transition-colors">{job.title}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="bg-[#0D9488]/10 text-[#0d9488] text-xs font-semibold px-2.5 py-0.5 rounded-md">{job.type}</span>
              <span className="bg-[#0D9488]/10 text-[#0d9488] text-xs font-semibold px-2.5 py-0.5 rounded-md">{job.salary}</span>
              <span className="bg-[#0D9488]/10 text-[#0d9488] text-xs font-semibold px-2.5 py-0.5 rounded-md">{job.location}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-[#3f484c] dark:text-gray-400">{job.daysAgo}</p>
            <p className="text-xs text-red-400 mt-1 font-semibold">HN: {job.deadline}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
