"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Save, Share2 } from "lucide-react";
import { toast } from "sonner";

interface SocialLink {
  platform: string;
  url: string;
}

interface SocialSectionProps {
  socialLinks: SocialLink[];
  onSave: (list: SocialLink[]) => Promise<void>;
  saving: boolean;
}

export function SocialSection({ socialLinks, onSave, saving }: SocialSectionProps) {
  const [list, setList] = useState<SocialLink[]>([]);

  useEffect(() => {
    if (socialLinks) {
      setList(socialLinks);
    }
  }, [socialLinks]);

  const handleAdd = () => {
    setList((prev) => [
      ...prev,
      {
        platform: "Facebook",
        url: "",
      },
    ]);
  };

  const handleRemove = (index: number) => {
    setList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof SocialLink, value: string) => {
    setList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSaveClick = async () => {
    // Basic validation
    for (let i = 0; i < list.length; i++) {
      if (!list[i].url.trim()) {
        toast.error(`Vui lòng nhập liên kết mạng xã hội cho dòng thứ ${i + 1}`);
        return;
      }
    }
    try {
      await onSave(list);
    } catch (error) {
      toast.error("Lỗi khi lưu liên kết mạng xã hội");
    }
  };

  return (
    <Card className="border-border bg-card text-card-foreground">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-xl font-semibold">Mạng xã hội & Liên kết khác</CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Thêm các đường dẫn liên kết đến trang cá nhân của bạn (Facebook, LinkedIn, GitHub...)
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="border-border hover:bg-muted"
        >
          <Plus className="size-4 mr-1" /> Thêm mới
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg text-muted-foreground">
            <Share2 className="size-8 mb-2 opacity-50" />
            <p className="text-sm">Chưa có liên kết mạng xã hội.</p>
            <Button variant="link" onClick={handleAdd} className="text-primary mt-1 text-sm font-medium">
              Thêm liên kết đầu tiên
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {list.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/20"
              >
                <div className="w-1/3 max-w-[180px]">
                  <select
                    value={item.platform}
                    onChange={(e) => handleChange(index, "platform", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                  >
                    <option value="Facebook">Facebook</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="GitHub">GitHub</option>
                    <option value="Zalo">Zalo</option>
                    <option value="Website">Website</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div className="flex-1">
                  <Input
                    value={item.url}
                    onChange={(e) => handleChange(index, "url", e.target.value)}
                    placeholder="Nhập đường dẫn URL liên kết..."
                    className="bg-transparent border-border"
                  />
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={() => handleRemove(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSaveClick}
            disabled={saving || list.length === 0}
            className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-6 h-10 flex items-center gap-2"
          >
            <Save className="size-4" />
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
