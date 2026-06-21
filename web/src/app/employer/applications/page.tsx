/**
 * TÊN TRANG: Hồ sơ ứng viên (Employer Applications)
 * MÔ TẢ: Danh sách hồ sơ các ứng viên đã ứng tuyển vào các vị trí tuyển dụng của công ty. Cho phép cập nhật trạng thái hồ sơ.
 * TƯƠNG TÁC DỮ LIỆU (FE-BE-DB):
 * - GET `/api/v1/applications/employer`: Lấy danh sách hồ sơ ứng tuyển từ bảng `Application` liên kết với tài khoản nhà tuyển dụng hiện tại.
 * - PATCH `/api/v1/applications/:id/status`: Gửi API xuống backend để cập nhật trạng thái hồ sơ (Chờ duyệt, Chấp nhận, Từ chối) vào DB.
 * - GET `/api/v1/applications/:id/resume-pdf`: Employer xem CV ứng viên (hỗ trợ cả resumeId và cvUrl).
 */
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Users, Check, X, Eye, FileText, Mail, Phone } from "lucide-react";

interface ResumeInfo {
  id: string;
  title: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface Application {
  id: string;
  status: string;
  createdAt: string;
  cvUrl?: string | null;
  resumeId?: string | null;
  coverLetter?: string | null;
  isBookmarked?: boolean;
  user: { id: string; name: string; email: string; phone?: string | null };
  job: { id: string; title: string; company?: { name: string } };
  resume?: ResumeInfo | null;
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
      .then((d) => {
        // ResponseTransformInterceptor: { data: { data: { items: [...] } }, timestamp }
        // Hoặc: { data: { items: [...] } }
        const payload = d.data?.data ?? d.data ?? d;
        const items = payload?.items ?? payload ?? [];
        setApps(Array.isArray(items) ? items : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/v1/applications/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setApps((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    }
  };

  const handleViewCV = (app: Application) => {
    if (app.cvUrl) {
      // File PDF đã upload → URL public trực tiếp
      window.open(app.cvUrl, "_blank");
    } else if (app.resumeId) {
      // CV đã lưu → gọi endpoint employer xem PDF (không 403)
      window.open(`/api/v1/applications/${app.id}/resume-pdf`, "_blank");
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Hồ sơ ứng viên</h1>
        <span className="text-sm text-muted-foreground">{apps.length} đơn ứng tuyển</span>
      </div>

      {apps.length === 0 ? (
        <EmptyState icon={Users} title="Chưa có ứng viên" description="Ứng viên sẽ hiển thị tại đây khi có người ứng tuyển." />
      ) : (
        <div className="space-y-3">
          {apps.map((app) => {
            const cvName = app.resume?.name || app.user.name;
            const cvEmail = app.resume?.email || app.user.email;
            const cvPhone = app.resume?.phone || app.user.phone;
            const hasCV = !!(app.cvUrl || app.resumeId);

            return (
              <Card key={app.id} className={app.isBookmarked ? "border-primary/40" : ""}>
                <CardContent className="flex flex-col sm:flex-row sm:items-start justify-between p-5 gap-4">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {/* Header */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-lg">{cvName}</p>
                      <Badge variant={statusMap[app.status]?.variant ?? "secondary"}>
                        {statusMap[app.status]?.label ?? app.status}
                      </Badge>
                      {app.resume && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          <FileText className="size-3" />
                          {app.resume.title}
                        </span>
                      )}
                      {app.cvUrl && !app.resumeId && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          <FileText className="size-3" />
                          PDF đính kèm
                        </span>
                      )}
                    </div>

                    {/* Vị trí ứng tuyển */}
                    <p className="text-sm font-medium text-teal-600 dark:text-teal-400">
                      Vị trí: {app.job.title}
                    </p>

                    {/* Thông tin liên hệ */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {cvEmail && (
                        <span className="flex items-center gap-1">
                          <Mail className="size-3" /> {cvEmail}
                        </span>
                      )}
                      {cvPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="size-3" /> {cvPhone}
                        </span>
                      )}
                      <span>Ngày nộp: {new Date(app.createdAt).toLocaleDateString("vi-VN")}</span>
                    </div>

                    {/* Thư giới thiệu */}
                    {app.coverLetter && (
                      <div className="mt-2 p-2.5 bg-muted/40 rounded text-xs text-muted-foreground italic border-l-2 border-primary/40">
                        <span className="font-medium not-italic text-foreground/70">Thư giới thiệu: </span>
                        &ldquo;{app.coverLetter}&rdquo;
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {/* Xem CV */}
                    {hasCV && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewCV(app)}
                        className="flex items-center gap-1 hover:bg-muted border-border w-full sm:w-auto"
                      >
                        <Eye className="size-3.5" />
                        <span>Xem CV</span>
                      </Button>
                    )}

                    {/* Duyệt / Từ chối (PENDING hoặc REVIEWING) */}
                    {(app.status === "PENDING" || app.status === "REVIEWING") && (
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-teal-600 hover:bg-teal-700 text-white"
                          onClick={() => handleStatus(app.id, "ACCEPTED")}
                        >
                          <Check className="size-3.5 mr-1" /> Duyệt
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleStatus(app.id, "REJECTED")}
                        >
                          <X className="size-3.5 mr-1" /> Từ chối
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
