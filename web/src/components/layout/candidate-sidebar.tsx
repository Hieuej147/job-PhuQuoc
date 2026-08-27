"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCandidateDashboardSummary } from "@/features/dashboard/queries";
import { useUnreadNotifications } from "@/features/notifications/queries";
import { computeProfileCompletion } from "@/lib/profile-completion";
import { apiUrl } from "@/lib/api-client";

export function CandidateSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const u = user as any;
  const userName = u?.name || "Ứng viên";
  const initials = userName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  const { data: summary } = useCandidateDashboardSummary(!!user);
  const { data: unreadNotifications } = useUnreadNotifications(!!user);
  const applicationsCount = summary?.applications.total || 0;
  const unreadCount = unreadNotifications?.count ?? summary?.notifications.unreadCount ?? 0;

  // Fetch full profile data for accurate completion calculation
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  useEffect(() => {
    if (!user) return;
    fetch(apiUrl("/api/v1/resumes/profile"), { credentials: "include" })
      .then(res => res.ok ? res.json() : null)
      .then(payload => {
        if (payload) {
          const p = payload?.data?.data || payload?.data || {};
          setProfile(p);
        }
      })
      .catch(() => { });
  }, [user]);

  const { completionPct } = computeProfileCompletion(profile || u);
  const avatarUrl = typeof profile?.avatar === "string" && profile.avatar ? profile.avatar : u?.image || "";

  const navGroups = [
    {
      label: "Tổng quan",
      items: [
        { icon: "dashboard", label: "Bảng điều khiển", href: "/candidate/dashboard" },
        { icon: "manage_accounts", label: "Hồ sơ cá nhân", href: "/candidate/profile" },
      ],
    },
    {
      label: "Việc làm",
      items: [
        { icon: "work_history", label: "Đơn ứng tuyển", href: "/candidate/applications", badge: applicationsCount, badgeClass: "bg-[#005a71] text-white" },
        { icon: "bookmark", label: "Việc làm đã lưu", href: "/candidate/saved" },
        { icon: "apartment", label: "Công ty theo dõi", href: "/candidate/saved-companies" },
        { icon: "article", label: "Bài viết của tôi", href: "/candidate/blogs" },
      ],
    },
    {
      label: "Hồ sơ",
      items: [
        { icon: "description", label: "Tạo CV trực tuyến", href: "/candidate/resumes" },
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
    fetch(apiUrl("/api/auth/sign-out"), { method: "POST", credentials: "include" })
      .then(() => {
        window.location.href = "/auth/login";
      });
  };

  return (
    <aside className="hidden lg:flex flex-col w-72 fixed left-0 top-16 bottom-0 bg-white dark:bg-[#0F3347] border-r border-[#e1efff] dark:border-[#1E5F74]/50 px-3 py-6 overflow-y-auto z-40">

      {/* Profile Summary */}
      <div className="flex flex-col items-center text-center mb-6 pb-6 border-b border-[#e1efff] dark:border-[#1E5F74]/50">
        <Avatar className="mb-3 size-20 border-[3px] border-[#005a71] bg-[#e1efff]">
          <AvatarImage src={avatarUrl || undefined} alt={userName} className="object-cover" />
          <AvatarFallback className="bg-[#e1efff] text-2xl font-bold text-[#005a71]">
            {initials}
          </AvatarFallback>
        </Avatar>
        <p className="font-bold text-[#001e30] dark:text-[#E0F2FE] text-sm">{userName}</p>
        <p className="text-xs text-[#3f484c] dark:text-[#94A3B8] mt-0.5">Ứng viên • Phú Quốc</p>
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
