"use client";

import React from "react";
import { ContactInfo, SocialLink } from "@/types/resume";

interface ContactInfoFormProps {
  data: ContactInfo;
  onChange: (data: ContactInfo) => void;
}

export default function ContactInfoForm({ data, onChange }: ContactInfoFormProps) {
  const handleChange = (field: keyof Omit<ContactInfo, "socialLinks">, value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const handleSocialChange = (index: number, field: keyof SocialLink, value: string) => {
    const updatedLinks = [...(data.socialLinks || [])];
    updatedLinks[index] = {
      ...updatedLinks[index],
      [field]: value,
    };
    onChange({
      ...data,
      socialLinks: updatedLinks,
    });
  };

  const addSocialLink = () => {
    onChange({
      ...data,
      socialLinks: [...(data.socialLinks || []), { platform: "", url: "" }],
    });
  };

  const removeSocialLink = (index: number) => {
    onChange({
      ...data,
      socialLinks: (data.socialLinks || []).filter((_, i) => i !== index),
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-sm">📞</span>
          Thông tin liên hệ
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Địa chỉ email, số điện thoại và các liên kết mạng xã hội của bạn.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600">Email *</label>
          <input
            type="email"
            className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            placeholder="nguyenvana@gmail.com"
            value={data.email || ""}
            onChange={(e) => handleChange("email", e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600">Số điện thoại *</label>
          <input
            type="tel"
            className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            placeholder="0987654321"
            value={data.phone || ""}
            onChange={(e) => handleChange("phone", e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600">Địa chỉ *</label>
          <input
            type="text"
            className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            placeholder="Dương Đông, Phú Quốc, Kiên Giang"
            value={data.address || ""}
            onChange={(e) => handleChange("address", e.target.value)}
            required
          />
        </div>
      </div>

      {/* Social Links Section */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold text-slate-700">Mạng xã hội (Github, LinkedIn...)</label>
          <button
            type="button"
            onClick={addSocialLink}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
          >
            + Thêm liên kết
          </button>
        </div>

        <div className="space-y-3">
          {(data.socialLinks || []).map((link, index) => (
            <div key={index} className="flex gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  className="bg-white text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Nền tảng (e.g. GitHub)"
                  value={link.platform || ""}
                  onChange={(e) => handleSocialChange(index, "platform", e.target.value)}
                />
                <input
                  type="url"
                  className="bg-white text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="URL liên kết (e.g. https://github.com/a)"
                  value={link.url || ""}
                  onChange={(e) => handleSocialChange(index, "url", e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() => removeSocialLink(index)}
                className="text-red-500 hover:text-red-700 p-1 bg-white border border-slate-100 rounded-lg hover:shadow-sm transition"
              >
                ✕
              </button>
            </div>
          ))}
          {(!data.socialLinks || data.socialLinks.length === 0) && (
            <p className="text-xs text-slate-400 italic">Chưa có liên kết mạng xã hội nào.</p>
          )}
        </div>
      </div>
    </div>
  );
}
