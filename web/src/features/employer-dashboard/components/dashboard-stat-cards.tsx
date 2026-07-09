import type { ReactNode } from "react";
import { Briefcase, Clock, Eye, FileText } from "lucide-react";
import type { DashboardJob, DashboardStats } from "../types";

interface DashboardStatCardsProps {
  stats: DashboardStats;
  jobs: DashboardJob[];
}

export function DashboardStatCards({ stats, jobs }: DashboardStatCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        icon={<Briefcase className="h-5 w-5 text-[#F59E0B]" />}
        iconClassName="bg-[#F59E0B]/10"
        value={stats.activeJobs}
        label="Tin đang tuyển"
        badge={jobs.some((job) => job.newApplicationCount) ? "Có cập nhật" : undefined}
        badgeClassName="bg-green-50 text-green-600 dark:bg-green-900/20"
      />
      <StatCard
        icon={<FileText className="h-5 w-5 text-blue-600" />}
        iconClassName="bg-blue-50 dark:bg-blue-900/20"
        value={stats.totalApplicants}
        label="Tổng hồ sơ nhận"
        badge={stats.pendingCount > 0 ? `${stats.pendingCount} mới` : undefined}
        badgeClassName="bg-[#F59E0B]/10 text-[#F59E0B]"
      />
      <StatCard
        icon={<Clock className="h-5 w-5 text-amber-600" />}
        iconClassName="bg-amber-50 dark:bg-amber-900/20"
        value={stats.pendingCount}
        label="Cần xem xét"
        badge="Chờ duyệt"
        badgeClassName="bg-[#e1efff] text-[#3f484c] dark:bg-[#1E5F74]/30 dark:text-[#94A3B8]"
      />
      <StatCard
        icon={<Eye className="h-5 w-5 text-[#0d9488] dark:text-[#2DD4BF]" />}
        iconClassName="bg-[#0d9488]/10"
        value={stats.totalApplicants}
        label="Tổng ứng viên"
      />
    </div>
  );
}

function StatCard(props: {
  icon: ReactNode;
  iconClassName: string;
  value: number;
  label: string;
  badge?: string;
  badgeClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-[#e1efff] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-[#1E5F74] dark:bg-[#0d2d42]">
      <div className="mb-3 flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${props.iconClassName}`}>
          {props.icon}
        </div>
        {props.badge && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${props.badgeClassName}`}>
            {props.badge}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-[#001e30] dark:text-[#E0F2FE]">{props.value}</p>
      <p className="mt-0.5 text-xs text-[#3f484c] dark:text-[#94A3B8]">{props.label}</p>
    </div>
  );
}
