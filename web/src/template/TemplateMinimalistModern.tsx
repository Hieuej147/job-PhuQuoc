// @ts-nocheck
"use client";
import type { TemplateProps, UserData, ResumeData } from "./index";

import { useState } from "react";

/**
 * TemplateMinimalistModern — Phong cách tối giản hiện đại (Minimalist Modern), siêu sạch, thanh thoát
 */
export default function TemplateMinimalistModern({ user = {} as Partial<UserData>, resume = {} as Partial<ResumeData> }: TemplateProps) {
    const [userData, setUserData] = useState({
        name: user.name || "Họ và Tên",
        email: user.email || "",
        phone: user.phone || "",
        avatar: user.avatar || "https://i.pravatar.cc/150?img=12",
    });

    const [resumeData, setResumeData] = useState({
        address: resume.address || "",
        summary: resume.summary || "",
        degree: resume.degree || "",
        languages: resume.languages || "",
        socialLinks: resume.socialLinks || resume.socicallink || [],
        education: resume.education || [],
        experience: resume.experience || [],
        projects: resume.projects || [],
    });

    const [showSaveToast, setShowSaveToast] = useState(false);

    const handleSave = () => {
        setShowSaveToast(true);
        setTimeout(() => setShowSaveToast(false), 2500);
    };

    const handleUserChange = (field: string, value: string) => {
        setUserData((prev) => ({ ...prev, [field]: value }));
    };

    const handleResumeChange = (field: string, value: string) => {
        setResumeData((prev) => ({ ...prev, [field]: value }));
    };

    const handleArrayChange = (field: string, index: number, key: string, value: string) => {
        setResumeData((prev) => {
            const arr = [...prev[field]];
            arr[index] = { ...arr[index], [key]: value };
            return { ...prev, [field]: arr };
        });
    };

    const addArrayItem = (field: string, defaultObj: Record<string, unknown>) => {
        setResumeData((prev) => ({
            ...prev,
            [field]: [...prev[field], defaultObj],
        }));
    };

    const removeArrayItem = (field: string, index: number) => {
        setResumeData((prev) => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index),
        }));
    };

    return (
        <div className="min-h-screen bg-[#f3f4f6] py-8 px-4 print:p-0">
            {/* Control Panel (Hidden when printing) */}
            <div className="max-w-3xl mx-auto mb-6 bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center print:hidden">
                <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">filter_vintage</span>
                    Chế độ chỉnh sửa trực quan (Template Minimalist Modern)
                </span>
                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        className="bg-emerald-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-emerald-700 transition"
                    >
                        Lưu thay đổi
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="bg-slate-800 text-white px-4 py-2 rounded text-sm font-medium hover:bg-slate-900 transition"
                    >
                        In / Xuất PDF
                    </button>
                </div>
            </div>

            {/* Resume Sheet */}
            <div className="max-w-3xl mx-auto bg-white shadow-xl border border-slate-100 min-h-[1100px] font-sans text-slate-800 p-16 print:shadow-none print:border-none print:my-0 print:p-0">
                
                {/* ── Minimal Header ───────────────────────────────────────── */}
                <header className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 pb-10 border-b border-slate-100">
                    <div className="flex-grow space-y-2 text-center sm:text-left">
                        <input
                            type="text"
                            value={userData.name}
                            onChange={(e) => handleUserChange("name", e.target.value)}
                            className="bg-transparent border-none outline-none text-4xl font-extrabold tracking-tight text-slate-900 w-full focus:bg-slate-50 rounded px-1.5 -mx-1.5 focus:ring-1 focus:ring-slate-300 text-center sm:text-left"
                            placeholder="Họ và Tên"
                        />
                        <input
                            type="text"
                            value={resumeData.degree}
                            onChange={(e) => handleResumeChange("degree", e.target.value)}
                            className="bg-transparent border-none outline-none text-sm text-slate-500 font-semibold uppercase tracking-wider w-full focus:bg-slate-50 rounded px-1.5 -mx-1.5 focus:ring-1 focus:ring-slate-300 text-center sm:text-left"
                            placeholder="Chức danh công việc"
                        />

                        {/* Flat contact info with minimal icons */}
                        <div className="pt-4 flex flex-wrap justify-center sm:justify-start gap-x-6 gap-y-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm text-slate-400">alternate_email</span>
                                <input
                                    type="email"
                                    value={userData.email}
                                    onChange={(e) => handleUserChange("email", e.target.value)}
                                    className="bg-transparent border-none outline-none text-slate-600 w-44 rounded focus:bg-slate-50 px-1 focus:ring-1 focus:ring-slate-300"
                                    placeholder="Email"
                                />
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm text-slate-400">phone_iphone</span>
                                <input
                                    type="text"
                                    value={userData.phone}
                                    onChange={(e) => handleUserChange("phone", e.target.value)}
                                    className="bg-transparent border-none outline-none text-slate-600 w-28 rounded focus:bg-slate-50 px-1 focus:ring-1 focus:ring-slate-300"
                                    placeholder="Số điện thoại"
                                />
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm text-slate-400">map</span>
                                <input
                                    type="text"
                                    value={resumeData.address}
                                    onChange={(e) => handleResumeChange("address", e.target.value)}
                                    className="bg-transparent border-none outline-none text-slate-600 w-40 rounded focus:bg-slate-50 px-1 focus:ring-1 focus:ring-slate-300"
                                    placeholder="Địa chỉ"
                                />
                            </span>
                        </div>
                    </div>

                    {/* Circular Avatar */}
                    <div className="relative group shrink-0">
                        <img
                            src={userData.avatar}
                            alt={userData.name}
                            className="h-24 w-24 rounded-full border border-slate-200 object-cover"
                        />
                        <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full text-white text-[10px] font-semibold cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                            <span className="material-symbols-outlined text-sm mb-0.5">photo_camera</span>
                            Chọn ảnh
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const url = URL.createObjectURL(file);
                                        handleUserChange("avatar", url);
                                    }
                                }}
                                className="hidden"
                            />
                        </label>
                    </div>
                </header>

                {/* ── Single Column Layout ─────────────────────────────────── */}
                <div className="pt-8 space-y-10">
                    
                    {/* Summary */}
                    <Section title="Về tôi" icon="subject">
                        <textarea
                            value={resumeData.summary}
                            onChange={(e) => handleResumeChange("summary", e.target.value)}
                            className="bg-transparent border-none outline-none text-sm leading-relaxed text-slate-600 w-full focus:bg-slate-50 rounded p-1.5 focus:ring-1 focus:ring-slate-300 resize-y"
                            placeholder="Nhập thông tin giới thiệu bản thân..."
                            rows={3}
                        />
                    </Section>

                    {/* Experience */}
                    <Section 
                        title="Kinh nghiệm" 
                        icon="work"
                        onAdd={() => addArrayItem("experience", { position: "Chức vụ", company: "Tên doanh nghiệp", startYear: "2023", endYear: "", description: "" })}
                    >
                        <div className="space-y-6">
                            {resumeData.experience.map((exp, i) => (
                                <div key={i} className="relative group/exp space-y-1">
                                    <div className="flex justify-between items-baseline gap-2">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-x-2">
                                            <input
                                                type="text"
                                                value={exp.position}
                                                onChange={(eVal) => handleArrayChange("experience", i, "position", eVal.target.value)}
                                                className="bg-transparent border-none outline-none font-bold text-slate-900 text-sm focus:ring-1 focus:ring-slate-300 rounded"
                                                placeholder="Chức danh"
                                            />
                                            <span className="hidden sm:inline text-slate-300">|</span>
                                            <input
                                                type="text"
                                                value={exp.company}
                                                onChange={(eVal) => handleArrayChange("experience", i, "company", eVal.target.value)}
                                                className="bg-transparent border-none outline-none text-xs text-slate-500 font-semibold focus:ring-1 focus:ring-slate-300 rounded"
                                                placeholder="Doanh nghiệp"
                                            />
                                        </div>
                                        <div className="flex gap-1 text-xs text-slate-400 shrink-0">
                                            <input
                                                type="text"
                                                value={exp.startYear}
                                                onChange={(eVal) => handleArrayChange("experience", i, "startYear", eVal.target.value)}
                                                className="bg-transparent border-none outline-none w-12 text-right focus:ring-1 focus:ring-slate-300 rounded"
                                                placeholder="Bắt đầu"
                                            />
                                            <span>–</span>
                                            <input
                                                type="text"
                                                value={exp.endYear || ""}
                                                onChange={(eVal) => handleArrayChange("experience", i, "endYear", eVal.target.value)}
                                                className="bg-transparent border-none outline-none w-12 focus:ring-1 focus:ring-slate-300 rounded"
                                                placeholder="nay"
                                            />
                                        </div>
                                    </div>
                                    <textarea
                                        value={exp.description || ""}
                                        onChange={(eVal) => handleArrayChange("experience", i, "description", eVal.target.value)}
                                        className="bg-transparent border-none outline-none text-xs text-slate-500 w-full focus:bg-slate-50 rounded p-1 focus:ring-1 focus:ring-slate-300 resize-y mt-1.5"
                                        placeholder="Mô tả công việc thực hiện..."
                                        rows={3}
                                    />
                                    <button
                                        onClick={() => removeArrayItem("experience", i)}
                                        className="absolute right-0 top-0 text-red-500 hover:text-red-700 text-[10px] font-semibold opacity-0 group-hover/exp:opacity-100 transition-opacity print:hidden"
                                    >
                                        ✕ Xóa
                                    </button>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* Projects */}
                    <Section 
                        title="Dự án" 
                        icon="code"
                        onAdd={() => addArrayItem("projects", { name: "Tên dự án", position: "Vai trò", link: "", description: "" })}
                    >
                        <div className="space-y-6">
                            {resumeData.projects.map((p, i) => (
                                <div key={i} className="relative group/proj space-y-1">
                                    <div className="flex justify-between items-baseline gap-2">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-x-2">
                                            <input
                                                type="text"
                                                value={p.name}
                                                onChange={(eVal) => handleArrayChange("projects", i, "name", eVal.target.value)}
                                                className="bg-transparent border-none outline-none font-bold text-slate-800 text-sm focus:ring-1 focus:ring-slate-300 rounded"
                                                placeholder="Tên dự án"
                                            />
                                            <span className="hidden sm:inline text-slate-300">|</span>
                                            <input
                                                type="text"
                                                value={p.position || ""}
                                                onChange={(eVal) => handleArrayChange("projects", i, "position", eVal.target.value)}
                                                className="bg-transparent border-none outline-none text-xs text-slate-500 focus:ring-1 focus:ring-slate-300 rounded"
                                                placeholder="Vai trò"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            value={p.link || ""}
                                            onChange={(eVal) => handleArrayChange("projects", i, "link", eVal.target.value)}
                                            className="bg-transparent border-none outline-none text-xs text-slate-400 hover:underline text-right w-24 focus:ring-1 focus:ring-slate-300 rounded"
                                            placeholder="Link dự án"
                                        />
                                    </div>
                                    <textarea
                                        value={p.description || ""}
                                        onChange={(eVal) => handleArrayChange("projects", i, "description", eVal.target.value)}
                                        className="bg-transparent border-none outline-none text-xs text-slate-500 w-full focus:bg-slate-50 rounded p-1 focus:ring-1 focus:ring-slate-300 resize-y mt-1.5"
                                        placeholder="Chi tiết dự án..."
                                        rows={3}
                                    />
                                    <button
                                        onClick={() => removeArrayItem("projects", i)}
                                        className="absolute right-0 top-0 text-red-500 hover:text-red-700 text-[10px] font-semibold opacity-0 group-hover/proj:opacity-100 transition-opacity print:hidden"
                                    >
                                        ✕ Xóa
                                    </button>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* Two-Col Education + Skills */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Education */}
                        <Section 
                            title="Học vấn" 
                            icon="school"
                            onAdd={() => addArrayItem("education", { school: "Tên trường", degree: "Bằng cấp", field: "", startYear: "2020", endYear: "", GPA: "", description: "" })}
                        >
                            <div className="space-y-4">
                                {resumeData.education.map((e, i) => (
                                    <div key={i} className="relative group/edu space-y-1">
                                        <input
                                            type="text"
                                            value={e.school}
                                            onChange={(eVal) => handleArrayChange("education", i, "school", eVal.target.value)}
                                            className="bg-transparent border-none outline-none font-bold text-slate-800 text-xs w-full focus:ring-1 focus:ring-slate-300 rounded"
                                            placeholder="Trường học"
                                        />
                                        <div className="flex gap-1 text-[10px] text-slate-500">
                                            <input
                                                type="text"
                                                value={e.degree}
                                                onChange={(eVal) => handleArrayChange("education", i, "degree", eVal.target.value)}
                                                className="bg-transparent border-none outline-none w-1/2"
                                                placeholder="Bằng cấp"
                                            />
                                            <input
                                                type="text"
                                                value={e.field}
                                                onChange={(eVal) => handleArrayChange("education", i, "field", eVal.target.value)}
                                                className="bg-transparent border-none outline-none w-1/2"
                                                placeholder="Ngành"
                                            />
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                            <input
                                                type="text"
                                                value={e.startYear}
                                                onChange={(eVal) => handleArrayChange("education", i, "startYear", eVal.target.value)}
                                                className="bg-transparent border-none outline-none w-8"
                                                placeholder="2018"
                                            />
                                            <span>–</span>
                                            <input
                                                type="text"
                                                value={e.endYear || ""}
                                                onChange={(eVal) => handleArrayChange("education", i, "endYear", eVal.target.value)}
                                                className="bg-transparent border-none outline-none w-8"
                                                placeholder="2022"
                                            />
                                            <span className="ml-1">GPA:</span>
                                            <input
                                                type="text"
                                                value={e.GPA || ""}
                                                onChange={(eVal) => handleArrayChange("education", i, "GPA", eVal.target.value)}
                                                className="bg-transparent border-none outline-none w-8"
                                                placeholder="3.5"
                                            />
                                        </div>
                                        <button
                                            onClick={() => removeArrayItem("education", i)}
                                            className="absolute right-0 top-0 text-red-500 hover:text-red-700 font-bold opacity-0 group-hover/edu:opacity-100 transition-opacity print:hidden text-[10px]"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </Section>

                        {/* Skills / Languages */}
                        <div className="space-y-8">
                            <Section title="Kỹ năng & Ngoại ngữ" icon="military_tech">
                                <textarea
                                    value={resumeData.languages}
                                    onChange={(e) => handleResumeChange("languages", e.target.value)}
                                    className="bg-transparent border-none outline-none text-xs text-slate-500 w-full focus:bg-slate-50 rounded p-1.5 focus:ring-1 focus:ring-slate-300 resize-y border border-transparent focus:border-slate-100"
                                    placeholder="Ngoại ngữ, các kỹ năng chuyên môn..."
                                    rows={5}
                                />
                            </Section>

                            {/* Social platform connections */}
                            <Section title="Liên kết" icon="public">
                                <div className="space-y-2">
                                    {resumeData.socialLinks.map((s, i) => (
                                        <div key={i} className="flex items-center gap-1 border-b border-slate-100 pb-1 relative group/link">
                                            <input
                                                type="text"
                                                value={s.platform}
                                                onChange={(e) => handleArrayChange("socialLinks", i, "platform", e.target.value)}
                                                className="bg-transparent border-none outline-none text-xs w-16 font-semibold text-slate-700"
                                                placeholder="Social"
                                            />
                                            <input
                                                type="text"
                                                value={s.url}
                                                onChange={(e) => handleArrayChange("socialLinks", i, "url", e.target.value)}
                                                className="bg-transparent border-none outline-none text-[10px] w-28 text-slate-400"
                                                placeholder="URL"
                                            />
                                            <button
                                                onClick={() => removeArrayItem("socialLinks", i)}
                                                className="text-red-400 hover:text-red-650 font-bold ml-1 text-xs opacity-0 group-hover/link:opacity-100 transition-opacity print:hidden"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => addArrayItem("socialLinks", { platform: "Social", url: "" })}
                                        className="text-xs text-slate-500 hover:text-slate-700 font-semibold flex items-center gap-1 pt-1 print:hidden"
                                    >
                                        <span className="material-symbols-outlined text-xs">add</span>
                                        Thêm mạng xã hội
                                    </button>
                                </div>
                            </Section>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Toast Notification */}
            {showSaveToast && (
                <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-bounce print:hidden">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>Đã cập nhật bản xem trước trong phiên làm việc!</span>
                </div>
            )}
        </div>
    );
}

/* ── Reusable section component ──────────────────────────────── */
function Section({ title, icon, children, onAdd }) {
    return (
        <section className="relative group/section">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400 flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <span className="flex items-center gap-1 text-slate-800">
                    {icon && <span className="material-symbols-outlined text-sm leading-none text-slate-500">{icon}</span>}
                    {title}
                </span>
                {onAdd && (
                    <button
                        onClick={onAdd}
                        className="text-slate-400 hover:text-slate-700 text-[10px] font-sans flex items-center gap-0.5 opacity-0 group-hover/section:opacity-100 transition-opacity print:hidden normal-case tracking-normal shrink-0"
                    >
                        <span className="material-symbols-outlined text-[10px]">add</span>
                        Thêm mới
                    </button>
                )}
            </h2>
            {children}
        </section>
    );
}
