"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { Save, Globe, Lock } from "lucide-react";

interface SaveTemplateDialogProps {
  html: string;
  css: string;
  name: string;
  description?: string;
  trigger?: React.ReactNode;
  onSaved?: (templateId: string) => void;
}

export function SaveTemplateDialog({
  html,
  css,
  name: initialName,
  description: initialDescription,
  trigger,
  onSaved,
}: SaveTemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription || "");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Vui lòng nhập tên template");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/resumes/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          htmlTemplate: html,
          cssTemplate: css,
          isPublic,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setOpen(false);
        if (onSaved) {
          onSaved(result.data.id);
        }
      } else {
        const err = await res.json();
        setError(err.message || "Không thể lưu template");
      }
    } catch {
      setError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Save data-icon="inline-start" /> Lưu template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Lưu template CV</DialogTitle>
          <DialogDescription>
            Lưu template này để sử dụng sau. Bạn có thể chọn công khai hoặc riêng tư.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Tên template *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: CV Developer Modern"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Mô tả (tùy chọn)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về template..."
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <Globe className="size-5 text-primary" />
              ) : (
                <Lock className="size-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {isPublic ? "Công khai" : "Riêng tư"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isPublic
                    ? "Mọi người đều có thể sử dụng template này"
                    : "Chỉ bạn mới có thể sử dụng template này"}
                </p>
              </div>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          {isPublic && (
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-sm text-warning-foreground">
                ⚠️ Template công khai sẽ hiển thị cho tất cả người dùng. Hãy
                chắc chắn template không chứa thông tin cá nhân.
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Spinner className="size-4" data-icon="inline-start" /> Đang lưu...
              </>
            ) : (
              <>
                <Save data-icon="inline-start" /> Lưu template
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
