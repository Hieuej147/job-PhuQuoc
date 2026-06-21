"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { FileText, Plus, Eye, Star, Trash2 } from "lucide-react";


interface Resume {
  id: string;
  title: string;
  summary: string | null;
  skills: string | null;
  languages: string | null;
  isDefault: boolean;
  createdAt: string;
  template: { id: string; name: string };
}

export default function ResumesPage() {
  const [items, setItems] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResumes = () => {
    fetch("/api/v1/resumes/my", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setItems(d.data?.data ?? d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchResumes(); }, []);

  const handleSetDefault = async (id: string) => {
    await fetch(`/api/v1/resumes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isDefault: true }),
    });
    fetchResumes();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xác nhận xóa hồ sơ này?")) return;
    try {
      const res = await fetch(`/api/v1/resumes/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const body = await res.text();
        toast.error(`Xóa thất bại (${res.status}): ${body}`);
        return;
      }
      toast.success("Đã xóa hồ sơ");
      fetchResumes();
    } catch (err) {
      toast.error(`Lỗi: ${String(err)}`);
    }
  };



  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Hồ sơ của tôi</h1>
        <Link href="/candidate/resumes/new">
          <Button><Plus className="size-4 mr-1.5" /> Tạo mới</Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={FileText} title="Chưa có hồ sơ" description="Tạo hồ sơ để ứng tuyển việc làm nhanh hơn." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((r) => (
            <Card key={r.id} className={r.isDefault ? "border-primary" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  {r.title}
                  {r.isDefault && <Badge variant="default" className="text-xs">Mặc định</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {r.summary && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{r.summary}</p>}
                {r.skills && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {r.skills.split(",").slice(0, 5).map((s) => (
                      <Badge key={s.trim()} variant="secondary" className="text-xs">{s.trim()}</Badge>
                    ))}
                  </div>
                )}
                {r.languages && <p className="text-xs text-muted-foreground mb-2">Ngoại ngữ: {r.languages}</p>}
                <p className="text-xs text-muted-foreground mb-3">
                  Tạo ngày {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                </p>
                <div className="flex gap-2">
                  <Link href={`/candidate/resumes/${r.id}`}>
                    <Button size="sm" variant="outline"><Eye className="size-3.5 mr-1" /> Xem</Button>
                  </Link>
                  {!r.isDefault && (
                    <Button size="sm" variant="ghost" onClick={() => handleSetDefault(r.id)}>
                      <Star className="size-3.5 mr-1" /> Đặt mặc định
                    </Button>
                  )}
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(r.id)}>
                    <Trash2 className="size-3.5 mr-1" /> Xóa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
