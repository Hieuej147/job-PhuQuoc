"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Loader2, Briefcase } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        const session = await getSession();

        if (!session) {
          router.push("/auth/login");
          return;
        }

        const role = session.user?.role;
        const createdAt = session.user?.createdAt;

        // Detect new user: created within last 2 minutes
        const isNewUser = createdAt
          ? Date.now() - new Date(createdAt).getTime() < 2 * 60 * 1000
          : false;

        if (isNewUser) {
          // New user via Google OAuth → must select role
          router.push("/auth/select-role");
          return;
        }

        // Existing user → redirect based on role
        switch (role) {
          case "EMPLOYER":
          case "ADMIN":
            router.push("/employer/dashboard");
            break;
          case "CANDIDATE":
          default:
            router.push("/candidate/dashboard");
            break;
        }
      } catch (err) {
        setError("Đã xảy ra lỗi. Vui lòng thử lại.");
      }
    }

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => router.push("/auth/login")} className="text-primary hover:underline">
            Về trang đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Briefcase className="size-8 mx-auto mb-4 animate-pulse" />
        <Loader2 className="size-6 animate-spin mx-auto mb-2" />
        <p className="text-muted-foreground">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  );
}
