"use client";

import React from "react";
import { ProfileInfo } from "@/types/resume";

interface ProfileInfoFormProps {
  data: ProfileInfo;
  onChange: (data: ProfileInfo) => void;
}

export default function ProfileInfoForm({ data, onChange }: ProfileInfoFormProps) {
  const handleChange = (field: keyof ProfileInfo, value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-sm">👤</span>
          Thông tin cá nhân
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Giới thiệu bản thân và thông tin học vấn, ngôn ngữ tổng quan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-semibold text-slate-600">Link ảnh đại diện (Avatar URL)</label>
          <input
            type="text"
            className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            placeholder="https://example.com/avatar.jpg"
            value={data.avatar || ""}
            onChange={(e) => handleChange("avatar", e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600">Họ và tên *</label>
          <input
            type="text"
            className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            placeholder="Nguyễn Văn A"
            value={data.name || ""}
            onChange={(e) => handleChange("name", e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600">Vị trí ứng tuyển *</label>
          <input
            type="text"
            className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            placeholder="Frontend Developer"
            value={data.title || ""}
            onChange={(e) => handleChange("title", e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600">Bằng cấp lớn nhất</label>
          <input
            type="text"
            className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            placeholder="Cử nhân Công nghệ thông tin"
            value={data.degree || ""}
            onChange={(e) => handleChange("degree", e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600">Ngoại ngữ</label>
          <input
            type="text"
            className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            placeholder="Tiếng Anh (IELTS 7.0), Tiếng Nhật (N3)"
            value={data.languages || ""}
            onChange={(e) => handleChange("languages", e.target.value)}
          />
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-semibold text-slate-600">Tóm tắt ngắn bản thân (Summary) *</label>
          <textarea
            rows={4}
            className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition resize-none"
            placeholder="Kinh nghiệm 3 năm lập trình ứng dụng web..."
            value={data.summary || ""}
            onChange={(e) => handleChange("summary", e.target.value)}
            required
          />
        </div>
      </div>
    </div>
  );
}
