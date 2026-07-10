/**
 * TÊN TRANG: Quản lý Tin Tuyển Dụng (Employer Jobs List)
 * MÔ TẢ: Hiển thị toàn bộ tin tuyển dụng của employer, kèm thống kê, lọc trạng thái, tìm kiếm và sắp xếp.
 */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Ban,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  Edit,
  Eye,
  FilePenLine,
  Hourglass,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { apiDelete, apiGet, apiPatch } from "@/lib/api-client";
import { formatSalary, jobTypeLabel } from "@/lib/utils/format";

interface Job {
  id: string;
  title: string;
  slug: string;
  status: JobStatus;
  salaryMin: number | null;
  salaryMax: number | null;
  type: string;
  level?: string | null;
  createdAt: string;
  deadline?: string | null;
  ward?: { name: string; district?: { name: string } | null } | null;
  _count?: { applications: number };
  archivedAt?: string | null;
}

type JobStatus = "ALL" | "ACTIVE" | "PENDING" | "DRAFT" | "CLOSED" | "EXPIRED";
type JobSort = "newest" | "most-apps" | "expiring";

type JobsResponse = { items?: Job[] } | Job[];
type JobStats = Record<JobStatus, number>;

const EMPTY_STATS: JobStats = { ALL: 0, ACTIVE: 0, PENDING: 0, DRAFT: 0, CLOSED: 0, EXPIRED: 0 };

const statusMap: Record<Exclude<JobStatus, "ALL">, { label: string; icon: LucideIcon; className: string; accentClass: string }> = {
  ACTIVE: {
    label: "Đang tuyển",
    icon: CheckCircle2,
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    accentClass: "text-emerald-600 dark:text-emerald-300",
  },
  PENDING: {
    label: "Chờ duyệt",
    icon: Hourglass,
    className: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300",
    accentClass: "text-amber-600 dark:text-amber-300",
  },
  DRAFT: {
    label: "Bản nháp",
    icon: FilePenLine,
    className: "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-300",
    accentClass: "text-violet-600 dark:text-violet-300",
  },
  CLOSED: {
    label: "Đã đóng",
    icon: XCircle,
    className: "border-slate-500/20 bg-slate-500/10 text-slate-600 dark:text-slate-300",
    accentClass: "text-slate-600 dark:text-slate-300",
  },
  EXPIRED: {
    label: "Hết hạn",
    icon: Clock3,
    className: "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-300",
    accentClass: "text-rose-600 dark:text-rose-300",
  },
};

const statusFilters: { value: JobStatus; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "ACTIVE", label: "Đang tuyển" },
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "DRAFT", label: "Nháp" },
  { value: "CLOSED", label: "Đã đóng" },
  { value: "EXPIRED", label: "Hết hạn" },
];

function unwrapJobs(payload: JobsResponse) {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload.items) ? payload.items : [];
}

function getLocation(job: Job) {
  if (!job.ward) return "Chưa cập nhật địa điểm";
  return [job.ward.name, job.ward.district?.name].filter(Boolean).join(", ");
}

function getStatusConfig(status: string) {
  return statusMap[status as Exclude<JobStatus, "ALL">] || statusMap.CLOSED;
}

