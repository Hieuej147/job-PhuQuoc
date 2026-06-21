"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, GraduationCap } from "lucide-react";
import { toast } from "sonner";

interface Education {
  school: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
  GPA?: string;
  description?: string;
}

interface EducationSectionProps {
  educationList: Education[];
  onSave: (list: Education[]) => Promise<void>;
  saving: boolean;
}

export function EducationSection({ educationList, onSave, saving }: EducationSectionProps) {
  const [list, setList] = useState<Education[]>([]);

  useEffect(() => {
    if (educationList) {
      setList(educationList);
    }
  }, [educationList]);

  const handleAdd = () => {
    setList((prev) => [
      ...prev,
      {
        school: "",
        degree: "",
        field: "",
        startYear: "",
        endYear: "",
        GPA: "",
        description: "",
      },
    ]);
  };

  const handleRemove = (index: number) => {
    setList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof Education, value: string) => {
    setList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSaveClick = async () => {
    // Basic validation
    for (let i = 0; i < list.length; i++) {
      if (!list[i].school.trim() || !list[i].degree.trim()) {
        toast.error(`Vui lòng điền đầy đủ tên trường và bằng cấp cho dòng thứ ${i + 1}`);
        return;
      }
    }
    try {
      await onSave(list);
    } catch (error) {
      toast.error("Lỗi khi lưu học vấn");
    }
  };

  return (
    <Card className="border-border bg-card text-card-foreground">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-xl font-semibold">Học vấn & Bằng cấp</CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Cập nhật quá trình học tập và các bằng cấp bạn đã đạt được
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
            <GraduationCap className="size-8 mb-2 opacity-50" />
            <p className="text-sm">Chưa có thông tin học vấn.</p>
            <Button variant="link" onClick={handleAdd} className="text-primary mt-1 text-sm font-medium">
              Thêm học vấn đầu tiên
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
                    <label className="text-sm font-medium">Tên trường *</label>
                    <Input
                      value={item.school}
                      onChange={(e) => handleChange(index, "school", e.target.value)}
                      placeholder="Ví dụ: Đại học Quốc gia Hà Nội"
                      className="bg-transparent border-border"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Bằng cấp / Khóa học *</label>
                    <Input
                      value={item.degree}
                      onChange={(e) => handleChange(index, "degree", e.target.value)}
                      placeholder="Ví dụ: Cử nhân"
                      className="bg-transparent border-border"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Ngành học</label>
                    <Input
                      value={item.field}
                      onChange={(e) => handleChange(index, "field", e.target.value)}
                      placeholder="Ví dụ: Quản trị Khách sạn"
                      className="bg-transparent border-border"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Điểm trung bình (GPA)</label>
                    <Input
                      value={item.GPA || ""}
                      onChange={(e) => handleChange(index, "GPA", e.target.value)}
                      placeholder="Ví dụ: 3.6/4.0"
                      className="bg-transparent border-border"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Năm bắt đầu</label>
                    <Input
                      value={item.startYear}
                      onChange={(e) => handleChange(index, "startYear", e.target.value)}
                      placeholder="Ví dụ: 2017"
                      className="bg-transparent border-border"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Năm kết thúc</label>
                    <Input
                      value={item.endYear}
                      onChange={(e) => handleChange(index, "endYear", e.target.value)}
                      placeholder="Ví dụ: 2021"
                      className="bg-transparent border-border"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Mô tả / Hoạt động khác</label>
                  <Textarea
                    value={item.description || ""}
                    onChange={(e) => handleChange(index, "description", e.target.value)}
                    placeholder="Mô tả các môn chuyên ngành học nổi bật hoặc hoạt động ngoại khóa tại trường..."
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
