import { ChevronDown, Search, Star } from "lucide-react";
import type { ApplicationCounts } from "../types";

interface ApplicationsToolbarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedJobId: string;
  setSelectedJobId: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  counts: ApplicationCounts;
  uniqueJobs: Array<{ id: string; title: string }>;
}

interface StatusTab {
  key: string;
  label: string;
  countKey: keyof ApplicationCounts;
  dot?: string;
  active?: string;
}

const tabs: StatusTab[] = [
  { key: "ALL", label: "Tất cả", countKey: "total" },
  { key: "PENDING", label: "Chờ xem", countKey: "pending", dot: "bg-amber-500", active: "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-300" },
  { key: "REVIEWING", label: "Đang xem xét", countKey: "reviewing", dot: "bg-blue-500", active: "bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-300" },
  { key: "ACCEPTED", label: "Chấp nhận", countKey: "accepted", dot: "bg-emerald-500", active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-300" },
  { key: "REJECTED", label: "Từ chối", countKey: "rejected", dot: "bg-rose-500", active: "bg-rose-500/10 text-rose-600 border-rose-500/30 dark:text-rose-300" },
  { key: "BOOKMARKED", label: "Đã đánh dấu", countKey: "bookmarked", active: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30 dark:text-yellow-300" },
];

export function ApplicationsToolbar({
  searchQuery,
  setSearchQuery,
  selectedJobId,
  setSelectedJobId,
  sortBy,
  setSortBy,
  statusFilter,
  setStatusFilter,
  counts,
  uniqueJobs,
}: ApplicationsToolbarProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        <div className="relative md:col-span-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm tên ứng viên..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-10 w-full rounded-xl border border-input bg-background py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="relative md:col-span-3">
          <select
            value={selectedJobId}
            onChange={(event) => setSelectedJobId(event.target.value)}
            className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">Tất cả vị trí</option>
            {uniqueJobs.map((job) => (
              <option key={job.id} value={job.id}>{job.title}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        <div className="relative md:col-span-3">
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="NEWEST">Mới nhất</option>
            <option value="OLDEST">Cũ nhất</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 overflow-x-auto border-t border-border pt-4 scrollbar-none">
        {tabs.map((tab) => {
          const active = statusFilter === tab.key;
          const count = counts[tab.countKey];
          const activeClass = tab.key === "ALL"
            ? "border-primary bg-primary text-primary-foreground font-bold"
            : `${tab.active ?? ""} font-bold`;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${
                active ? activeClass : "border-border bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              {tab.key === "BOOKMARKED" ? (
                <Star className={`h-3.5 w-3.5 ${active ? "fill-current" : "text-yellow-500"}`} />
              ) : tab.dot ? (
                <span className={`h-1.5 w-1.5 rounded-full ${tab.dot}`} />
              ) : null}
              <span>{tab.label}</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-white/20" : "bg-background text-muted-foreground"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
