"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/hooks/use-theme";
import { Moon, Sun, Bell, Menu, X, LogOut } from "lucide-react";
import { useState } from "react";

interface NavbarProps {
  role: "candidate" | "employer";
}

export function Navbar({ role }: NavbarProps) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = role === "candidate"
    ? [
        { label: "Dashboard", href: "/candidate/dashboard" },
        { label: "Đơn ứng tuyển", href: "/candidate/applications" },
        { label: "Hồ sơ", href: "/candidate/resumes" },
        { label: "Đã lưu", href: "/candidate/saved" },
      ]
    : [
        { label: "Dashboard", href: "/employer/dashboard" },
        { label: "Tin tuyển dụng", href: "/employer/jobs" },
        { label: "Ứng viên", href: "/employer/applications" },
        { label: "Công ty", href: "/employer/company" },
      ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-0.5 font-bold text-lg select-none">
          <span className="text-accent">PQ</span>
          <span className="text-primary">Jobs</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          {/* Notifications */}
          <Link
            href={`/${role === "candidate" ? "candidate" : "employer"}/notifications`}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative"
          >
            <Bell className="size-4" />
          </Link>

          {/* Logout */}
          <button
            onClick={() => {
              fetch("/api/auth/sign-out", { method: "POST", credentials: "include" }).then(() => {
                window.location.href = "/auth/login";
              });
            }}
            className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            aria-label="Đăng xuất"
          >
            <LogOut className="size-4" />
          </button>

          {/* Mobile menu */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors md:hidden"
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-3">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
