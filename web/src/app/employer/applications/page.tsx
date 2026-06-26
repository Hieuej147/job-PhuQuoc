/**
 * TÊN TRANG: Hồ sơ ứng viên (Employer Applications)
 * MÔ TẢ: Danh sách hồ sơ các ứng viên đã ứng tuyển vào các vị trí tuyển dụng của công ty. Cho phép cập nhật trạng thái hồ sơ.
 * TƯƠNG TÁC DỮ LIỆU (FE-BE-DB):
 * - GET `/api/v1/applications/employer`: Lấy danh sách hồ sơ ứng tuyển từ bảng `Application` liên kết với tài khoản nhà tuyển dụng hiện tại.
 * - PATCH `/api/v1/applications/:id/status`: Gửi API xuống backend để cập nhật trạng thái hồ sơ (Chờ duyệt, Chấp nhận, Từ chối) vào DB.
 */
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Users, Check, X, Eye } from "lucide-react";

interface Application {
  id: string;
  status: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
  job: { id: string; title: string };
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Chờ duyệt", variant: "secondary" },
  REVIEWING: { label: "Đang xem xét", variant: "outline" },
  ACCEPTED: { label: "Đã chấp nhận", variant: "default" },
  REJECTED: { label: "Từ chối", variant: "destructive" },
};

export default function EmployerApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/applications/employer?limit=50", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setApps(d.data?.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleStatus = async (id: string, status: string) => {
    await fetch(`/api/v1/applications/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    setApps((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Hồ sơ ứng viên</h1>

      {apps.length === 0 ? (
        <EmptyState icon={Users} title="Chưa có ứng viên" description="Ứng viên sẽ hiển thị tại đây khi có người ứng tuyển." />
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <Card key={app.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{app.user.name}</p>
                  <p className="text-sm text-muted-foreground">{app.job.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(app.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={statusMap[app.status]?.variant ?? "secondary"}>
                    {statusMap[app.status]?.label ?? app.status}
                  </Badge>
                  {app.status === "PENDING" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleStatus(app.id, "ACCEPTED")}>
                        <Check className="size-3.5" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleStatus(app.id, "REJECTED")}>
                        <X className="size-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
