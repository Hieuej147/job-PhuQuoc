"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Bookmark,
  FileUser,
  Bell,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

export function CandidateSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const userName = user?.name || "Ứng viên";

  const navGroups = [
    {
      label: "Tổng quan",
      items: [{ icon: LayoutDashboard, label: "Dashboard", href: "/candidate/dashboard" }],
    },
    {
      label: "Việc làm",
      items: [
        { icon: FileText, label: "Đơn ứng tuyển", href: "/candidate/applications" },
        { icon: Bookmark, label: "Việc đã lưu", href: "/candidate/saved" },
      ],
    },
    {
      label: "Hồ sơ",
      items: [
        { icon: FileUser, label: "CV của tôi", href: "/candidate/resumes" },
        { icon: Sparkles, label: "AI CV Assistant", href: "/candidate/ai-cv" },
      ],
    },
    {
      label: "Hệ thống",
      items: [
        { icon: Bell, label: "Thông báo", href: "/candidate/notifications" },
        { icon: Settings, label: "Cài đặt", href: "/candidate/settings" },
      ],
    },
  ];

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            {userName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
            <p className="text-xs text-muted-foreground">Candidate</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-1.5">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <item.icon className="size-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <button
          onClick={() => {
            fetch("/api/auth/sign-out", { method: "POST", credentials: "include" }).then(() => {
              window.location.href = "/auth/login";
            });
          }}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors w-full"
        >
          <LogOut className="size-4" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
