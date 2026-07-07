"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  Search,
  LayoutList,
  LayoutGrid,
  MapPin,
  Clock,
  Building2,
  TriangleAlert,
  ChevronDown,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { formatSalary, jobTypeLabel, companyInitials } from "@/lib/utils/format";
import { timeAgo } from "@/lib/utils/date";

interface SavedJob {
  id: string;
  createdAt: string;
  job: {
    id: string;
    title: string;
    slug: string;
    type: string;           // Prisma: JobType enum field named "type"
    salaryMin?: number | null;
    salaryMax?: number | null;
    addressDetail?: string | null; // Prisma location field
    level?: string | null;
    experience?: string | null;    // Prisma: ExperienceLevel enum
    deadline?: string | null;
    company: { name: string };
  };
}

type SortKey = "newest" | "oldest" | "deadline";
type ViewMode = "list" | "grid";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Lưu mới nhất" },
  { value: "oldest", label: "Lưu cũ nhất" },
  { value: "deadline", label: "Hạn sắp gần" },
];

function daysLeft(deadline?: string | null): number | null {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function DeadlineBadge({ deadline }: { deadline?: string | null }) {
  const days = daysLeft(deadline);
  if (days === null) return null;
  if (days < 0)
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-red-500 dark:text-red-400">
        <Clock className="size-3" /> Đã hết hạn
      </span>
    );
  if (days <= 7)
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-red-500 dark:text-red-400">
        <Clock className="size-3" /> Còn {days} ngày
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
      <Clock className="size-3" /> Còn {days} ngày
    </span>
  );
}

const LEVEL_LABEL: Record<string, string> = {
  JUNIOR: "Junior",
  MID: "Mid",
  SENIOR: "Senior",
  LEAD: "Lead",
  MANAGER: "Manager",
};

const EXP_SHORT: Record<string, string> = {
  NO_EXPERIENCE: "Không KN",
  UNDER_1_YEAR: "<1 năm KN",
  ONE_TO_THREE_YEARS: "1-3 năm KN",
  THREE_TO_FIVE_YEARS: "3+ năm KN",
  OVER_FIVE_YEARS: "5+ năm KN",
};

