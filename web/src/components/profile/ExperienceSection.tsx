"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, Briefcase } from "lucide-react";
import { toast } from "sonner";

interface Experience {
  company: string;
  position: string;
  startYear: string;
  endYear: string;
  description?: string;
}

interface ExperienceSectionProps {
  experienceList: Experience[];
  onSave: (list: Experience[]) => Promise<void>;
  saving: boolean;
}

export function ExperienceSection({ experienceList, onSave, saving }: ExperienceSectionProps) {
  const [list, setList] = useState<Experience[]>([]);

  useEffect(() => {
    if (experienceList) {
      setList(experienceList);
    }
  }, [experienceList]);

  const handleAdd = () => {
    setList((prev) => [
      ...prev,
      {
        company: "",
        position: "",
        startYear: "",
        endYear: "",
        description: "",
      },
    ]);
  };

  const handleRemove = (index: number) => {
    setList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof Experience, value: string) => {
    setList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSaveClick = async () => {
    // Basic validation
    for (let i = 0; i < list.length; i++) {
      if (!list[i].company.trim() || !list[i].position.trim()) {
        toast.error(`Vui lòng điền đầy đủ tên công ty và chức danh cho dòng thứ ${i + 1}`);
        return;
      }
    }
    try {
      await onSave(list);
    } catch (error) {
      toast.error("Lỗi khi lưu kinh nghiệm");
    }
  };

  return (
    <Card className="border-border bg-card text-card-foreground">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-xl font-semibold">Kinh nghiệm làm việc</CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Cập nhật lịch sử làm việc của bạn để nhà tuyển dụng đánh giá năng lực
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
            <Briefcase className="size-8 mb-2 opacity-50" />
            <p className="text-sm">Chưa có thông tin kinh nghiệm làm việc.</p>
            <Button variant="link" onClick={handleAdd} className="text-primary mt-1 text-sm font-medium">
              Thêm kinh nghiệm làm việc đầu tiên
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
                    <label className="text-sm font-medium">Tên công ty *</label>
                    <Input
                      value={item.company}
                      onChange={(e) => handleChange(index, "company", e.target.value)}
                      placeholder="Ví dụ: Công ty TNHH PQJobs"
                      className="bg-transparent border-border"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Chức danh / Vị trí *</label>
                    <Input
                      value={item.position}
                      onChange={(e) => handleChange(index, "position", e.target.value)}
                      placeholder="Ví dụ: Nhân viên Lễ tân"
                      className="bg-transparent border-border"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Năm bắt đầu</label>
                    <Input
                      value={item.startYear}
                      onChange={(e) => handleChange(index, "startYear", e.target.value)}
                      placeholder="Ví dụ: 2021"
                      className="bg-transparent border-border"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Năm kết thúc</label>
                    <Input
                      value={item.endYear}
                      onChange={(e) => handleChange(index, "endYear", e.target.value)}
                      placeholder="Ví dụ: 2024 hoặc Hiện tại"
                      className="bg-transparent border-border"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Mô tả công việc</label>
                  <Textarea
                    value={item.description || ""}
                    onChange={(e) => handleChange(index, "description", e.target.value)}
                    placeholder="Mô tả các công việc chính đã thực hiện và thành tích đạt được..."
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
