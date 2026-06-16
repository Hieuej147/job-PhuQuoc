"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Clock, AlertTriangle } from "lucide-react";
import { timeAgo } from "@/lib/utils/date";
import { companyInitials } from "@/lib/utils/format";

interface Application {
  id: string;
  job: {
    title: string;
    company: { name: string };
    ward?: { name: string };
  };
  createdAt: string;
  status: "PENDING" | "REVIEWING" | "ACCEPTED" | "REJECTED";
}

function StatusBadge({ status }: { status: Application["status"] }) {
  const styles: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
    ACCEPTED: {
      bg: "bg-[#D1FAE5] dark:bg-green-900/30",
      text: "text-[#059669] dark:text-green-400",
      icon: <CheckCircle2 className="size-3" />,
      label: "Chấp nhận",
    },
    REVIEWING: {
      bg: "bg-[#DBEAFE] dark:bg-blue-900/30",
      text: "text-[#2563EB] dark:text-blue-400",
      icon: <Circle className="size-3" />,
      label: "Đang xem xét",
    },
    PENDING: {
      bg: "bg-[#FEF3C7] dark:bg-amber-900/30",
      text: "text-[#D97706] dark:text-amber-400",
      icon: <Clock className="size-3" />,
      label: "Chờ phản hồi",
    },
    REJECTED: {
      bg: "bg-[#FEE2E2] dark:bg-red-900/30",
      text: "text-[#DC2626] dark:text-red-400",
      icon: <AlertTriangle className="size-3" />,
      label: "Từ chối",
    },
  };
  const s = styles[status] || styles.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}>
      {s.icon} {s.label}
    </span>
  );
}

interface RecentApplicationsProps {
  applications: Application[];
}

export function RecentApplications({ applications }: RecentApplicationsProps) {
  return (
    <Card className="border-[#e1efff] dark:border-[#1E5F74]/50 dark:bg-[#0d2d42] bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,90,113,0.06)]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-bold text-gray-900 dark:text-[#E0F2FE]">
          Đơn ứng tuyển gần đây
        </CardTitle>
        <Link href="/candidate/applications" className="text-xs font-semibold text-[#005a71] hover:opacity-80 dark:text-[#67E8F9]">
          Xem tất cả →
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#1E5F74]/50">
                <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#94A3B8]">Vị trí</th>
                <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#94A3B8]">Công ty</th>
                <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#94A3B8]">Ngày nộp</th>
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#94A3B8]">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#1E5F74]/30">
              {applications.map((app) => (
                <tr key={app.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-[#1E5F74]/10">
                  <td className="py-3 pr-4">
                    <p className="font-semibold text-gray-900 dark:text-[#E0F2FE]">{app.job?.title || "N/A"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {app.job?.ward?.name ? `${app.job.ward.name}, Phú Quốc` : "Phú Quốc"}
                    </p>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#005a71]/10 text-xs font-bold text-[#005a71] dark:text-[#67E8F9]">
                        {companyInitials(app.job?.company?.name || "N/A")}
                      </div>
                      <span className="text-gray-500 dark:text-[#94A3B8]">{app.job?.company?.name || "N/A"}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-gray-500 dark:text-[#94A3B8]">
                    {new Date(app.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="py-3"><StatusBadge status={app.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {applications.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">Chưa có đơn ứng tuyển nào</p>
        )}
      </CardContent>
    </Card>
  );
}

