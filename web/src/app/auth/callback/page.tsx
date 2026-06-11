"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserProfile } from "@/lib/auth";
import { Loader2, Briefcase } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        const user = await getUserProfile();

        if (!user) {
          router.replace("/auth/login");
          return;
        }

        const role = user.role;

        // No role → new OAuth user, must select role
        if (!role) {
          router.replace("/auth/select-role");
          return;
        }

        // Has role → redirect to appropriate dashboard
        switch (role) {
          case "ADMIN":
            router.replace("/");
            break;
          case "EMPLOYER":
            router.replace("/employer/dashboard");
            break;
          case "CANDIDATE":
          default:
            router.replace("/candidate/dashboard");
            break;
        }
      } catch {
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
