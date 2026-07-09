import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, Building2, Plus, Users } from "lucide-react";

interface QuickActionsCardProps {
  pendingCount: number;
}

export function QuickActionsCard({ pendingCount }: QuickActionsCardProps) {
  return (
    <div className="rounded-xl border border-[#e1efff] bg-white p-6 shadow-sm dark:border-[#1E5F74] dark:bg-[#0d2d42]">
      <h2 className="mb-5 font-bold text-[#001e30] dark:text-[#E0F2FE]">Thao tác nhanh</h2>
      <div className="flex flex-col gap-3">
        <QuickAction href="/employer/jobs/create" icon={<Plus className="h-5 w-5 text-[#F59E0B]" />} iconClassName="bg-[#F59E0B]/10" title="Đăng tin mới" subtitle="Tạo tin tuyển dụng" hoverClassName="hover:border-[#F59E0B] hover:shadow-[#F59E0B]/15" />
        <QuickAction href="/employer/applications" icon={<Users className="h-5 w-5 text-blue-600" />} iconClassName="bg-blue-50 dark:bg-blue-900/20" title="Xem hồ sơ" subtitle={`${pendingCount} hồ sơ mới chờ`} hoverClassName="hover:border-blue-500 hover:shadow-blue-500/15" />
        <QuickAction href="/employer/company" icon={<Building2 className="h-5 w-5 text-[#0d9488] dark:text-[#2DD4BF]" />} iconClassName="bg-[#0d9488]/10" title="Hồ sơ công ty" subtitle="Cập nhật thông tin" hoverClassName="hover:border-[#0d9488] hover:shadow-[#0d9488]/15" />
        <QuickAction href="/employer/jobs" icon={<BarChart3 className="h-5 w-5 text-[#005a71] dark:text-[#67E8F9]" />} iconClassName="bg-[#005a71]/10" title="Quản lý tin đăng" subtitle="Xem toàn bộ tin" hoverClassName="hover:border-[#005a71] hover:shadow-[#005a71]/15" />
      </div>
    </div>
  );
}

function QuickAction(props: {
  href: string;
  icon: ReactNode;
  iconClassName: string;
  title: string;
  subtitle: string;
  hoverClassName: string;
}) {
  return (
    <Link
      href={props.href}
      className={`group flex items-center gap-3 rounded-[14px] border-[1.5px] border-[#e1efff] bg-white p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-[#1E5F74] dark:bg-[#0d2d42] ${props.hoverClassName}`}
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${props.iconClassName}`}>
        {props.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[#001e30] dark:text-[#E0F2FE]">{props.title}</p>
        <p className="text-xs text-[#3f484c] dark:text-[#94A3B8]">{props.subtitle}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-[#6f787d] transition-colors group-hover:text-[#F59E0B]" />
    </Link>
  );
}
