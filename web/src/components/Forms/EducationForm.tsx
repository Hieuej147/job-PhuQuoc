"use client";

import React from "react";
import { Education } from "@/types/resume";

interface EducationFormProps {
  data: Education[];
  onChange: (data: Education[]) => void;
}

export default function EducationForm({ data, onChange }: EducationFormProps) {
  const handleChange = (index: number, field: keyof Education, value: string) => {
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
        school: "",
        degree: "",
        field: "",
        startYear: "",
        endYear: "",
        description: "",
        GPA: "",
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
            <span className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600 text-sm">🎓</span>
            Học vấn & Bằng cấp
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Ghi nhận các trường học, chuyên ngành và thành tích học tập của bạn.
          </p>
        </div>
        <button
          type="button"
          onClick={addItem}
          className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 bg-cyan-50 hover:bg-cyan-100 px-3 py-1.5 rounded-lg transition"
        >
          + Thêm học vấn
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
                <label className="text-xs font-semibold text-slate-600">Tên trường *</label>
                <input
                  type="text"
                  className="w-full bg-white text-sm px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="Đại học Bách Khoa"
                  value={item.school || ""}
                  onChange={(e) => handleChange(index, "school", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Bằng cấp *</label>
                <input
                  type="text"
                  className="w-full bg-white text-sm px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="Cử nhân / Kỹ sư"
                  value={item.degree || ""}
                  onChange={(e) => handleChange(index, "degree", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Chuyên ngành *</label>
                <input
                  type="text"
                  className="w-full bg-white text-sm px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="Khoa học máy tính"
                  value={item.field || ""}
                  onChange={(e) => handleChange(index, "field", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Điểm số GPA</label>
                <input
                  type="text"
                  className="w-full bg-white text-sm px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="3.6/4.0 hoặc Khá, Giỏi"
                  value={item.GPA || ""}
                  onChange={(e) => handleChange(index, "GPA", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Năm bắt đầu *</label>
                <input
                  type="text"
                  className="w-full bg-white text-sm px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="2018"
                  value={item.startYear || ""}
                  onChange={(e) => handleChange(index, "startYear", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Năm kết thúc *</label>
                <input
                  type="text"
                  className="w-full bg-white text-sm px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="2022"
                  value={item.endYear || ""}
                  onChange={(e) => handleChange(index, "endYear", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Mô tả thêm</label>
                <textarea
                  rows={2}
                  className="w-full bg-white text-sm px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 resize-none"
                  placeholder="Nhận học bổng khuyến khích học tập, thủ khoa ngành..."
                  value={item.description || ""}
                  onChange={(e) => handleChange(index, "description", e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}

        {data.length === 0 && (
          <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl">
            <p className="text-sm text-slate-400 italic">Chưa có thông tin học vấn.</p>
          </div>
        )}
      </div>
    </div>
  );
}
