import Link from "next/link";
import type { DashboardJob } from "../types";
import { getJobTypeLabel, getStatusBadge } from "../utils";

interface RecentJobsTableProps {
  jobs: DashboardJob[];
}

export function RecentJobsTable({ jobs }: RecentJobsTableProps) {
  return (
    <div className="rounded-xl border border-[#e1efff] bg-white p-6 shadow-sm dark:border-[#1E5F74] dark:bg-[#0d2d42]">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-bold text-[#001e30] dark:text-[#E0F2FE]">Tin tuyển dụng gần đây</h2>
        <Link href="/employer/jobs" className="text-xs font-semibold text-[#005a71] hover:opacity-80 dark:text-[#67E8F9]">
          Quản lý tất cả →
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e1efff]/50 dark:border-[#1E5F74]/50">
              {["Vị trí", "Loại", "Hồ sơ", "Hạn nộp", "Trạng thái", "Thao tác"].map((title) => (
                <th key={title} className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-[#6f787d]">
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e1efff]/30 dark:divide-[#1E5F74]/30">
            {jobs.slice(0, 5).map((job) => (
              <tr
                key={job.id}
                className={`transition-colors hover:bg-[#e1efff]/30 dark:hover:bg-[#1E5F74]/10 ${job.status === "CLOSED" ? "opacity-60" : ""}`}
              >
                <td className="py-3 pr-4">
                  <p className="font-semibold text-[#001e30] dark:text-[#E0F2FE]">{job.title}</p>
                  {job.level && (
                    <p className="text-xs text-[#3f484c] dark:text-[#94A3B8]">jobs.level: {job.level}</p>
                  )}
                </td>
                <td className="py-3 pr-4">
                  <span className="rounded-md bg-[#005a71]/10 px-2 py-0.5 text-xs font-medium text-[#005a71] dark:text-[#67E8F9]">
                    {getJobTypeLabel(job.jobType)}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  {job.status === "PENDING" || job.status === "DRAFT" ? (
                    <span className="text-xs text-[#3f484c] dark:text-[#94A3B8]">— chờ duyệt</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#F59E0B]">{job.applicationCount ?? 0}</span>
                      <span className="text-xs text-[#3f484c] dark:text-[#94A3B8]">hồ sơ</span>
                      {(job.newApplicationCount ?? 0) > 0 && (
                        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                          {job.newApplicationCount} mới
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td className="py-3 pr-4">
                  <span className="text-xs text-[#3f484c] dark:text-[#94A3B8]">{job.deadline ?? "—"}</span>
                </td>
                <td className="py-3 pr-4">{getStatusBadge(job.status)}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/employer/jobs/${job.id}/edit`} className="text-xs font-semibold text-[#005a71] hover:opacity-70 dark:text-[#67E8F9]">
                      Sửa
                    </Link>
                    <span className="text-[#e1efff] dark:text-[#1E5F74]">|</span>
                    <button type="button" className="text-xs font-semibold text-red-500 hover:opacity-70">
                      {job.status === "ACTIVE" ? "Đóng" : job.status === "PENDING" ? "Lưu trữ" : "Đăng lại"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
