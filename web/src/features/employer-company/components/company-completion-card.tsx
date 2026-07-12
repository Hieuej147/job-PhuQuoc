import { BarChart3, CheckCircle2, Circle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface CompletionItem {
  label: string;
  complete: boolean;
  optional?: boolean;
}

interface CompanyCompletionCardProps {
  progress: number;
  items: CompletionItem[];
}

export function CompanyCompletionCard({ progress, items }: CompanyCompletionCardProps) {
  return (
    <Card className="mb-6 border-amber-200 p-5 shadow-sm dark:border-amber-900/50">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
            <BarChart3 className="size-6 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Mức độ hoàn thiện hồ sơ</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Hồ sơ càng đầy đủ, ứng viên càng tin tưởng và ứng tuyển nhiều hơn
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-2xl font-bold text-amber-500">{progress}%</span>
          <div className="h-2.5 w-32 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-4 sm:grid-cols-3 md:grid-cols-5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            {item.complete ? (
              <CheckCircle2 className="size-4 fill-green-50 text-green-500" />
            ) : item.optional ? (
              <Circle className="size-4 text-muted-foreground" />
            ) : (
              <CheckCircle2 className="size-4 text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
