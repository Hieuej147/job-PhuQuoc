"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { User, Mail, Phone, Save } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name || "");
    setPhone(user.phone || "");
    setEmail(user.email || "");
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/v1/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, phone }),
    });
    if (res.ok) {
      const payload = await res.json().catch(() => null);
      const updated = payload?.data?.user || payload?.user || null;
      if (updated) {
        setUser(updated);
      }
    }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Hồ sơ cá nhân</h1>
      <Card>
        <CardHeader><CardTitle className="text-base">Thông tin cơ bản</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Họ và tên</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input value={name} onChange={(e) => setName(e.target.value)} className="pl-10" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input value={email} disabled className="pl-10 opacity-60" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Số điện thoại</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10" placeholder="0912 345 678" />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="size-4 mr-1.5" /> {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
