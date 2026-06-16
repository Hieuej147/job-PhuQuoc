"use client";

import Link from "next/link";
import { useTheme } from "@/hooks/use-theme";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/auth/auth-provider";

export function Navbar({ role }: { role: "candidate" | "employer" }) {
  const { resolvedTheme, setTheme } = useTheme();
  const { user } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const userName = user?.name || "Ứng viên";
  const userEmail = (user as any)?.email || "";
  const initials = userName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  // Fetch notifications
  useEffect(() => {
    fetch("/api/v1/notifications?limit=4", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        const items = d.data?.items ?? d.data ?? [];
        setNotifications(items);
        setUnreadCount(items.filter((n: any) => !n.isRead).length);
      }).catch(() => { });
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const notifIcon: Record<string, { bg: string; icon: string; color: string }> = {
    APPLICATION_ACCEPTED: { bg: "bg-green-100 dark:bg-green-900/30", icon: "check_circle", color: "text-green-600" },
    APPLICATION_REJECTED: { bg: "bg-red-100 dark:bg-red-900/30", icon: "cancel", color: "text-red-600" },
    APPLICATION_RECEIVED: { bg: "bg-blue-100 dark:bg-blue-900/30", icon: "mail", color: "text-blue-600" },
    JOB_DEADLINE: { bg: "bg-amber-100 dark:bg-amber-900/30", icon: "schedule", color: "text-amber-600" },
    JOB_APPROVED: { bg: "bg-green-100 dark:bg-green-900/30", icon: "verified", color: "text-green-600" },
    SYSTEM: { bg: "bg-gray-100 dark:bg-gray-800", icon: "info", color: "text-gray-500" },
  };

  const handleReadAll = () => {
    fetch("/api/v1/notifications/read-all", { method: "PATCH", credentials: "include" })
      .then(() => setUnreadCount(0)).catch(() => { });
  };

  const handleLogout = () => {
    fetch("/api/auth/sign-out", { method: "POST", credentials: "include" })
      .then(() => { window.location.href = "/auth/login"; });
  };

  return (
    <nav
      id="navbar"
      className="fixed top-0 w-full z-50 bg-surface/90 dark:bg-[#0F3347]/92 backdrop-blur-md shadow-sm border-b border-transparent dark:border-[#1E5F74]/30 transition-all duration-300"
    >
      <div className="flex justify-between items-center h-16 px-4 md:px-8 max-w-7xl mx-auto">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-0 text-2xl font-bold select-none">
          <span className="text-[#F59E0B]">PQ</span>
          <span className="text-[#005a71] dark:text-[#67E8F9]">Jobs</span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "Trang chủ", href: "/" },
            { label: "Việc làm", href: "/jobs" },
            { label: "Công ty", href: "/companies" },
            { label: "Bài viết", href: "/blog" },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[#3f484c] dark:text-[#94A3B8] hover:text-[#005a71] dark:hover:text-[#67E8F9] transition-colors text-sm font-semibold tracking-wide"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">

          {/* Dark mode toggle */}
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full hover:bg-[#005a71]/5 dark:hover:bg-white/10 transition-colors text-[#3f484c] dark:text-[#94A3B8]"
          >
            <span className="material-symbols-outlined text-[22px]">
              {resolvedTheme === "dark" ? "light_mode" : "dark_mode"}
            </span>
          </button>

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setNotifOpen(v => !v); setUserOpen(false); }}
              className="relative p-2 rounded-full hover:bg-[#005a71]/5 dark:hover:bg-white/10 transition-colors text-[#3f484c] dark:text-[#94A3B8]"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0F3347]" />
              )}
            </button>

            {/* Notification Dropdown */}
            {notifOpen && (
              <div className="absolute top-[calc(100%+8px)] right-0 w-80 bg-white dark:bg-[#0F3347] rounded-2xl shadow-2xl border border-[#e1efff] dark:border-[#1E5F74] z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-[#1E5F74]">
                  <div>
                    <p className="font-semibold text-[#001e30] dark:text-[#E0F2FE] text-sm">Thông báo</p>
                    <p className="text-xs text-[#3f484c] dark:text-[#94A3B8]">{unreadCount} chưa đọc</p>
                  </div>
                  <button onClick={handleReadAll} className="text-xs text-[#005a71] dark:text-[#67E8F9] font-medium hover:opacity-75">Đọc tất cả</button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-6">Không có thông báo</p>
                  )}
                  {notifications.map((n: any) => {
                    const style = notifIcon[n.type] ?? notifIcon.SYSTEM;
                    return (
                      <div key={n.id} className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-[#1E5F74] last:border-0 cursor-pointer hover:bg-[#f0f9ff] dark:hover:bg-[#1a3f52] ${!n.isRead ? "bg-[#f0f9ff] dark:bg-[#122f42]" : ""}`}>
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${style.bg}`}>
                          <span className={`material-symbols-outlined text-[18px] ${style.color}`}>{style.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#001e30] dark:text-[#E0F2FE]">{n.title}</p>
                          <p className="text-xs text-[#3f484c] dark:text-[#94A3B8] mt-0.5 line-clamp-2">{n.content}</p>
                        </div>
                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#005a71] shrink-0 mt-1.5" />}
                      </div>
                    );
                  })}
                </div>
                <div className="px-4 py-3 border-t border-gray-100 dark:border-[#1E5F74] text-center">
                  <Link href="/candidate/notifications" className="text-xs text-[#005a71] dark:text-[#67E8F9] font-medium hover:opacity-75">
                    Xem tất cả thông báo →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Avatar */}
          <div className="relative hidden md:block" ref={userRef}>
            <button
              onClick={() => { setUserOpen(v => !v); setNotifOpen(false); }}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-[#005a71] to-[#0e7490] text-white flex items-center justify-center text-sm font-bold border-2 border-[#81d1f0] hover:shadow-[0_0_0_3px_rgba(0,90,113,0.2)] transition-shadow"
            >
              {initials}
            </button>

            {/* User Dropdown */}
            {userOpen && (
              <div className="absolute top-[calc(100%+8px)] right-0 w-48 bg-white dark:bg-[#0F3347] rounded-2xl shadow-2xl border border-[#e1efff] dark:border-[#1E5F74] z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-[#1E5F74]">
                  <p className="text-sm font-semibold text-[#001e30] dark:text-[#E0F2FE] truncate">{userName}</p>
                  <p className="text-xs text-[#3f484c] dark:text-[#94A3B8] truncate">{userEmail}</p>
                </div>
                {[
                  { icon: "dashboard", label: "Dashboard", href: "/candidate/dashboard" },
                  { icon: "manage_accounts", label: "Hồ sơ cá nhân", href: "/candidate/profile" },
                  { icon: "description", label: "CV của tôi", href: "/candidate/resumes" },
                  { icon: "work_history", label: "Đơn ứng tuyển", href: "/candidate/applications" },
                ].map(item => (
                  <Link key={item.href} href={item.href} onClick={() => setUserOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-[#3f484c] dark:text-[#94A3B8] hover:bg-[#f0f9ff] dark:hover:bg-[#1a3f52] hover:text-[#005a71] dark:hover:text-[#67E8F9] transition-colors">
                    <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
                <div className="border-t border-gray-100 dark:border-[#1E5F74] mt-1 pt-1">
                  <button onClick={handleLogout}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full">
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="md:hidden p-2 text-[#001e30] dark:text-[#E0F2FE]"
          >
            <span className="material-symbols-outlined">{mobileOpen ? "close" : "menu"}</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-[#0F3347] border-t border-[#e1efff] dark:border-[#1E5F74]/20 px-4 py-4 flex flex-col gap-4">
          {[
            { label: "Trang chủ", href: "/" },
            { label: "Việc làm", href: "/jobs" },
            { label: "Công ty", href: "/companies" },
            { label: "Bài viết", href: "/blog" },
          ].map(item => (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
              className="text-sm font-semibold text-[#3f484c] dark:text-[#94A3B8]">{item.label}</Link>
          ))}
          <div className="flex gap-3 mt-2">
            <Link href="/candidate/profile" className="flex-1 text-center px-4 py-2 text-[#005a71] border border-[#005a71] rounded-full text-sm font-semibold">Hồ sơ cá nhân</Link>
            <button onClick={handleLogout} className="flex-1 text-center px-4 py-2 bg-red-500 text-white rounded-full text-sm font-semibold">Đăng xuất</button>
          </div>
        </div>
      )}
    </nav>
  );
}