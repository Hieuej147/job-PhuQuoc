"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Bookmark } from "lucide-react";
import Link from "next/link";

interface SavedJob {
  id: string;
  job: { id: string; title: string; slug: string; company: { name: string }; salary: string; location: string };
}

export default function SavedPage() {
  const [items, setItems] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/saved/jobs?limit=50", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setItems(d.data?.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Việc đã lưu</h1>
      {items.length === 0 ? (
        <EmptyState icon={Bookmark} title="Chưa lưu việc nào" description="Duyệt việc làm và lưu lại để xem sau." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((s) => (
            <Link key={s.id} href={`/jobs/${s.job.slug}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <p className="font-medium">{s.job.title}</p>
                  <p className="text-sm text-muted-foreground">{s.job.company.name}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">{s.job.salary}</Badge>
                    <Badge variant="outline">{s.job.location}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
