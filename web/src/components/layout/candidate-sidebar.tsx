"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";

export function CandidateSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const u = user as any;
  const userName = u?.name || "Ứng viên";
  const initials = userName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  const [applicationsCount, setApplicationsCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    Promise.allSettled([
      fetch("/api/v1/applications/my?limit=1", { credentials: "include" }),
      fetch("/api/v1/notifications/unread-count", { credentials: "include" }),
    ]).then(async ([appsRes, unreadRes]) => {
      if (appsRes.status === "fulfilled" && appsRes.value.ok) {
        const d = await appsRes.value.json();
        setApplicationsCount(d.data?.total ?? d.total ?? 0);
      }
      if (unreadRes.status === "fulfilled" && unreadRes.value.ok) {
        const d = await unreadRes.value.json();
        setUnreadCount(d.data?.count ?? d.count ?? 0);
      }
    }).catch(() => { });
  }, []);

  // Profile completion
  const checklist = [
    { done: Boolean(u?.name && u?.phone) },
    { done: Boolean(u?.image) },
    { done: Boolean(u?.experience && Array.isArray(u.experience) && u.experience.length > 0) },
    { done: Boolean(u?.education && Array.isArray(u.education) && u.education.length > 0) },
    { done: Boolean(u?.summary) },
    { done: Boolean(u?.socialLinks && String(u.socialLinks).length > 0) },
  ];
  const completionPct = Math.round((checklist.filter(c => c.done).length / checklist.length) * 100);

  const navGroups = [
    {
      label: "Tổng quan",
      items: [
        { icon: "dashboard", label: "Dashboard", href: "/candidate/dashboard" },
        { icon: "manage_accounts", label: "Hồ sơ cá nhân", href: "/candidate/profile" },
      ],
    },
    {
      label: "Việc làm",
      items: [
        { icon: "work_history", label: "Đơn ứng tuyển", href: "/candidate/applications", badge: applicationsCount, badgeClass: "bg-[#005a71] text-white" },
        { icon: "bookmark", label: "Việc làm đã lưu", href: "/candidate/saved" },
        { icon: "apartment", label: "Công ty theo dõi", href: "/candidate/saved-companies" },
      ],
    },
    {
      label: "Hồ sơ",
      items: [
        { icon: "description", label: "Tạo CV online", href: "/candidate/resumes" },
      ],
    },
    {
      label: "Hệ thống",
      items: [
        { icon: "notifications", label: "Thông báo", href: "/candidate/notifications", badge: unreadCount, badgeClass: "bg-red-500 text-white" },
        { icon: "settings", label: "Cài đặt", href: "/candidate/settings" },
      ],
    },
  ];

  const handleLogout = () => {
    fetch("/api/auth/sign-out", { method: "POST", credentials: "include" })
      .then(() => {
        sessionStorage.removeItem("savedCompanyIds");
        window.location.href = "/auth/login";
      });
  };

  return (
    <aside className="hidden lg:flex flex-col w-72 fixed left-0 top-16 bottom-0 bg-white dark:bg-[#0F3347] border-r border-[#e1efff] dark:border-[#1E5F74]/50 px-3 py-6 overflow-y-auto z-40">

      {/* Profile Summary */}
      <div className="flex flex-col items-center text-center mb-6 pb-6 border-b border-[#e1efff] dark:border-[#1E5F74]/50">
        <div className="w-20 h-20 rounded-full border-[3px] border-[#005a71] bg-[#e1efff] text-[#005a71] font-bold text-2xl flex items-center justify-center mb-3">
          {initials}
        </div>
        <p className="font-bold text-[#001e30] dark:text-[#E0F2FE] text-sm">{userName}</p>
        <p className="text-xs text-[#3f484c] dark:text-[#94A3B8] mt-0.5">Candidate • Phú Quốc</p>
        <div className="w-full mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[#3f484c] dark:text-[#94A3B8]">Hồ sơ hoàn thiện</span>
            <span className="font-semibold text-[#005a71] dark:text-[#67E8F9]">{completionPct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#e1efff] dark:bg-[#1E5F74]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#005a71] to-[#0e7490] transition-all duration-500"
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
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all mb-0.5 ${isActive
                    ? "bg-[#005a71] text-white"
                    : "text-[#3f484c] dark:text-[#94A3B8] hover:bg-[#e1efff] dark:hover:bg-[#1E5F74] hover:text-[#005a71] dark:hover:text-[#67E8F9]"
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