"use client";

import React from "react";
import { Certification } from "@/types/resume";

interface CertificationsFormProps {
  data: Certification[];
  onChange: (data: Certification[]) => void;
}

export default function CertificationsForm({ data, onChange }: CertificationsFormProps) {
  const handleChange = (index: number, field: keyof Certification, value: string) => {
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
        name: "",
        issuer: "",
        year: "",
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
            <span className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 text-sm">🏅</span>
            Chứng chỉ & Giải thưởng
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Liệt kê các chứng chỉ nghiệp vụ, ngoại ngữ hoặc giải thưởng bạn đạt được.
          </p>
        </div>
        <button
          type="button"
          onClick={addItem}
          className="text-xs font-semibold text-yellow-600 hover:text-yellow-700 bg-yellow-50 hover:bg-yellow-100 px-3 py-1.5 rounded-lg transition"
        >
          + Thêm chứng chỉ
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 md:pt-0">
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Tên chứng chỉ *</label>
                <input
                  type="text"
                  className="w-full bg-white text-sm px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                  placeholder="AWS Certified Solutions Architect"
                  value={item.name || ""}
                  onChange={(e) => handleChange(index, "name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Năm đạt được *</label>
                <input
                  type="text"
                  className="w-full bg-white text-sm px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                  placeholder="2023"
                  value={item.year || ""}
                  onChange={(e) => handleChange(index, "year", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Tổ chức cấp chứng chỉ *</label>
                <input
                  type="text"
                  className="w-full bg-white text-sm px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                  placeholder="Amazon Web Services (AWS)"
                  value={item.issuer || ""}
                  onChange={(e) => handleChange(index, "issuer", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1 md:col-span-3">
                <label className="text-xs font-semibold text-slate-600">Mô tả ngắn (không bắt buộc)</label>
                <textarea
                  rows={2}
                  className="w-full bg-white text-sm px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 resize-none"
                  placeholder="Điểm số đạt được 850/1000, chứng chỉ có giá trị 3 năm..."
                  value={item.description || ""}
                  onChange={(e) => handleChange(index, "description", e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}

        {data.length === 0 && (
          <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl">
            <p className="text-sm text-slate-400 italic">Chưa có thông tin chứng chỉ.</p>
          </div>
        )}
      </div>
    </div>
  );
}
