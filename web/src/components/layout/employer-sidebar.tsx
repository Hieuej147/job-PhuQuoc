"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  Briefcase,
  Users,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";
import { useEffect, useState } from "react";

export function EmployerSidebar() {
  const pathname = usePathname();
  const [companyName, setCompanyName] = useState("Công ty");

  useEffect(() => {
    fetch("/api/v1/companies/my", { credentials: "include" })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { if (d.data?.name) setCompanyName(d.data.name); })
      .catch(() => { /* dùng tên mặc định */ });
  }, []);

  const navGroups = [
    {
      label: "Tổng quan",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: "/employer/dashboard" },
        { icon: Building2, label: "Hồ sơ công ty", href: "/employer/company" },
      ],
    },
    {
      label: "Tuyển dụng",
      items: [
        { icon: PlusCircle, label: "Đăng tin mới", href: "/employer/jobs/create" },
        { icon: Briefcase, label: "Quản lý tin đăng", href: "/employer/jobs" },
        { icon: Users, label: "Hồ sơ ứng viên", href: "/employer/applications" },
      ],
    },
    {
      label: "Hệ thống",
      items: [
        { icon: Bell, label: "Thông báo", href: "/employer/notifications" },
        { icon: Settings, label: "Cài đặt", href: "/employer/settings" },
      ],
    },
  ];

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            {companyName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{companyName}</p>
            <p className="text-xs text-muted-foreground">Nhà tuyển dụng</p>
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