function StatCard({ status, label, count, active, onClick }: { status: JobStatus; label: string; count: number; active: boolean; onClick: (status: JobStatus) => void }) {
  const config = status === "ALL" ? null : statusMap[status];
  const Icon = config?.icon || Briefcase;

  return (
    <button
      type="button"
      onClick={() => onClick(status)}
      className={`rounded-xl border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm ${active ? "border-primary ring-2 ring-primary/15" : "border-border"}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className={`text-xl font-bold ${config?.accentClass || "text-foreground"}`}>{count}</span>
        <Icon className={`size-4 ${config?.accentClass || "text-muted-foreground"}`} />
      </div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </button>
  );
}

export default function EmployerJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<JobStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<JobStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<JobSort>("newest");
  const [closingJob, setClosingJob] = useState<Job | null>(null);
  const [deletingJob, setDeletingJob] = useState<Job | null>(null);
  const [rememberCloseConfirm, setRememberCloseConfirm] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "100", status: filterStatus, sort: sortBy });
    if (debouncedSearch) params.set("search", debouncedSearch);

    try {
      const [jobsPayload, statsPayload] = await Promise.all([
        apiGet<JobsResponse>(`/api/v1/jobs/my?${params.toString()}`),
        apiGet<Partial<JobStats>>("/api/v1/jobs/my/stats"),
      ]);
      setJobs(unwrapJobs(jobsPayload));
      setStats({ ...EMPTY_STATS, ...statsPayload });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải danh sách tin đăng");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filterStatus, sortBy]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const closeJob = async (job: Job) => {
    try {
      await apiPatch<Partial<Job>>(`/api/v1/jobs/${job.id}/close`);
      await fetchData();
      toast.success("Đã đóng tin. Tin vẫn được giữ trong dashboard.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể đóng tin tuyển dụng");
    }
  };

  const requestCloseJob = async (job: Job) => {
    if (window.localStorage.getItem("skipConfirm:closeJob") === "true") {
      await closeJob(job);
      return;
    }
    setClosingJob(job);
  };

  const confirmCloseJob = async () => {
    if (!closingJob) return;
    if (rememberCloseConfirm) {
      window.localStorage.setItem("skipConfirm:closeJob", "true");
    }
    await closeJob(closingJob);
    setClosingJob(null);
    setRememberCloseConfirm(false);
  };

  const archiveJob = async (job: Job) => {
    try {
      await apiDelete<{ mode?: "archived"; message?: string }>(`/api/v1/jobs/${job.id}/employer`);
      await fetchData();
      toast.success("Đã xóa tin khỏi danh sách quản lý");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa tin khỏi danh sách");
    }
  };

  const confirmDeleteJob = async () => {
    if (!deletingJob) return;
    await archiveJob(deletingJob);
    setDeletingJob(null);
  };

  const totalApplications = useMemo(() => jobs.reduce((sum, job) => sum + (job._count?.applications ?? 0), 0), [jobs]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/employer/dashboard" className="hover:text-primary">Dashboard</Link>
          <ChevronRight className="size-3.5" />
          <span className="font-semibold text-primary">Quản lý tin đăng</span>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <Briefcase className="size-6 text-primary" />
              Quản lý tin đăng
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Theo dõi trạng thái, số hồ sơ và thao tác nhanh với các tin tuyển dụng.</p>
          </div>
          <Link href="/employer/jobs/create">
            <Button className="gap-2">
              <Plus className="size-4" />
              Đăng tin mới
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {statusFilters.map((item) => (
          <StatCard
            key={item.value}
            status={item.value}
            label={item.label}
            count={stats[item.value] || 0}
            active={filterStatus === item.value}
            onClick={setFilterStatus}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary"
              placeholder="Tìm theo tiêu đề tin tuyển dụng..."
            />
          </div>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as JobSort)}
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary"
          >
            <option value="newest">Mới nhất</option>
            <option value="most-apps">Nhiều hồ sơ nhất</option>
            <option value="expiring">Sắp hết hạn</option>
          </select>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto border-t border-border/60 pt-3">
          {statusFilters.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilterStatus(item.value)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${filterStatus === item.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              {item.label} ({stats[item.value] || 0})
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-4 text-sm text-muted-foreground">
        Đang hiển thị <span className="font-semibold text-foreground">{jobs.length}</span> tin, tổng <span className="font-semibold text-foreground">{totalApplications}</span> hồ sơ ứng tuyển trong bộ lọc hiện tại.
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>
      ) : jobs.length === 0 ? (
        <EmptyState icon={Briefcase} title="Không có tin tuyển dụng phù hợp" description="Thử đổi bộ lọc hoặc đăng tin mới để bắt đầu tuyển dụng." />
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const statusConfig = getStatusConfig(job.status);
            const StatusIcon = statusConfig.icon;
            const applicationCount = job._count?.applications ?? 0;

            return (
              <div key={job.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/jobs/${job.slug}`} className="truncate text-base font-bold text-foreground transition-colors hover:text-primary">
                        {job.title}
                      </Link>
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusConfig.className}`}>
                        <StatusIcon className="size-3.5" />
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Briefcase className="size-4" />{jobTypeLabel(job.type)}{job.level ? ` • ${job.level}` : ""}</span>
                      <span className="flex items-center gap-1.5">{formatSalary(job.salaryMin, job.salaryMax)}</span>
                      <span className="flex items-center gap-1.5"><Calendar className="size-4" />{job.deadline ? `Hết hạn: ${new Date(job.deadline).toLocaleDateString("vi-VN")}` : "Chưa có hạn đăng"}</span>
                      <span className="truncate">{getLocation(job)}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/employer/applications?jobId=${job.id}`}>
                        <Button size="sm" variant="outline" className="gap-1.5">
                          <Users className="size-3.5" />
                          {applicationCount} ứng viên
                        </Button>
                      </Link>
                      {job.status !== "ACTIVE" && (
                        <Link href={`/employer/jobs/${job.id}/checkout`}>
                          <Button size="sm">Đăng lại</Button>
                        </Link>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="shrink-0">
                        <MoreHorizontal className="size-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem asChild>
                        <Link href={`/employer/applications?jobId=${job.id}`} className="gap-2">
                          <Users className="size-4" /> Xem ứng viên
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/employer/jobs/${job.id}/edit`} className="gap-2">
                          <Edit className="size-4" /> Sửa tin
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/jobs/${job.slug}`} className="gap-2">
                          <Eye className="size-4" /> Xem public
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/employer/jobs/create?cloneJobId=${job.id}`} className="gap-2">
                          <Copy className="size-4" /> Nhân bản tin
                        </Link>
                      </DropdownMenuItem>
                      {job.status !== "ACTIVE" && (
                        <DropdownMenuItem asChild>
                          <Link href={`/employer/jobs/${job.id}/checkout`} className="gap-2">
                            <Clock3 className="size-4" /> Đăng lại/gia hạn
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {job.status === "ACTIVE" ? (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => requestCloseJob(job)} className="gap-2 text-destructive focus:text-destructive">
                            <Ban className="size-4" /> Đóng tin sớm
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setDeletingJob(job)} className="gap-2 text-destructive focus:text-destructive">
                            <Trash2 className="size-4" /> Xóa tin
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={Boolean(closingJob)} onOpenChange={(open) => !open && setClosingJob(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đóng tin tuyển dụng?</DialogTitle>
            <DialogDescription>
              Tin "{closingJob?.title}" sẽ ẩn khỏi public nhưng vẫn giữ trong dashboard cùng lịch sử ứng viên.
            </DialogDescription>
          </DialogHeader>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={rememberCloseConfirm}
              onCheckedChange={(checked) => setRememberCloseConfirm(Boolean(checked))}
            />
            Không hỏi lại cho thao tác đóng tin sớm
          </label>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClosingJob(null)}>Hủy</Button>
            <Button variant="destructive" onClick={confirmCloseJob}>Đóng tin</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deletingJob)} onOpenChange={(open) => !open && setDeletingJob(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa tin khỏi danh sách?</DialogTitle>
            <DialogDescription>
              Tin "{deletingJob?.title}" sẽ biến khỏi trang quản lý tin đăng của bạn. Dữ liệu tuyển dụng,
              ứng viên và thanh toán vẫn được lưu trong hệ thống để admin/support đối soát khi cần.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingJob(null)}>Hủy</Button>
            <Button variant="destructive" onClick={confirmDeleteJob}>
              Xóa tin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
