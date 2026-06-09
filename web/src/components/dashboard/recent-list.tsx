import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RecentItem {
  id: string;
  title: string;
  subtitle?: string;
  status?: string;
  statusVariant?: "default" | "secondary" | "destructive" | "outline";
  timestamp?: string;
}

interface RecentListProps {
  title: string;
  items: RecentItem[];
  emptyMessage?: string;
  onItemClick?: (item: RecentItem) => void;
}

export function RecentList({ title, items, emptyMessage = "Chưa có dữ liệu", onItemClick }: RecentListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{emptyMessage}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg transition-colors",
                  onItemClick && "cursor-pointer hover:bg-muted"
                )}
                onClick={() => onItemClick?.(item)}
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  {item.subtitle && (
                    <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {item.status && (
                    <Badge variant={item.statusVariant || "secondary"} className="text-xs">
                      {item.status}
                    </Badge>
                  )}
                  {item.timestamp && (
                    <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
