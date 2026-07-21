/**
 * TÊN TRANG: Cài đặt hệ thống (Employer Settings)
 * MÔ TẢ: Trang cho phép nhà tuyển dụng cấu hình các thiết lập cá nhân như giao diện hiển thị (Dark Mode/Light Mode)
 * và kết nối Gmail để AI Agent có thể gửi email thật thay mặt họ.
 * TƯƠNG TÁC DỮ LIỆU (FE-BE-DB):
 * - Giao diện: local state (LocalStorage) qua Context API (useTheme), chưa giao tiếp Database.
 * - Kết nối Gmail: GET /api/v1/email-integration/status, GET .../authorize, DELETE .../  — có giao tiếp Database (bảng email_integration).
 */
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { Moon, Sun, Mail, CheckCircle2, Loader2 } from "lucide-react";
import {
  getEmailIntegrationStatus,
  getEmailIntegrationAuthorizeUrl,
  disconnectEmailIntegration,
  type EmailIntegrationStatus,
} from "@/features/employer-email/api";

function GmailConnectionCard() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<EmailIntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState<"connected" | "error" | null>(null);

  const refreshStatus = () => {
    getEmailIntegrationStatus()
      .then(setStatus)
      .catch(() => setStatus({ connected: false }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshStatus();
    if (searchParams.get("email_connected") === "1") setNotice("connected");
    if (searchParams.get("email_connect_error") === "1") setNotice("error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async () => {
    setActionLoading(true);
    try {
      const { url } = await getEmailIntegrationAuthorizeUrl();
      window.location.href = url;
    } catch {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setActionLoading(true);
    try {
      await disconnectEmailIntegration();
      refreshStatus();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Kết nối Gmail</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Kết nối Gmail để AI Co-worker có thể gửi email mời phỏng vấn, thông báo kết quả... thay mặt bạn,
          trực tiếp từ hộp thư của bạn.
        </p>

        {notice === "connected" && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400">
            Kết nối Gmail thành công!
          </div>
        )}
        {notice === "error" && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            Kết nối Gmail thất bại, vui lòng thử lại.
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Đang kiểm tra...
          </div>
        ) : status?.connected ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <span>
                Đã kết nối: <span className="font-medium">{status.email}</span>
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="size-4 animate-spin" /> : "Ngắt kết nối"}
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={handleConnect} disabled={actionLoading}>
            {actionLoading ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : (
              <Mail className="mr-1.5 size-4" />
            )}
            Kết nối Gmail
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function EmployerSettingsPage() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Cài đặt</h1>
      <Card>
        <CardHeader><CardTitle className="text-base">Giao diện</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Chế độ hiển thị</p>
              <p className="text-xs text-muted-foreground">Chế độ sáng hoặc tối</p>
            </div>
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="p-2 rounded-md border border-border hover:bg-muted transition-colors"
            >
              {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>
        </CardContent>
      </Card>

      <GmailConnectionCard />
    </div>
  );
}