function JobCard({
  saved,
  onUnsave,
  view,
}: {
  saved: SavedJob;
  onUnsave: (id: string) => void;
  view: ViewMode;
}) {
  const { job, createdAt } = saved;
  const days = daysLeft(job.deadline);
  const isUrgent = days !== null && days >= 0 && days <= 7;
  const initials = companyInitials(job.company.name);
  const deadlineStr = job.deadline
    ? new Date(job.deadline).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  const handleUnsave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await fetch(`/api/v1/saved/jobs/${saved.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      onUnsave(saved.id);
    } catch {}
  };

  const cardBase = `rounded-2xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-md ${
    isUrgent ? "border-l-4 border-l-amber-400 border-border" : "border-border"
  }`;

  if (view === "grid") {
    return (
      <div className={`${cardBase} p-5 flex flex-col gap-3`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
              {initials}
            </div>
            <div>
              <Link
                href={job.slug ? `/jobs/${job.slug}` : "/jobs"}
                className="font-semibold text-foreground hover:text-primary leading-snug text-sm line-clamp-2 transition-colors"
              >
                {job.title}
              </Link>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Building2 className="size-3" /> {job.company.name}
              </p>
            </div>
          </div>
          <DeadlineBadge deadline={job.deadline} />
        </div>

        {job.addressDetail && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="size-3" /> {job.addressDetail}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            {jobTypeLabel(job.type)}
          </span>
          <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            {formatSalary(job.salaryMin, job.salaryMax)}
          </span>
          {job.level && (
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {LEVEL_LABEL[job.level] ?? job.level}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-auto pt-2 border-t border-border">
          <Clock className="size-3 shrink-0" />
          <span>Đã lưu {timeAgo(createdAt)}</span>
          {deadlineStr && (
            <span className="text-amber-500 font-medium ml-1">• HH: {deadlineStr}</span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleUnsave}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-transparent px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
          >
            <Bookmark className="size-3.5 fill-current" /> Bỏ lưu
          </button>
          {days !== null && days < 0 ? (
            <span className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-muted text-muted-foreground border border-border px-3 py-1.5 text-xs font-semibold select-none cursor-not-allowed">
              Hết hạn
            </span>
          ) : (
            <Link
              href={job.slug ? `/jobs/${job.slug}` : "/jobs"}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              ▶ Ứng tuyển
            </Link>
          )}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className={`${cardBase} p-5 flex flex-col gap-2.5`}>
      <div className="flex items-start justify-between gap-4">
        {/* Left */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
            {initials}
          </div>
          <div className="min-w-0">
            <Link
              href={job.slug ? `/jobs/${job.slug}` : "/jobs"}
              className="font-semibold text-foreground hover:text-primary leading-snug transition-colors"
            >
              {job.title}
            </Link>
            <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
              <Building2 className="size-3.5 shrink-0" /> {job.company.name}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {job.addressDetail && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" /> {job.addressDetail}
                </span>
              )}
              <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                {jobTypeLabel(job.type)}
              </span>
              <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                {formatSalary(job.salaryMin, job.salaryMax)}
              </span>
              {job.level && (
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {LEVEL_LABEL[job.level] ?? job.level}
                </span>
              )}
              {job.experience && (
                <span className="text-xs text-muted-foreground">
                  {EXP_SHORT[job.experience] ?? job.experience}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-col items-end gap-3 shrink-0">
          <DeadlineBadge deadline={job.deadline} />
          <div className="flex gap-2">
            <button
              onClick={handleUnsave}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-transparent px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
            >
              <Bookmark className="size-3.5 fill-current" /> Bỏ lưu
            </button>
            {days !== null && days < 0 ? (
              <span className="flex items-center justify-center gap-1.5 rounded-lg bg-muted text-muted-foreground border border-border px-3 py-1.5 text-xs font-semibold select-none cursor-not-allowed">
                Hết hạn
              </span>
            ) : (
              <Link
                href={job.slug ? `/jobs/${job.slug}` : "/jobs"}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                ▶ Ứng tuyển
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t border-border">
        <Clock className="size-3 shrink-0" />
        <span>Đã lưu {timeAgo(createdAt)}</span>
        {deadlineStr && (
          <span className="text-amber-500 font-medium">• HH: {deadlineStr}</span>
        )}
      </div>
    </div>
  );
}

export default function SavedPage() {
  const router = useRouter();
  const [items, setItems] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [view, setView] = useState<ViewMode>("list");
  const [activeTab, setActiveTab] = useState("all");
  const [showSort, setShowSort] = useState(false);

  useEffect(() => {
    fetch("/api/v1/saved/jobs?limit=100", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setItems(d.data?.items ?? d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUnsave = (id: string) => setItems((prev) => prev.filter((s) => s.id !== id));

  const tabs = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    items.forEach((s) => {
      const t = s.job.type;
      if (t) counts[t] = (counts[t] ?? 0) + 1;
    });
    const typeLabels: Record<string, string> = {
      FULL_TIME: "Full-time",
      PART_TIME: "Part-time",
      REMOTE: "Remote",
      CONTRACT: "Hợp đồng",
      INTERNSHIP: "Thực tập",
      FREELANCE: "Freelance",
    };
    const result = [{ key: "all", label: `Tất cả (${counts.all})` }];
    Object.keys(counts).forEach((k) => {
      if (k !== "all") result.push({ key: k, label: `${typeLabels[k] ?? k} (${counts[k]})` });
    });
    return result;
  }, [items]);

  const urgentCount = useMemo(
    () =>
      items.filter((s) => {
        const d = daysLeft(s.job.deadline);
        return d !== null && d >= 0 && d <= 7;
      }).length,
    [items]
  );

  const filtered = useMemo(() => {
    let list = activeTab === "all" ? items : items.filter((s) => s.job.type === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.job.title.toLowerCase().includes(q) ||
          s.job.company.name.toLowerCase().includes(q) ||
          (s.job.addressDetail ?? "").toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      if (sort === "oldest")
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sort === "deadline") {
        const da = daysLeft(a.job.deadline) ?? 9999;
        const db = daysLeft(b.job.deadline) ?? 9999;
        return da - db;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [items, activeTab, search, sort]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );

  const sortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Lưu mới nhất";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => router.back()}
          className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">Việc làm đã lưu</h1>
            <span className="rounded-full bg-primary/10 border border-primary/30 px-3 py-0.5 text-xs font-bold text-primary">
              {items.length} việc làm
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Xem và quản lý các công việc bạn đã lưu để ứng tuyển sau
          </p>
        </div>
      </div>

      {/* Tabs + view toggle */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                activeTab === t.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setView("list")}
            className={`flex size-9 items-center justify-center rounded-lg border transition-colors ${
              view === "list"
                ? "bg-primary border-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            <LayoutList className="size-4" />
          </button>
          <button
            onClick={() => setView("grid")}
            className={`flex size-9 items-center justify-center rounded-lg border transition-colors ${
              view === "grid"
                ? "bg-primary border-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            <LayoutGrid className="size-4" />
          </button>
        </div>
      </div>

      {/* Search + Sort */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm trong danh sách đã lưu..."
            className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowSort((p) => !p)}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:border-primary transition-colors whitespace-nowrap"
          >
            {sortLabel}
            <ChevronDown className={`size-4 transition-transform ${showSort ? "rotate-180" : ""}`} />
          </button>
          {showSort && (
            <div className="absolute right-0 top-full mt-1 z-10 min-w-[160px] rounded-xl border border-border bg-card shadow-xl overflow-hidden">
              {SORT_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => { setSort(o.value); setShowSort(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-muted ${
                    sort === o.value ? "text-primary font-semibold" : "text-foreground"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Urgent banner */}
      {urgentCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-400/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3">
          <TriangleAlert className="size-4 shrink-0 text-amber-500 dark:text-amber-400" />
          <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
            <span className="font-bold">{urgentCount} việc làm</span> sắp hết hạn trong vòng 7 ngày. Ứng tuyển ngay trước khi quá muộn!
          </p>
        </div>
      )}

      {/* List / Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title={search ? "Không tìm thấy kết quả" : "Chưa lưu việc nào"}
          description={
            search
              ? "Thử từ khóa khác hoặc bỏ bộ lọc."
              : "Duyệt việc làm và nhấn lưu để xem lại sau."
          }
        />
      ) : (
        <div
          className={
            view === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 gap-4"
              : "flex flex-col gap-4"
          }
        >
          {filtered.map((s) => (
            <JobCard key={s.id} saved={s} onUnsave={handleUnsave} view={view} />
          ))}
        </div>
      )}
    </div>
  );
}
