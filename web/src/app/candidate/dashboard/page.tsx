"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Bookmark, Search, Briefcase, ArrowRight, CheckCircle2, Circle, Plus, Sparkles } from "lucide-react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentApplications } from "@/components/dashboard/recent-applications";
import { CandidateDashboardAiTab } from "@/components/ai/dashboard-ai-tab";
import { timeAgo } from "@/lib/utils/date";
import { formatSalary, jobTypeLabel, companyInitials } from "@/lib/utils/format";
import { useAuth } from "@/components/auth/auth-provider";
import { useCandidateDashboardSummary } from "@/lib/dashboard-queries";
import { computeProfileCompletion } from "@/lib/profile-completion";
import { QuotaUsageCard } from "@/components/quota/quota-usage-card";

interface Application { id: string; job: { title: string; company: { name: string } }; createdAt: string; status: "PENDING" | "REVIEWING" | "ACCEPTED" | "REJECTED"; }
interface SavedJob { id: string; job: { id: string; slug?: string; title: string; company: { name: string }; type?: string; jobType?: string; salaryMin?: number; salaryMax?: number; deadline?: string | null }; createdAt: string; }
interface Notification { id: string; type: string; title: string; content: string; createdAt: string; isRead: boolean; }
interface Resume { id: string; }

function daysLeft(deadline?: string | null): number | null {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}


