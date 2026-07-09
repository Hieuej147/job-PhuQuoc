import { Building2, CheckCircle2, Clock, UserPlus, ShieldCheck, XCircle } from "lucide-react";
import type { DashboardApplicant, DashboardNotification } from "./types";
export { timeAgo } from "@/lib/utils/date";

export function getJobTypeLabel(type?: string) {
  const map: Record<string, string> = {
    FULL_TIME: "Full-time",
    PART_TIME: "Part-time",
    REMOTE: "Remote",
    CONTRACT: "Hợp đồng",
    INTERNSHIP: "Thực tập",
    FREELANCE: "Freelance",
  };
  return map[type || ""] || type || "—";
}

export function getStatusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#D1FAE5] px-2.5 py-0.5 text-xs font-medium text-[#059669] dark:bg-[#059669]/20 dark:text-[#34D399]">
          <CheckCircle2 className="h-3 w-3" /> Đang tuyển
        </span>
      );
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-xs font-medium text-[#D97706] dark:bg-[#D97706]/20 dark:text-[#FCD34D]">
          <Clock className="h-3 w-3" /> Chờ duyệt
        </span>
      );
    case "DRAFT":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-xs font-medium text-[#6B7280] dark:bg-[#6B7280]/20 dark:text-[#9CA3AF]">
          Bản nháp
        </span>
      );
    case "CLOSED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-xs font-medium text-[#6B7280] dark:bg-[#6B7280]/20 dark:text-[#9CA3AF]">
          Đã đóng
        </span>
      );
    case "REJECTED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#FEE2E2] px-2.5 py-0.5 text-xs font-medium text-[#DC2626] dark:bg-[#DC2626]/20 dark:text-[#FCA5A5]">
          <XCircle className="h-3 w-3" /> Bị từ chối
        </span>
      );
    default:
      return null;
  }
}

export function getApplicantStatusBadge(status: DashboardApplicant["status"]) {
  switch (status) {
    case "PENDING":
      return <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-medium text-[#D97706] dark:bg-[#D97706]/20 dark:text-[#FCD34D]">Mới</span>;
    case "REVIEWING":
      return <span className="rounded-full bg-[#DBEAFE] px-2 py-0.5 text-[10px] font-medium text-[#2563EB] dark:bg-[#2563EB]/20 dark:text-[#93C5FD]">Đang xem</span>;
    case "ACCEPTED":
      return <span className="rounded-full bg-[#D1FAE5] px-2 py-0.5 text-[10px] font-medium text-[#059669] dark:bg-[#059669]/20 dark:text-[#34D399]">Đã duyệt</span>;
    case "REJECTED":
      return <span className="rounded-full bg-[#FEE2E2] px-2 py-0.5 text-[10px] font-medium text-[#DC2626] dark:bg-[#DC2626]/20 dark:text-[#FCA5A5]">Từ chối</span>;
  }
}

export function getNotificationIcon(type: DashboardNotification["type"]) {
  switch (type) {
    case "APPLICATION_RECEIVED":
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
          <UserPlus className="h-4 w-4 text-blue-600" />
        </div>
      );
    case "JOB_APPROVED":
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
          <ShieldCheck className="h-4 w-4 text-green-600" />
        </div>
      );
    case "JOB_DEADLINE":
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
          <Clock className="h-4 w-4 text-amber-600" />
        </div>
      );
    case "COMPANY_APPROVED":
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
          <Building2 className="h-4 w-4 text-gray-500" />
        </div>
      );
  }
}

export function getNotificationBg(type: DashboardNotification["type"]) {
  switch (type) {
    case "APPLICATION_RECEIVED":
      return "bg-blue-50 dark:bg-blue-900/10";
    case "JOB_APPROVED":
      return "bg-green-50 dark:bg-green-900/10";
    case "JOB_DEADLINE":
      return "bg-amber-50 dark:bg-amber-900/10";
    case "COMPANY_APPROVED":
      return "";
  }
}
