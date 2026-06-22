"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/hooks/use-theme";
import {
  RefreshCw,
  CheckCircle,
  Clock,
  ShieldAlert,
  MessageSquare,
  Info,
  Menu,
  Sun,
  Moon,
  LogOut,
  LayoutDashboard,
  User as UserIcon,
  FileText,
  Briefcase,
  Building,
  UserPlus,
  BadgeCheck,
  XCircle,
  Bell,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from "@/components/ui/sheet";

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

function formatTimeAgo(dateStr: string) {
  if (!dateStr) return "Vừa xong";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const pathname = usePathname();
  const { user: profile } = useAuth();
  const { setTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname?.includes("/resumes/") && pathname?.includes("/print")) {
    return null;
  }

  useEffect(() => {
    if (!profile) {
      setNotifications([]);
      return;
    }

    fetch("/api/v1/notifications?limit=5", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setNotifications(d.data?.items || []))
      .catch(() => { });
  }, [profile?.id]);

  const isLoggedIn = !!profile;
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const initials = profile?.name
    ? profile.name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  const handleLogout = () => {
    fetch("/api/auth/sign-out", { method: "POST", credentials: "include" })
      .then(() => { window.location.href = "/auth/login"; });
  };

  const navItems = [
    { label: "Trang chủ", href: "/" },
    { label: "Việc làm", href: "/jobs" },
    { label: "Công ty", href: "/companies" },
    { label: "Bài viết", href: "/blog" },
  ];

  const getNotiStyle = (type: string) => {
    switch (type) {
      case "APPLICATION_RECEIVED":
        return { bg: "bg-blue-50 dark:bg-blue-900/20", icon: <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" /> };
      case "APPLICATION_ACCEPTED":
      case "SYSTEM_SUCCESS":
        return { bg: "bg-green-50 dark:bg-green-900/20", icon: <BadgeCheck className="w-5 h-5 text-green-600 dark:text-green-400" /> };
      case "APPLICATION_REJECTED":
        return { bg: "bg-red-50 dark:bg-red-900/20", icon: <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" /> };
      case "SYSTEM":
      case "INFO":
        return { bg: "bg-slate-100 dark:bg-slate-800", icon: <Info className="w-5 h-5 text-slate-500 dark:text-slate-400" /> };
      default:
        return { bg: "bg-indigo-50 dark:bg-indigo-900/20", icon: <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> };
    }
  };

  const role = profile?.role || "CANDIDATE";
  const dashboardLink = role === "EMPLOYER" ? "/employer/dashboard" : "/candidate/dashboard";

  const userMenuItems = role === "EMPLOYER"
    ? [
      { icon: LayoutDashboard, label: "Bảng điều khiển", href: "/employer/dashboard" },
      { icon: Building, label: "Hồ sơ công ty", href: "/employer/company" },
      { icon: Briefcase, label: "Quản lý việc làm", href: "/employer/jobs" },
      { icon: FileText, label: "Quản lý ứng viên", href: "/employer/applications" },
    ]
    : [
      { icon: LayoutDashboard, label: "Dashboard", href: "/candidate/dashboard" },
      { icon: UserIcon, label: "Hồ sơ cá nhân", href: "/candidate/profile" },
      { icon: FileText, label: "CV của tôi", href: "/candidate/resumes" },
      { icon: Briefcase, label: "Đơn ứng tuyển", href: "/candidate/applications" },
    ];

  return (
    <>
      <nav
        id="navbar"
        className={`fixed top-0 w-full z-50 transition-all duration-300 border-b shadow-sm ${scrolled
          ? "bg-background border-border"
          : "bg-background border-transparent"
          }`}
        style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
      >
        <div className="flex justify-between items-center h-16 px-4 md:px-8 max-w-7xl mx-auto">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-0.5 text-[22px] font-bold tracking-tight select-none">
            <span className="text-amber-500">PQ</span>
            <span className="text-primary dark:text-cyan-400">Jobs</span>
          </Link>

          {/* NAV DESKTOP */}
          <div className="hidden md:flex items-center gap-8 h-full">
            {navItems.map((item) => {
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`h-8 flex items-center border-b-2 text-[14px] font-semibold transition-all duration-150 ${isActive
                    ? "text-primary dark:text-cyan-400 border-primary dark:border-cyan-400 font-bold"
                    : "text-muted-foreground border-transparent hover:text-primary dark:hover:text-cyan-400"
                    }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-1.5 relative">
            {/* Theme toggle using DropdownMenu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-2 rounded-full text-muted-foreground hover:bg-accent transition-colors outline-none"
                  aria-label="Toggle theme"
                >
                  <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute top-2 left-2 h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setTheme("light")}>Sáng</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>Tối</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>Hệ thống</DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {isLoggedIn ? (
              <>
                {/* Notification Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      title="Thông báo"
                      className="relative p-2 rounded-full hover:bg-accent text-muted-foreground transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px] leading-none">notifications</span>
                      {unreadCount > 0 && (
                        <span className="absolute top-[9px] right-[9px] w-[7px] h-[7px] bg-red-500 rounded-full border border-white dark:border-slate-900" />
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-[calc(100vw-16px)] sm:w-[420px] p-0 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-[15px]">Thông báo</h3>
                        <p className="text-[13px] text-slate-500 mt-0.5">{unreadCount} chưa đọc</p>
                      </div>
                      <button className="text-[13px] font-semibold text-[#005a71] dark:text-[#67e8f9] hover:underline">
                        Đọc tất cả
                      </button>
                    </div>

                    {/* List */}
                    <div className="max-h-[380px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-slate-500">Không có thông báo nào</div>
                      ) : (
                        <div className="flex flex-col">
                          {notifications.map((noti) => {
                            const style = getNotiStyle(noti.type);
                            return (
                              <div key={noti.id} className="relative flex items-start gap-4 p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-0 cursor-pointer">
                                {/* Icon */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${style.bg}`}>
                                  {style.icon}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 pr-4">
                                  <h5 className={`text-[14px] leading-snug mb-1 ${!noti.isRead ? "font-bold text-slate-900 dark:text-slate-100" : "font-semibold text-slate-700 dark:text-slate-300"}`}>
                                    {noti.title}
                                  </h5>
                                  <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed mb-1.5 line-clamp-2">
                                    {noti.content}
                                  </p>
                                  <p className="text-[12px] text-slate-400">
                                    {formatTimeAgo(noti.createdAt)}
                                  </p>
                                </div>

                                {/* Unread Dot */}
                                {!noti.isRead && (
                                  <span className="absolute right-5 top-6 w-2 h-2 rounded-full bg-[#F59E0B]" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-900/20">
                      <Link href="/notifications" className="text-[13px] font-semibold text-[#005a71] dark:text-[#67e8f9] hover:underline flex items-center justify-center gap-1">
                        Xem tất cả thông báo <span className="text-[16px]">&rarr;</span>
                      </Link>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="ml-2 rounded-full outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.image || undefined} alt={profile?.name || "Avatar"} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <p className="text-sm font-semibold truncate">{profile?.name || "Người dùng"}</p>
                      <p className="text-xs text-muted-foreground truncate">{(profile as any)?.email || ""}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      {userMenuItems.map((item) => (
                        <DropdownMenuItem key={item.href} asChild>
                          <Link href={item.href} className="flex items-center gap-2 cursor-pointer w-full">
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-900/20 cursor-pointer">
                      <LogOut className="h-4 w-4 mr-2" />
                      <span>Đăng xuất</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                {/* Login / Register */}
                <div className="hidden md:flex items-center gap-2 ml-2">
                  <Link
                    href="/auth/login"
                    className="px-4 py-[7px] text-[13px] font-semibold text-primary border border-primary/50 rounded-full hover:bg-primary/5 transition-colors"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-5 py-[7px] text-[13px] font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-md transition-colors"
                  >
                    Đăng ký
                  </Link>
                </div>
              </>
            )}

            {/* Hamburger Mobile using Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2 ml-1 md:hidden text-muted-foreground hover:bg-accent rounded-lg transition-colors">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] sm:w-[350px] p-0 flex flex-col">
                <SheetTitle className="sr-only">Menu Điều Hướng</SheetTitle>
                <div className="p-4 border-b flex items-center justify-between">
                  <Link href="/" className="flex items-center gap-0.5 text-xl font-bold">
                    <span className="text-amber-500">PQ</span>
                    <span className="text-primary dark:text-cyan-400">Jobs</span>
                  </Link>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  <div className="space-y-1">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block px-3 py-2.5 rounded-lg text-sm font-semibold hover:bg-accent hover:text-primary transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>

                  {isLoggedIn ? (
                    <div className="space-y-1 pt-4 border-t">
                      <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tài khoản</p>
                      {userMenuItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold hover:bg-accent hover:text-primary transition-colors"
                        >
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      ))}
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-3 py-2.5 mt-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Đăng xuất
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3 pt-4 border-t">
                      <Link href="/auth/login" className="flex-1 text-center py-2.5 text-sm font-bold text-primary border-2 border-primary/40 rounded-full hover:bg-accent transition-all">
                        Đăng nhập
                      </Link>
                      <Link href="/auth/register" className="flex-1 text-center py-2.5 text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-full transition-all">
                        Đăng ký
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
      <div className="h-16" />
    </>
  );
}
