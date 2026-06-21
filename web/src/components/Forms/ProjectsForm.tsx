"use client";

import React from "react";
import { Project } from "@/types/resume";

interface ProjectsFormProps {
  data: Project[];
  onChange: (data: Project[]) => void;
}

export default function ProjectsForm({ data, onChange }: ProjectsFormProps) {
  const handleChange = (index: number, field: keyof Project, value: string) => {
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
        position: "",
        link: "",
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
            <span className="p-1.5 rounded-lg bg-orange-50 text-orange-600 text-sm">🚀</span>
            Dự án thực tế
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Mô tả các dự án cá nhân hoặc dự án tại công ty bạn từng phát triển.
          </p>
        </div>
        <button
          type="button"
          onClick={addItem}
          className="text-xs font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition"
        >
          + Thêm dự án
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
                <label className="text-xs font-semibold text-slate-600">Tên dự án *</label>
                <input
                  type="text"
                  className="w-full bg-white text-sm px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  placeholder="Website thương mại điện tử"
                  value={item.name || ""}
                  onChange={(e) => handleChange(index, "name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Vai trò trong dự án *</label>
                <input
                  type="text"
                  className="w-full bg-white text-sm px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  placeholder="Frontend Lead / Developer chính"
                  value={item.position || ""}
                  onChange={(e) => handleChange(index, "position", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Đường dẫn dự án (Link demo/source)</label>
                <input
                  type="url"
                  className="w-full bg-white text-sm px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  placeholder="https://github.com/my-project"
                  value={item.link || ""}
                  onChange={(e) => handleChange(index, "link", e.target.value)}
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Chi tiết dự án & Công nghệ sử dụng *</label>
                <textarea
                  rows={3}
                  className="w-full bg-white text-sm px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none"
                  placeholder="- Phát triển giao diện sử dụng Next.js và Tailwind CSS.&#10;- Tối ưu SEO giúp tăng 30% lượng truy cập tự nhiên.&#10;- Kết nối API thông qua GraphQL..."
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
            <p className="text-sm text-slate-400 italic">Chưa có thông tin dự án.</p>
          </div>
        )}
      </div>
    </div>
  );
}
