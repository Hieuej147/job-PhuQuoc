"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText } from "lucide-react";

interface Application {
  id: string;
  status: string;
  createdAt: string;
  job: { id: string; title: string; slug: string; company: { name: string } };
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Chờ duyệt", variant: "secondary" },
  REVIEWING: { label: "Đang xem xét", variant: "outline" },
  ACCEPTED: { label: "Đã chấp nhận", variant: "default" },
  REJECTED: { label: "Từ chối", variant: "destructive" },
};

export default function ApplicationsPage() {
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/applications/my?limit=50", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setItems(d.data?.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Đơn ứng tuyển</h1>
      {items.length === 0 ? (
        <EmptyState icon={FileText} title="Chưa có đơn ứng tuyển" description="Hãy tìm việc và ứng tuyển ngay." />
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{a.job.title}</p>
                  <p className="text-sm text-muted-foreground">{a.job.company.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusMap[a.status]?.variant ?? "secondary"}>
                    {statusMap[a.status]?.label ?? a.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
