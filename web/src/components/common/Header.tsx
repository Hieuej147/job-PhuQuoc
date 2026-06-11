"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  RefreshCw,
  CheckCircle,
  Clock,
  ShieldAlert,
  MessageSquare,
  Info,
  User,
} from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: string;
  image?: string | null;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export default function Header() {
  const [isOpenMenu, setIsOpenMenu] = useState(false);
  const [showNoti, setShowNoti] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isDark, setIsDark] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Initialize theme state after hydration
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  // Fetch auth state
  useEffect(() => {
    fetch("/api/v1/auth/me", { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => {
        const user = d.data?.user || d.data;
        if (user) {
          setProfile(user);
          // Fetch notifications
          fetch("/api/v1/notifications?limit=5", { credentials: "include" })
            .then((r) => r.json())
            .then((d) => setNotifications(d.data?.items || []))
            .catch(() => {});
        }
      })
      .catch(() => setProfile(null));
  }, []);

  const isLoggedIn = !!profile;
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const initials = profile?.name
    ? profile.name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  const navItems = [
    { label: "Trang chủ", href: "/" },
    { label: "Việc làm", href: "/jobs" },
    { label: "Công ty", href: "/companies" },
    { label: "Blog", href: "/blog" },
  ];

  const renderNotiIcon = (type: string) => {
    switch (type) {
      case "APPLICATION_RECEIVED":
        return <RefreshCw className="w-4 h-4 text-blue-600" />;
      case "APPLICATION_ACCEPTED":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "APPLICATION_REJECTED":
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      case "JOB_DEADLINE":
        return <Clock className="w-4 h-4 text-amber-600" />;
      case "SYSTEM":
        return <Info className="w-4 h-4 text-slate-600" />;
      default:
        return <MessageSquare className="w-4 h-4 text-indigo-600" />;
    }
  };

  const dashboardLink = profile?.role === "EMPLOYER" ? "/employer/dashboard" : "/candidate/dashboard";

  return (
    <>
      <nav
        id="navbar"
        className={`fixed top-0 w-full z-50 bg-white/90 dark:bg-[#0C2231]/90 backdrop-blur-md transition-all duration-300
                    ${scrolled ? "shadow-md shadow-[#005a71]/8 border-b border-slate-200/70 dark:border-[#1E5F74]" : "border-b border-transparent"}`}
        style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
      >
        <div className="flex justify-between items-center h-16 px-4 md:px-8 max-w-7xl mx-auto">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-0.5 text-[22px] font-bold tracking-tight select-none">
            <span className="text-[#F59E0B]">PQ</span>
            <span className="text-[#005a71] dark:text-[#67e8f9]">Jobs</span>
          </Link>

          {/* NAV DESKTOP */}
          <div className="hidden md:flex items-center gap-8 h-full">
            {navItems.map((item) => {
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`h-8 flex items-center border-b-2 text-[14px] font-semibold transition-all duration-150 ${
                    isActive
                      ? "text-[#005a71] dark:text-[#67e8f9] border-[#005a71] dark:border-[#67e8f9] font-bold"
                      : "text-slate-600 dark:text-slate-400 border-transparent hover:text-[#005a71] dark:hover:text-[#67e8f9]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-1.5 relative">
            {/* Theme toggle */}
            <button
              onClick={() => {
                const html = document.documentElement;
                html.classList.toggle("dark");
                const newIsDark = html.classList.contains("dark");
                setIsDark(newIsDark);
                localStorage.setItem("theme", newIsDark ? "dark" : "light");
              }}
              className="p-2 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              <span className="material-symbols-outlined text-[20px] leading-none">
                {isDark ? "light_mode" : "dark_mode"}
              </span>
            </button>

            {isLoggedIn ? (
              <>
                {/* Notification bell */}
                <button
                  onClick={() => { setShowNoti(!showNoti); setIsOpenMenu(false); }}
                  title="Thông báo"
                  className={`relative p-2 rounded-full transition-colors ${
                    showNoti ? "bg-[#005a71]/10 text-[#005a71]" : "hover:bg-[#005a71]/8 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px] leading-none">notifications</span>
                  {unreadCount > 0 && (
                    <span className="absolute top-[9px] right-[9px] w-[7px] h-[7px] bg-red-500 rounded-full border border-white animate-pulse" />
                  )}
                </button>

                {/* User avatar */}
                <Link
                  href={dashboardLink}
                  className="flex items-center gap-2 ml-1 p-1 pr-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0E7490] to-[#0D9488] flex items-center justify-center text-white text-xs font-bold">
                    {profile?.image ? (
                      <img src={profile.image} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <span className="hidden md:inline text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[100px] truncate">
                    {profile?.name}
                  </span>
                </Link>
              </>
            ) : (
              <>
                {/* Login / Register */}
                <div className="hidden md:flex items-center gap-2 ml-2">
                  <Link
                    href="/auth/login"
                    className="px-4 py-[7px] text-[13px] font-semibold text-[#005a71] dark:text-[#67e8f9] border border-[#005a71]/50 dark:border-[#67e8f9]/50 rounded-full hover:bg-[#005a71]/5 transition-colors"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-5 py-[7px] text-[13px] font-semibold bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-full shadow-md transition-colors"
                  >
                    Đăng ký
                  </Link>
                </div>
              </>
            )}

            {/* Hamburger — Mobile */}
            <button
              onClick={() => { setIsOpenMenu(!isOpenMenu); setShowNoti(false); }}
              className="p-2 md:hidden text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[22px] leading-none">
                {isOpenMenu ? "close" : "menu"}
              </span>
            </button>

            {/* NOTIFICATION DROPDOWN */}
            {showNoti && isLoggedIn && (
              <div className="absolute right-0 top-[52px] w-[calc(100vw-16px)] sm:w-[380px] bg-white dark:bg-[#0d2d42] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-slate-100 dark:border-[#1E5F74] z-50 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-[#1E5F74]">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-[14px]">Thông báo</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{unreadCount} chưa đọc</p>
                  </div>
                </div>
                <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100/60 dark:divide-[#1E5F74]">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-[12px] text-slate-400">Không có thông báo nào</div>
                  ) : (
                    notifications.map((noti) => (
                      <div key={noti.id} className={`p-4 flex gap-3 items-start ${!noti.isRead ? "bg-blue-50/60 dark:bg-blue-900/20" : ""}`}>
                        <div className="w-[34px] h-[34px] rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                          {renderNotiIcon(noti.type)}
                        </div>
                        <div className="flex-grow min-w-0">
                          <h5 className={`text-slate-800 dark:text-white text-[12px] leading-tight ${!noti.isRead ? "font-bold" : "font-semibold"}`}>
                            {noti.title}
                          </h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal line-clamp-2">
                            {noti.content}
                          </p>
                        </div>
                        {!noti.isRead && <span className="w-1.5 h-1.5 bg-blue-600 rounded-full shrink-0 self-center" />}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MOBILE MENU */}
        {isOpenMenu && (
          <div className="md:hidden bg-white dark:bg-[#0C2231] border-t border-slate-100 dark:border-[#1E5F74] px-4 py-4 flex flex-col gap-3 shadow-inner">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpenMenu(false)}
                    className={`px-3 py-2.5 rounded-lg text-[14px] font-semibold transition-colors ${
                      isActive
                        ? "text-[#005a71] dark:text-[#67e8f9] bg-[#005a71]/8 dark:bg-[#67e8f9]/10 font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:text-[#005a71] dark:hover:text-[#67e8f9] hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            {!isLoggedIn && (
              <div className="flex gap-3 pt-2 border-t border-slate-200/60 dark:border-[#1E5F74] w-full">
                <Link href="/auth/login" onClick={() => setIsOpenMenu(false)} className="flex-1 text-center py-2.5 text-[14px] font-bold text-[#005a71] dark:text-[#67e8f9] border-2 border-[#005a71]/40 dark:border-[#67e8f9]/40 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                  Đăng nhập
                </Link>
                <Link href="/auth/register" onClick={() => setIsOpenMenu(false)} className="flex-1 text-center py-2.5 text-[14px] font-bold bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-full shadow-sm transition-all">
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
      <div className="h-16" />
    </>
  );
}
