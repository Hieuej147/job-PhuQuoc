/**
 * TÊN TRANG: Hồ sơ Công ty (Employer Company Profile)
 * MÔ TẢ: Cho phép nhà tuyển dụng xem, cập nhật thông tin giới thiệu công ty.
 * TƯƠNG TÁC DỮ LIỆU (FE-BE-DB):
 * - Lấy thông tin (GET): Fetch `/api/v1/companies/my` để lấy thông tin công ty hiện tại từ bảng `Company`.
 * - Tạo mới (POST): Fetch `/api/v1/companies` nếu nhà tuyển dụng chưa tạo profile công ty.
 * - Cập nhật (PATCH): Fetch `/api/v1/companies/:id` để lưu thay đổi thông tin (tên, mô tả, website, lĩnh vực) vào Database.
 */
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Building2, Save } from "lucide-react";

interface Company {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  industry: string | null;
  isApproved: boolean;
}

export default function EmployerCompanyPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");

  useEffect(() => {
    fetch("/api/v1/companies/my", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const c = d.data;
        if (c) {
          setCompany(c);
          setName(c.name || "");
          setDescription(c.description || "");
          setWebsite(c.website || "");
          setIndustry(c.industry || "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (company) {
        // Update existing company
        const res = await fetch(`/api/v1/companies/${company.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name, description, website, industry }),
        });
        if (res.ok) {
          const d = await res.json();
          setCompany(d.data || d);
        }
      } else {
        // Create new company
        const res = await fetch("/api/v1/companies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name, description, website, industry }),
        });
        if (res.ok) {
          const d = await res.json();
          setCompany(d.data || d);
        }
      }
    } catch {}
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Hồ sơ công ty</h1>

      {company?.isApproved === false && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Công ty chưa được phê duyệt. Một số tính năng có thể bị giới hạn.
          </p>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Thông tin cơ bản</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Tên công ty</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input value={name} onChange={(e) => setName(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Lĩnh vực</label>
              <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="VD: Khách sạn & Resort" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Website</label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Mô tả công ty</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Giới thiệu về công ty..." />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="size-4 mr-1.5" /> {saving ? "Đang lưu..." : company ? "Lưu thay đổi" : "Tạo công ty"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
