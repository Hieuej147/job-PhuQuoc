"use client";

import React from "react";

interface SkillsFormProps {
  data: string;
  onChange: (data: string) => void;
}

export default function SkillsForm({ data, onChange }: SkillsFormProps) {
  const handleTextChange = (value: string) => {
    onChange(value);
  };

  const skillPills = data
    ? data
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    : [];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600 text-sm">⚡</span>
          Kỹ năng chuyên môn
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Nhập các kỹ năng của bạn, phân tách nhau bằng dấu phẩy (e.g. React, Node.js, Git).
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600">Danh sách kỹ năng *</label>
          <input
            type="text"
            className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
            placeholder="React, Next.js, Node.js, CSS, Figma"
            value={data || ""}
            onChange={(e) => handleTextChange(e.target.value)}
            required
          />
        </div>

        {skillPills.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-500">Xem trước nhãn kỹ năng:</span>
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
              {skillPills.map((pill, index) => (
                <span
                  key={index}
                  className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-700 shadow-sm"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
