"use client";

import React from "react";
import { Experience } from "@/types/resume";

interface WorkExperienceFormProps {
  data: Experience[];
  onChange: (data: Experience[]) => void;
}

export default function WorkExperienceForm({ data, onChange }: WorkExperienceFormProps) {
  const handleChange = (index: number, field: keyof Experience, value: string) => {
    const updated = [...data];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onChange(updated);
  };

  const addItem = () => {
    onChange([
      ...data,
      {
        company: "",
        position: "",
        startYear: "",
        endYear: "",
        description: "",
      },
    ]);
  };

  const removeItem = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
      <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 text-sm">💼</span>
            Kinh nghiệm làm việc
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Liệt kê các vị trí, công ty và mốc thời gian bạn từng làm việc.
          </p>
        </div>
        <button
          type="button"
          onClick={addItem}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
        >
          + Thêm kinh nghiệm
        </button>
      </div>

      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative space-y-4">
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="absolute top-4 right-4 text-xs font-semibold text-red-500 hover:text-red-700 bg-white hover:bg-red-50 px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm transition"
            >
              Gỡ bỏ
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 md:pt-0">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Tên công ty *</label>
                <input
                  type="text"
                  className="w-full bg-white text-sm px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Công ty Cổ phần A"
                  value={item.company || ""}
                  onChange={(e) => handleChange(index, "company", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Chức vụ *</label>
                <input
                  type="text"
                  className="w-full bg-white text-sm px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Senior Developer / Lễ tân"
                  value={item.position || ""}
                  onChange={(e) => handleChange(index, "position", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Năm bắt đầu *</label>
                <input
                  type="text"
                  className="w-full bg-white text-sm px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="2022 hoặc 06/2022"
                  value={item.startYear || ""}
                  onChange={(e) => handleChange(index, "startYear", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Năm kết thúc *</label>
                <input
                  type="text"
                  className="w-full bg-white text-sm px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Hiện tại hoặc 2024"
                  value={item.endYear || ""}
                  onChange={(e) => handleChange(index, "endYear", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Mô tả công việc *</label>
                <textarea
                  rows={3}
                  className="w-full bg-white text-sm px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                  placeholder="Xây dựng giao diện web, tối ưu hóa tốc độ tải trang, quản lý đội nhóm..."
                  value={item.description || ""}
                  onChange={(e) => handleChange(index, "description", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        ))}

        {data.length === 0 && (
          <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl">
            <p className="text-sm text-slate-400 italic">Chưa có thông tin kinh nghiệm làm việc.</p>
          </div>
        )}
      </div>
    </div>
  );
}
