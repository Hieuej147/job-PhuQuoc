"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEmployerDashboardSummary } from "@/features/dashboard/queries";
import { useUnreadNotifications } from "@/features/notifications/queries";
import { apiUrl } from "@/lib/api-client";

interface WardData {
  name?: string;
  district?: { name?: string; province?: { name?: string } };
}

interface CompanyData {
  name?: string;
  industry?: string;
  addressDetail?: string;
  logo?: string;
  description?: string;
  website?: string;
  isApproved?: boolean;
  ward?: WardData;
}

export function EmployerSidebar() {
  const pathname = usePathname();
  const { data: summary } = useEmployerDashboardSummary();
  const { data: unreadNotifications } = useUnreadNotifications();
  const company = summary?.company as CompanyData | null | undefined;
  const jobsCount = summary?.jobs.total || 0;
  const applicantsCount = summary?.applications.total || 0;
  const unreadCount = unreadNotifications?.count ?? summary?.notifications.unreadCount ?? 0;

  const companyName = company?.name || "Công ty";
  const initials = companyName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const locationLabel = company?.ward
    ? [company.ward.name, company.ward.district?.name].filter(Boolean).join(", ")
    : null;

  // Profile completion theo field thật
  const checklist = [
    { done: Boolean(company?.name) },
    { done: Boolean(company?.industry) },
    { done: Boolean(company?.ward) },
    { done: Boolean(company?.logo) },
    { done: Boolean(company?.description) },
    { done: Boolean(company?.website) },
  ];
  const completionPct = company
    ? Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100)
    : 0;

  const navGroups = [
    {
      label: "Tổng quan",
      items: [
        { icon: "dashboard", label: "Bảng điều khiển", href: "/employer/dashboard" },
        { icon: "apartment", label: "Hồ sơ công ty", href: "/employer/company" },
      ],
    },
    {
      label: "Tuyển dụng",
      items: [
        { icon: "post_add", label: "Đăng tin mới", href: "/employer/jobs/create" },
        { icon: "work", label: "Quản lý tin đăng", href: "/employer/jobs", badge: jobsCount, badgeClass: "bg-[#005a71] text-white" },
        { icon: "group", label: "Hồ sơ ứng viên", href: "/employer/applications", badge: applicantsCount, badgeClass: "bg-[#F59E0B] text-white" },
        { icon: "article", label: "Bài viết của tôi", href: "/employer/blogs" },
      ],
    },
    {
      label: "Hệ thống",
      items: [
        { icon: "notifications", label: "Thông báo", href: "/employer/notifications", badge: unreadCount, badgeClass: "bg-red-500 text-white" },
        { icon: "settings", label: "Cài đặt", href: "/employer/settings" },
      ],
    },
  ];

  const handleLogout = () => {
    fetch(apiUrl("/api/auth/sign-out"), { method: "POST", credentials: "include" }).then(() => {
      window.location.href = "/auth/login";
    });
  };

  const isNavItemActive = (href: string) => {
    if (href === "/employer/jobs/create") {
      return pathname === href;
    }
    if (href === "/employer/jobs") {
      return pathname === href || /^\/employer\/jobs\/[^/]+\/(edit|checkout)$/.test(pathname);
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside className="hidden lg:flex flex-col w-72 fixed left-0 top-16 bottom-0 bg-white dark:bg-[#0F3347] border-r border-[#e1efff] dark:border-[#1E5F74]/50 px-3 py-6 overflow-y-auto z-40">

      {/* Profile Summary */}
      <div className="flex flex-col items-center text-center mb-6 pb-6 border-b border-[#e1efff] dark:border-[#1E5F74]/50">
        <div className="w-20 h-20 rounded-2xl border-[3px] border-[#F59E0B] bg-[#FEF3C7] overflow-hidden text-[#D97706] font-bold text-2xl flex items-center justify-center mb-3">
          {company?.logo ? (
            <img src={company.logo} alt="" className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <p className="font-bold text-[#001e30] dark:text-[#E0F2FE] text-sm">{companyName}</p>
        <p className="text-xs text-[#3f484c] dark:text-[#94A3B8] mt-0.5">
          {[company?.industry, locationLabel].filter(Boolean).join(" • ") || "Nhà tuyển dụng"}
        </p>

        {company?.isApproved && (
          <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full">
            <span className="material-symbols-outlined text-[12px]">verified</span>
            Đã xác minh
          </span>
        )}

        <div className="w-full mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[#3f484c] dark:text-[#94A3B8]">Hồ sơ công ty</span>
            <span className="font-semibold text-[#F59E0B]">{completionPct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#e1efff] dark:bg-[#1E5F74]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] transition-all duration-500"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#6f787d] px-3 mb-2">
              {group.label}
            </p>
            {group.items.map((item) => {
              const isActive = isNavItemActive(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all mb-0.5 ${isActive
                    ? "bg-[#F59E0B] text-white"
                    : "text-[#3f484c] dark:text-[#94A3B8] hover:bg-[#FEF3C7] dark:hover:bg-[#1E5F74] hover:text-[#D97706] dark:hover:text-[#67E8F9]"
                    }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeClass}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="pt-4 border-t border-[#e1efff] dark:border-[#1E5F74]/50">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors w-full"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
