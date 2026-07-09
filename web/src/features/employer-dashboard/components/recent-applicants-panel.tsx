import Link from "next/link";
import type { DashboardApplicant } from "../types";
import { getApplicantStatusBadge } from "../utils";

interface RecentApplicantsPanelProps {
  applicants: DashboardApplicant[];
}

export function RecentApplicantsPanel({ applicants }: RecentApplicantsPanelProps) {
  return (
    <div className="rounded-xl border border-[#e1efff] bg-white p-6 shadow-sm dark:border-[#1E5F74] dark:bg-[#0d2d42]">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-bold text-[#001e30] dark:text-[#E0F2FE]">Hồ sơ mới nhất</h2>
        <Link href="/employer/applications" className="text-xs font-semibold text-[#005a71] hover:opacity-80 dark:text-[#67E8F9]">
          Xem tất cả →
        </Link>
      </div>
      <div className="flex flex-col gap-3">
        {applicants.map((app) => (
          <ApplicantRow key={app.id} app={app} />
        ))}
      </div>
    </div>
  );
}

function ApplicantRow({ app }: { app: DashboardApplicant }) {
  const isAccepted = app.status === "ACCEPTED";
  const isRejected = app.status === "REJECTED";

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
        isAccepted
          ? "border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-900/10"
          : isRejected
            ? "border-red-100 bg-red-50 opacity-75 dark:border-red-900/20 dark:bg-red-900/10"
            : "border-[#e1efff]/20 bg-[#e1efff]/30 dark:border-[#1E5F74]/30 dark:bg-[#1E5F74]/10"
      }`}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${app.gradientFrom} ${app.gradientTo} text-sm font-bold text-white`}>
        {app.initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#001e30] dark:text-[#E0F2FE]">{app.name}</p>
        <p className="text-xs text-[#3f484c] dark:text-[#94A3B8]">
          {app.jobTitle} • {app.timeAgo}
        </p>
        {app.coverPreview && (
          <p className="mt-0.5 truncate text-[11px] italic text-[#3f484c] dark:text-[#94A3B8]">
            &ldquo;{app.coverPreview}&rdquo;
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {getApplicantStatusBadge(app.status)}
        {app.status === "PENDING" && (
          <Link href="/employer/applications" className="rounded-md bg-[#0e7490] px-2 py-0.5 text-[10px] font-bold text-white transition-colors hover:bg-[#005a71]">
            Xem CV
          </Link>
        )}
        {app.status === "REVIEWING" && (
          <div className="flex gap-1">
            <button type="button" className="rounded-md bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 transition-colors hover:bg-green-200">
              Duyệt
            </button>
            <button type="button" className="rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600 transition-colors hover:bg-red-200">
              Từ chối
            </button>
          </div>
        )}
        {app.status === "ACCEPTED" && (
          <Link href="/employer/applications" className="text-[10px] font-bold text-[#0e7490] hover:opacity-70 dark:text-[#67E8F9]">
            Liên hệ
          </Link>
        )}
      </div>
    </div>
  );
}
