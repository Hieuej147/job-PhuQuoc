import type { DashboardJob, DashboardStats } from "../types";

interface HiringSummaryCardProps {
  stats: DashboardStats;
  jobs: DashboardJob[];
}

export function HiringSummaryCard({ stats, jobs }: HiringSummaryCardProps) {
  return (
    <div className="rounded-xl border border-[#e1efff] bg-white p-6 shadow-sm dark:border-[#1E5F74] dark:bg-[#0d2d42] lg:col-span-2">
      <div className="mb-5">
        <h2 className="font-bold text-[#001e30] dark:text-[#E0F2FE]">Tổng quan tuyển dụng</h2>
        <p className="mt-0.5 text-xs text-[#3f484c] dark:text-[#94A3B8]">Thống kê từ dữ liệu thực</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <SummaryMetric value={stats.activeJobs} label="Tin đang tuyển" className="text-[#0E7490] dark:text-[#67e8f9]" />
        <SummaryMetric value={stats.totalApplicants} label="Tổng ứng viên" className="text-[#F59E0B]" />
        <SummaryMetric value={stats.pendingCount} label="Chờ duyệt" className="text-green-600" />
      </div>
      <div className="mt-4 flex items-center gap-6 border-t border-[#e1efff]/50 pt-4 dark:border-[#1E5F74]/50">
        <div>
          <p className="text-xs text-[#3f484c] dark:text-[#94A3B8]">Tổng jobs</p>
          <p className="font-bold text-[#001e30] dark:text-[#E0F2FE]">{jobs.length} tin</p>
        </div>
        <div>
          <p className="text-xs text-[#3f484c] dark:text-[#94A3B8]">Ứng viên/job</p>
          <p className="font-bold text-[#F59E0B]">
            {jobs.length > 0 ? (stats.totalApplicants / jobs.length).toFixed(1) : 0}
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryMetric(props: { value: number; label: string; className: string }) {
  return (
    <div className="rounded-lg bg-[#f7f9ff] p-4 text-center dark:bg-[#071a2b]">
      <p className={`text-3xl font-bold ${props.className}`}>{props.value}</p>
      <p className="text-sm text-gray-500">{props.label}</p>
    </div>
  );
}
