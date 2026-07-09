import type { ApplicationCounts } from "../types";

export function ApplicationsSummaryCards({ counts }: { counts: ApplicationCounts }) {
  const items = [
    { label: "Tổng hồ sơ", value: counts.total, color: "border-l-blue-500" },
    { label: "Chờ xem xét", value: counts.pending, color: "border-l-amber-500" },
    { label: "Đã chấp nhận", value: counts.accepted, color: "border-l-emerald-500" },
    { label: "Không phù hợp", value: counts.rejected, color: "border-l-rose-500" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={`flex min-h-[100px] flex-col justify-between rounded-xl border border-l-4 border-border bg-card p-5 shadow-sm ${item.color}`}
        >
          <p className="text-2xl font-black text-foreground">{item.value}</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
