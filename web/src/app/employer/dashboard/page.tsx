/**
 * TÊN TRANG: Tổng quan Nhà tuyển dụng (Employer Dashboard)
 * MÔ TẢ: Hiển thị thống kê, trạng thái tin tuyển dụng, hồ sơ mới nhất và thông báo.
 */
"use client";

import { useMemo } from "react";
import { EmployerDashboardAiTab } from "@/components/ai/dashboard-ai-tab";
import { QuotaUsageCard } from "@/components/quota/quota-usage-card";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { DashboardHeader } from "@/features/employer-dashboard/components/dashboard-header";
import { DashboardStatCards } from "@/features/employer-dashboard/components/dashboard-stat-cards";
import { HiringSummaryCard } from "@/features/employer-dashboard/components/hiring-summary-card";
import { NotificationsPanel } from "@/features/employer-dashboard/components/notifications-panel";
import { QuickActionsCard } from "@/features/employer-dashboard/components/quick-actions-card";
import { RecentApplicantsPanel } from "@/features/employer-dashboard/components/recent-applicants-panel";
import { RecentJobsTable } from "@/features/employer-dashboard/components/recent-jobs-table";
import type {
  DashboardApplicant,
  DashboardJob,
  DashboardNotification,
} from "@/features/employer-dashboard/types";
import { timeAgo } from "@/features/employer-dashboard/utils";
import { useEmployerDashboardSummary } from "@/features/dashboard/queries";

export default function EmployerDashboard() {
  const { data: summary, isLoading: loading, error, refetch } = useEmployerDashboardSummary();

  const jobs = useMemo<DashboardJob[]>(() => (summary?.jobs.recent || []).map((job: Record<string, unknown>) => ({
    id: job.id as string,
    title: job.title as string,
    status: job.status as string,
    jobType: job.type as string,
    level: job.level as string,
    applicationCount: (job._count as { applications?: number })?.applications ?? 0,
    deadline: job.deadline as string | undefined,
  })), [summary?.jobs.recent]);

  const applicants = useMemo<DashboardApplicant[]>(() => {
    const colors = [
      { gradientFrom: "from-[#0e7490]", gradientTo: "to-[#0d9488]" },
      { gradientFrom: "from-[#F59E0B]", gradientTo: "to-[#D97706]" },
      { gradientFrom: "from-[#059669]", gradientTo: "to-[#0d9488]" },
      { gradientFrom: "from-[#6366f1]", gradientTo: "to-[#4f46e5]" },
    ];

    return (summary?.applications.recent || []).map((application: Record<string, unknown>, index: number) => {
      const user = application.user as { name?: string; email?: string } | undefined;
      const job = application.job as { title?: string } | undefined;
      const name = user?.name || user?.email || "Ẩn danh";
      return {
        id: application.id as string,
        name,
        initials: name.split(" ").filter(Boolean).map((word: string) => word[0]).slice(0, 2).join("").toUpperCase(),
        jobTitle: job?.title || "",
        timeAgo: timeAgo(application.createdAt as string),
        status: application.status as DashboardApplicant["status"],
        coverPreview: (application.coverLetter as string)?.slice(0, 80),
        ...colors[index % colors.length],
      };
    });
  }, [summary?.applications.recent]);

  const notifications = useMemo<DashboardNotification[]>(() => (summary?.notifications.recent || []).map((notification: any) => ({
    id: notification.id as string,
    type: notification.type as DashboardNotification["type"],
    title: notification.title as string,
    message: notification.content as string,
    timeAgo: timeAgo(notification.createdAt as string),
  })), [summary?.notifications.recent]);

  const company = summary?.company as { name?: string } | null | undefined;

  const stats = useMemo(() => {
    const activeJobs = summary?.jobs.active ?? jobs.filter((job) => job.status === "ACTIVE").length;
    const totalApplicants = summary?.applications.total ?? jobs.reduce((sum, job) => sum + (job.applicationCount ?? 0), 0);
    const pendingCount = summary?.applications.pending ?? applicants.filter((applicant) => applicant.status === "PENDING").length;
    return { activeJobs, totalApplicants, pendingCount };
  }, [summary?.jobs.active, summary?.applications.total, summary?.applications.pending, jobs, applicants]);

  const quotaItems = summary?.quota
    ? [
        { resource: "employerJobs", label: "Tin tuyển dụng", ...summary.quota.jobs },
        { resource: "employerActiveJobs", label: "Tin đang chạy", ...summary.quota.activeJobs },
        { resource: "employerDurationDaysMax", label: "Ngày đăng tối đa", ...summary.quota.durationDaysMax },
        { resource: "employerBoostLevelMax", label: "Mức nổi bật tối đa", ...summary.quota.boostLevelMax },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
        <h2 className="mb-2 text-lg font-bold text-red-700 dark:text-red-400">Lỗi tải dữ liệu</h2>
        <p className="text-sm text-red-600 dark:text-red-300">
          {error instanceof Error ? error.message : "Không thể tải dữ liệu dashboard"}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <DashboardHeader companyName={company?.name} />

      <TabsContent value="overview" className="space-y-6">
        <DashboardStatCards stats={stats} jobs={jobs} />

        {quotaItems.length > 0 && (
          <QuotaUsageCard title="Dung lượng gói đăng tuyển" items={quotaItems} />
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <HiringSummaryCard stats={stats} jobs={jobs} />
          <QuickActionsCard pendingCount={stats.pendingCount} />
        </div>

        <RecentJobsTable jobs={jobs} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RecentApplicantsPanel applicants={applicants} />
          <NotificationsPanel notifications={notifications} />
        </div>
      </TabsContent>

      <TabsContent value="ai">
        <EmployerDashboardAiTab
          title="Hiring Co-worker"
          initialMessage="Xin chào! Tôi là Hiring Co-worker. Tôi có thể tóm tắt pipeline, ưu tiên hồ sơ cần xử lý, gợi ý job cần tối ưu và soạn email nháp cho ứng viên."
          contextDescription="Employer dashboard context: jobs, applicants, notifications, and pipeline stats."
          contextValue={{ jobs, applicants, notifications, stats }}
        />
      </TabsContent>
    </Tabs>
  );
}
