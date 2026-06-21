"use client";

import React from "react";
import { AdditionalInfo } from "@/types/resume";

interface AdditionalInfoFormProps {
  data: AdditionalInfo;
  onChange: (data: AdditionalInfo) => void;
}

export default function AdditionalInfoForm({ data, onChange }: AdditionalInfoFormProps) {
  const handleChange = (field: keyof Omit<AdditionalInfo, "customSections">, value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const handleCustomChange = (index: number, field: "title" | "content", value: string) => {
    const updatedCustom = [...(data.customSections || [])];
    updatedCustom[index] = {
      ...updatedCustom[index],
      [field]: value,
    };
    onChange({
      ...data,
      customSections: updatedCustom,
    });
  };

  const addCustomSection = () => {
    onChange({
      ...data,
      customSections: [...(data.customSections || []), { title: "", content: "" }],
    });
  };

  const removeCustomSection = (index: number) => {
    onChange({
      ...data,
      customSections: (data.customSections || []).filter((_, i) => i !== index),
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-teal-50 text-teal-600 text-sm">💡</span>
          Thông tin thêm
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Sở thích cá nhân hoặc các mục tùy chỉnh bạn muốn hiển thị thêm trên CV.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600">Sở thích</label>
          <input
            type="text"
            className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
            placeholder="Đọc sách, Chạy bộ, Du lịch"
            value={data.interests || ""}
            onChange={(e) => handleChange("interests", e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600">Thói quen hoạt động</label>
          <input
            type="text"
            className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
            placeholder="Tham gia các hoạt động tình nguyện, viết blog"
            value={data.hobbies || ""}
            onChange={(e) => handleChange("hobbies", e.target.value)}
          />
        </div>
      </div>

      {/* Custom Sections Section */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold text-slate-700">Mục tùy chỉnh thêm</label>
          <button
            type="button"
            onClick={addCustomSection}
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition"
          >
            + Thêm mục mới
          </button>
        </div>

        <div className="space-y-4">
          {(data.customSections || []).map((section, index) => (
            <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative space-y-3">
              <button
                type="button"
                onClick={() => removeCustomSection(index)}
                className="absolute top-4 right-4 text-red-500 hover:text-red-700 p-1 bg-white border border-slate-200 rounded-lg hover:shadow-sm transition"
              >
                ✕
              </button>

              <div className="space-y-2 pt-4 md:pt-0">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Tiêu đề mục *</label>
                  <input
                    type="text"
                    className="w-full bg-white text-sm px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    placeholder="Mục tiêu nghề nghiệp dài hạn"
                    value={section.title || ""}
                    onChange={(e) => handleCustomChange(index, "title", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Nội dung mục *</label>
                  <textarea
                    rows={3}
                    className="w-full bg-white text-sm px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
                    placeholder="Chi tiết nội dung của mục tùy chỉnh này..."
                    value={section.content || ""}
                    onChange={(e) => handleCustomChange(index, "content", e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          ))}

          {(!data.customSections || data.customSections.length === 0) && (
            <p className="text-xs text-slate-400 italic">Chưa có mục tùy chỉnh nào.</p>
          )}
        </div>
      </div>
    </div>
  );
}