export default function CandidateDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(user as Record<string, unknown> | null);
  const { data: summary, isLoading: loading, error, refetch } = useCandidateDashboardSummary(!!user);

  useEffect(() => {
    async function fetchProfileResume() {
      try {
        const res = await fetch("/api/v1/resumes/profile", { credentials: "include" });
        if (res.ok) {
          const payload = await res.json();
          const profileData = payload?.data?.data || payload?.data || {};
          setProfile(profileData);
        }
      } catch (err) {
        console.error("Error fetching profile resume on dashboard:", err);
      }
    }
    if (user) {
      fetchProfileResume();
    }
  }, [user]);

  const applications = (summary?.applications.recent || []) as Application[];
  const savedJobs = (summary?.savedJobs.recent || []) as SavedJob[];
  const savedCompanies = Array.from({ length: summary?.savedCompanies.total || 0 });
  const notifications = (summary?.notifications.recent || []) as Notification[];
  const resumes = (summary?.resumes.recent || []) as Resume[];

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  if (error) return (
    <div className="p-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
      <h2 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">Lỗi tải dữ liệu</h2>
      <p className="text-sm text-red-600 dark:text-red-300">{error instanceof Error ? error.message : "Failed to fetch data"}</p>
      <button onClick={() => refetch()} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Thử lại</button>
    </div>
  );

  const { items: checklistItems, completionPct } = computeProfileCompletion(profile);
  const checklist = checklistItems.map((item) => ({ ...item, href: "/candidate/profile" }));
  const unreadNotifs = summary?.notifications.unreadCount || 0;
  const quotaItems = summary?.quota
    ? [
        { resource: "candidateApplications", label: "Đơn ứng tuyển", ...summary.quota.applications },
        { resource: "candidateResumes", label: "CV đã tạo", ...summary.quota.resumes },
        { resource: "savedJobs", label: "Việc đã lưu", ...summary.quota.savedJobs },
        { resource: "savedCompanies", label: "Công ty theo dõi", ...summary.quota.savedCompanies },
      ]
    : [];

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-[#E0F2FE]">Xin chào{profile?.name ? `, ${String(profile.name)}` : ""} 👋</h1>
          <p className="text-sm text-gray-500 dark:text-[#94A3B8] mt-1">
            {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} • Phú Quốc
          </p>
        </div>
        <TabsList className="w-full md:w-fit">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="ai">
            <Sparkles className="size-4" />
            AI Co-worker
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="overview" className="space-y-6">
        {/* Stats */}
        <StatsCards
          applicationsCount={summary?.applications.total || applications.length}
          savedJobsCount={summary?.savedJobs.total || savedJobs.length}
          followedCompaniesCount={summary?.savedCompanies.total || savedCompanies.length}
          resumesCount={summary?.resumes.total || resumes.length}
        />

        {quotaItems.length > 0 && (
          <QuotaUsageCard title="Dung lượng tài khoản" items={quotaItems} />
        )}

        {/* Profile + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-[#e1efff] dark:border-[#1E5F74]/50 dark:bg-[#0d2d42] bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,90,113,0.06)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-bold text-gray-900 dark:text-[#E0F2FE]">Hoàn thiện hồ sơ</CardTitle>
              <Link href="/candidate/profile" className="text-xs font-semibold text-[#005a71] hover:opacity-80 dark:text-[#67E8F9]">Chỉnh sửa →</Link>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="mb-5">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500 dark:text-[#94A3B8]">Tổng thể</span>
                  <span className="font-bold text-[#005a71] dark:text-[#67E8F9]">{completionPct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#e1efff] dark:bg-[#1E5F74]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#005a71] to-[#0e7490] transition-all duration-500" style={{ width: `${completionPct}%` }} />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {checklist.map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    {item.done ? (
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"><CheckCircle2 className="size-3.5 text-green-600" /></div>
                    ) : (
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-[#1E5F74]/30"><Circle className="size-3.5 text-gray-400" /></div>
                    )}
                    <span className={`text-sm ${item.done ? "text-gray-900 dark:text-[#E0F2FE]" : "text-gray-500 dark:text-[#94A3B8]"}`}>{item.label}</span>
                    {item.done ? (
                      <span className="ml-auto text-xs font-medium text-green-600">Hoàn thành</span>
                    ) : (
                      <Link href={item.href} className="ml-auto text-xs font-medium text-[#005a71] hover:opacity-80 dark:text-[#67E8F9]"><Plus className="mr-0.5 inline size-3" />Thêm</Link>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e1efff] dark:border-[#1E5F74]/50 dark:bg-[#0d2d42] bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,90,113,0.06)]">
            <CardHeader className="pb-2"><CardTitle className="text-base font-bold text-gray-900 dark:text-[#E0F2FE]">Thao tác nhanh</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col gap-3">
                {[
                  { href: "/jobs", icon: <Search className="size-5 text-[#005a71] dark:text-[#67E8F9]" />, title: "Tìm việc làm", desc: "1,200+ việc đang tuyển", color: "bg-[#005a71]/5 hover:bg-[#005a71]/10 dark:bg-[#005a71]/10 dark:hover:bg-[#005a71]/20" },
                  { href: "/candidate/resumes", icon: <FileText className="size-5 text-[#F59E0B]" />, title: "Cập nhật CV", desc: "CV Builder online", color: "bg-[#F59E0B]/5 hover:bg-[#F59E0B]/10 dark:bg-[#F59E0B]/10 dark:hover:bg-[#F59E0B]/20" },
                  { href: "/candidate/applications", icon: <Briefcase className="size-5 text-[#0d9488] dark:text-[#2DD4BF]" />, title: "Đơn ứng tuyển", desc: `${applications.length} đơn đang xử lý`, color: "bg-[#0d9488]/5 hover:bg-[#0d9488]/10 dark:bg-[#0d9488]/10 dark:hover:bg-[#0d9488]/20" },
                  { href: "/candidate/saved", icon: <Bookmark className="size-5 text-blue-600" />, title: "Việc đã lưu", desc: `${savedJobs.length} việc làm`, color: "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/10 dark:hover:bg-blue-900/20" },
                ].map((item) => (
                  <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${item.color} group`}>
                    {item.icon}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-[#E0F2FE]">{item.title}</p>
                      <p className="text-xs text-gray-500 dark:text-[#94A3B8]">{item.desc}</p>
                    </div>
                    <ArrowRight className="size-4 text-gray-400 transition-colors group-hover:text-[#005a71] dark:group-hover:text-[#67E8F9]" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Applications */}
        <RecentApplications applications={applications} />

        {/* Saved Jobs + Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Saved Jobs */}
          <Card className="border-[#e1efff] dark:border-[#1E5F74]/50 dark:bg-[#0d2d42] bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,90,113,0.06)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-bold text-gray-900 dark:text-[#E0F2FE]">Việc làm đã lưu</CardTitle>
              <Link href="/candidate/saved" className="text-xs font-semibold text-[#005a71] hover:opacity-80 dark:text-[#67E8F9]">Xem tất cả →</Link>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col gap-3">
                {savedJobs
                  .filter((sj) => {
                    const days = daysLeft(sj.job?.deadline);
                    return days === null || days >= 0;
                  })
                  .map((sj) => {
                    const job = sj.job;
                    const company = job?.company?.name || "N/A";
                    return (
                      <Link key={sj.id} href={job?.slug ? `/jobs/${job.slug}` : "/jobs"} className="flex items-start gap-3 rounded-xl border border-[#e1efff] dark:border-[#1E5F74]/50 bg-white dark:bg-[#0d2d42]/40 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#005a71]/10 text-sm font-bold text-[#005a71] dark:text-[#67E8F9]">{companyInitials(company)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold leading-snug text-gray-900 dark:text-[#E0F2FE]">{job?.title || "N/A"}</p>
                          <p className="text-xs text-gray-500 dark:text-[#94A3B8]">{company}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            <span className="rounded-md bg-[#0d9488]/10 px-2 py-0.5 text-xs font-medium text-[#0d9488]">{jobTypeLabel(job?.type || job?.jobType || "")}</span>
                            <span className="rounded-md bg-[#0d9488]/10 px-2 py-0.5 text-xs font-medium text-[#0d9488]">{formatSalary(job?.salaryMin, job?.salaryMax)}</span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">{timeAgo(sj.createdAt)}</span>
                      </Link>
                    );
                  })}
                {savedJobs.filter((sj) => {
                  const days = daysLeft(sj.job?.deadline);
                  return days === null || days >= 0;
                }).length === 0 && <p className="py-8 text-center text-sm text-gray-400">Chưa lưu việc làm nào</p>}
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="border-[#e1efff] dark:border-[#1E5F74]/50 dark:bg-[#0d2d42] bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,90,113,0.06)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-bold text-gray-900 dark:text-[#E0F2FE]">Thông báo</CardTitle>
              {unreadNotifs > 0 && <Badge className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white border-transparent">{unreadNotifs} mới</Badge>}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col gap-3">
                {notifications.map((notif) => (
                  <div key={notif.id} className="flex items-start gap-3 rounded-xl p-3 hover:bg-gray-50 dark:hover:bg-[#1E5F74]/10 transition-colors">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"><Circle className="size-4 text-gray-500" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-[#E0F2FE]">{notif.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-[#94A3B8] line-clamp-2">{notif.content}</p>
                      <p className="mt-1 text-xs text-gray-400">{timeAgo(notif.createdAt)}</p>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && <p className="py-8 text-center text-sm text-gray-400">Không có thông báo</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="ai">
        <CandidateDashboardAiTab
          title="Career Co-worker"
          initialMessage="Xin chào! Tôi là Career Co-worker. Tôi có thể xem nhanh hồ sơ, CV, đơn ứng tuyển và việc đã lưu để gợi ý bước tiếp theo cho bạn."
          contextDescription="Candidate dashboard context: user, profile checklist, applications, saved jobs, resumes, notifications."
          contextValue={{ user, profile, completionPct, checklist, applications, savedJobs, resumes, notifications }}
        />
      </TabsContent>
    </Tabs>
  );
}
