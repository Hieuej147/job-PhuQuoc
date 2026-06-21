"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, FolderGit2 } from "lucide-react";
import { toast } from "sonner";

interface Project {
  name: string;
  position?: string;
  link?: string;
  description?: string;
}

interface ProjectSectionProps {
  projectList: Project[];
  onSave: (list: Project[]) => Promise<void>;
  saving: boolean;
}

export function ProjectSection({ projectList, onSave, saving }: ProjectSectionProps) {
  const [list, setList] = useState<Project[]>([]);

  useEffect(() => {
    if (projectList) {
      setList(projectList);
    }
  }, [projectList]);

  const handleAdd = () => {
    setList((prev) => [
      ...prev,
      {
        name: "",
        position: "",
        link: "",
        description: "",
      },
    ]);
  };

  const handleRemove = (index: number) => {
    setList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof Project, value: string) => {
    setList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSaveClick = async () => {
    // Basic validation
    for (let i = 0; i < list.length; i++) {
      if (!list[i].name.trim()) {
        toast.error(`Vui lòng nhập tên dự án cho dòng thứ ${i + 1}`);
        return;
      }
    }
    try {
      await onSave(list);
    } catch (error) {
      toast.error("Lỗi khi lưu danh sách dự án");
    }
  };

  return (
    <Card className="border-border bg-card text-card-foreground">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-xl font-semibold">Dự án cá nhân / Đã tham gia</CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Cập nhật các dự án đã thực hiện để chứng minh kỹ năng thực tế của bạn
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
            <FolderGit2 className="size-8 mb-2 opacity-50" />
            <p className="text-sm">Chưa có thông tin dự án.</p>
            <Button variant="link" onClick={handleAdd} className="text-primary mt-1 text-sm font-medium">
              Thêm dự án đầu tiên
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {list.map((item, index) => (
              <div
                key={index}
                className="relative p-4 border border-border rounded-lg bg-muted/40 space-y-4"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemove(index)}
                >
                  <Trash2 className="size-4" />
                </Button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Tên dự án *</label>
                    <Input
                      value={item.name}
                      onChange={(e) => handleChange(index, "name", e.target.value)}
                      placeholder="Ví dụ: Website đặt phòng trực tuyến"
                      className="bg-transparent border-border"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Vai trò trong dự án</label>
                    <Input
                      value={item.position || ""}
                      onChange={(e) => handleChange(index, "position", e.target.value)}
                      placeholder="Ví dụ: Lập trình viên chính"
                      className="bg-transparent border-border"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium">Đường dẫn dự án (Link demo/source)</label>
                    <Input
                      value={item.link || ""}
                      onChange={(e) => handleChange(index, "link", e.target.value)}
                      placeholder="Ví dụ: https://github.com/username/project"
                      className="bg-transparent border-border"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Mô tả chi tiết dự án</label>
                  <Textarea
                    value={item.description || ""}
                    onChange={(e) => handleChange(index, "description", e.target.value)}
                    placeholder="Mô tả công nghệ sử dụng, giải pháp và chức năng chính của dự án..."
                    className="min-h-[80px] bg-transparent border-border"
                  />
                </div>
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
