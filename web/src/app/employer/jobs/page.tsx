/**
 * TÊN TRANG: Quản lý Tin Tuyển Dụng (Employer Jobs List)
 * MÔ TẢ: Hiển thị toàn bộ danh sách các tin tuyển dụng (Job) mà nhà tuyển dụng này đã đăng, kèm theo trạng thái và số lượng ứng viên nộp hồ sơ.
 * TƯƠNG TÁC DỮ LIỆU (FE-BE-DB):
 * - Fetch `/api/v1/jobs/my`: Lấy danh sách việc làm liên kết với tài khoản nhà tuyển dụng hiện tại từ bảng `Job`, bao gồm tính toán gộp (aggregation) count của `Application` liên quan.
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Briefcase, Plus, Edit, Eye } from "lucide-react";

interface Job {
  id: string;
  title: string;
  slug: string;
  status: string;
  salaryMin: number | null;
  salaryMax: number | null;
  type: string;
  createdAt: string;
  _count?: { applications: number };
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ACTIVE: { label: "Đang tuyển", variant: "default" },
  PENDING: { label: "Chờ duyệt", variant: "secondary" },
  DRAFT: { label: "Bản nháp", variant: "outline" },
  CLOSED: { label: "Đã đóng", variant: "destructive" },
};

function formatSalary(min: number | null, max: number | null) {
  if (!min && !max) return "Thỏa thuận";
  const fmt = (n: number) => (n / 1000000).toFixed(0) + " triệu";
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `Từ ${fmt(min)}`;
  return `Đến ${fmt(max!)}`;
}

export default function EmployerJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/jobs/my?limit=100", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setJobs(d.data?.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý tin đăng</h1>
        <Link href="/employer/jobs/create">
          <Button><Plus className="size-4 mr-1.5" /> Đăng tin mới</Button>
        </Link>
      </div>

      {jobs.length === 0 ? (
        <EmptyState icon={Briefcase} title="Chưa có tin tuyển dụng" description="Đăng tin mới để bắt đầu tuyển dụng." />
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/jobs/${job.slug}`} className="font-medium hover:text-primary transition-colors truncate">
                      {job.title}
                    </Link>
                    <Badge variant={statusMap[job.status]?.variant ?? "secondary"} className="text-xs shrink-0">
                      {statusMap[job.status]?.label ?? job.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{job.type}</span>
                    <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
                    <span>{job._count?.applications ?? 0} ứng viên</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/employer/jobs/create?edit=${job.id}`}>
                    <Button size="sm" variant="outline"><Edit className="size-3.5" /></Button>
                  </Link>
                  <Link href={`/jobs/${job.slug}`}>
                    <Button size="sm" variant="ghost"><Eye className="size-3.5" /></Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
