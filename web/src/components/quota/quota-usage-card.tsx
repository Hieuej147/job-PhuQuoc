"use client";

import { Crown } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuotaUpgradeDialog } from "@/components/quota/quota-upgrade-dialog";

export interface QuotaUsageItem {
  resource: string;
  label: string;
  used: number;
  limit: number;
}

interface QuotaUsageCardProps {
  title: string;
  items: QuotaUsageItem[];
}

export function QuotaUsageCard({ title, items }: QuotaUsageCardProps) {
  const [selectedQuota, setSelectedQuota] = useState<QuotaUsageItem | null>(null);

  return (
    <Card className="border-[#e1efff] bg-white shadow-[0_2px_12px_rgba(0,90,113,0.06)] dark:border-[#1E5F74]/50 dark:bg-[#0d2d42]">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-[#E0F2FE]">
          <Crown className="size-4 text-amber-500" />
          {title}
        </CardTitle>
        <Button type="button" size="xs" variant="outline" onClick={() => setSelectedQuota(items[0] ?? null)}>
          Nâng gói
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => {
          const pct = item.limit > 0 ? Math.min(100, Math.round((item.used / item.limit) * 100)) : 0;
          const warning = pct >= 80;
          return (
            <div key={item.resource} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-gray-700 dark:text-[#CBD5E1]">{item.label}</span>
                <button
                  type="button"
                  onClick={() => setSelectedQuota(item)}
                  className={`text-xs font-semibold ${warning ? "text-amber-600 dark:text-amber-400" : "text-[#005a71] dark:text-[#67E8F9]"}`}
                >
                  {item.used}/{item.limit}
                </button>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-[#1E5F74]">
                <div
                  className={`h-full rounded-full transition-all ${warning ? "bg-amber-500" : "bg-[#005a71] dark:bg-[#67E8F9]"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
      <QuotaUpgradeDialog
        open={Boolean(selectedQuota)}
        onOpenChange={(open) => !open && setSelectedQuota(null)}
        resource={selectedQuota?.resource}
        used={selectedQuota?.used}
        limit={selectedQuota?.limit}
      />
    </Card>
  );
}
