"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Building2, User, Loader2 } from "lucide-react";
import { getUserProfile } from "@/lib/auth";

export default function SelectRolePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkSession() {
      try {
        const user = await getUserProfile();
        if (!user) {
          router.push("/auth/login");
          return;
        }
        // If user already has a role (not null/undefined), redirect
        if (user.role && user.role !== "CANDIDATE") {
          // EMPLOYER or ADMIN → employer dashboard
          router.push("/employer/dashboard");
        }
        // CANDIDATE or null → stay on this page to select
      } catch {
        router.push("/auth/login");
      } finally {
        setChecking(false);
      }
    }
    checkSession();
  }, [router]);

  const handleSelectRole = async (role: "CANDIDATE" | "EMPLOYER") => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/v1/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        throw new Error("Cập nhật thất bại");
      }

      if (role === "EMPLOYER") {
        router.push("/employer/dashboard");
      } else {
        router.push("/candidate/dashboard");
      }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Briefcase className="size-8" />
            <span className="text-2xl font-bold">Phú Quốc Jobs</span>
          </div>
          <h1 className="text-xl font-semibold">Bạn là ai?</h1>
          <p className="text-muted-foreground mt-1">
            Chọn vai trò để tiếp tục sử dụng nền tảng
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className={`cursor-pointer hover:border-primary hover:shadow-md transition-all ${
              loading ? "opacity-50 pointer-events-none" : ""
            }`}
            onClick={() => handleSelectRole("CANDIDATE")}
          >
            <CardHeader className="text-center">
              <User className="size-12 mx-auto mb-2 text-primary" />
              <CardTitle>Ứng viên</CardTitle>
              <CardDescription>
                Tìm việc làm, tạo CV, ứng tuyển
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Tìm kiếm việc làm</li>
                <li>• Tạo và quản lý CV</li>
                <li>• Ứng tuyển trực tuyến</li>
                <li>• Theo dõi trạng thái đơn</li>
              </ul>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer hover:border-primary hover:shadow-md transition-all ${
              loading ? "opacity-50 pointer-events-none" : ""
            }`}
            onClick={() => handleSelectRole("EMPLOYER")}
          >
            <CardHeader className="text-center">
              <Building2 className="size-12 mx-auto mb-2 text-primary" />
              <CardTitle>Nhà tuyển dụng</CardTitle>
              <CardDescription>
                Đăng tin tuyển dụng, quản lý ứng viên
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Đăng tin tuyển dụng</li>
                <li>• Quản lý ứng viên</li>
                <li>• Tìm kiếm hồ sơ</li>
                <li>• Thống kê tuyển dụng</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {loading && (
          <div className="mt-4 text-center">
            <Loader2 className="size-5 animate-spin inline mr-2" />
            <span className="text-sm text-muted-foreground">Đang cập nhật...</span>
          </div>
        )}
      </div>
    </div>
  );
}
