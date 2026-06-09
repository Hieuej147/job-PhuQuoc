// @ts-nocheck
"use client";
import type { TemplateProps, UserData, ResumeData } from "./index";

import { useState, useEffect } from "react";

/**
 * TemplateClassic — Phong cách thanh lịch, truyền thống (Form nhập liệu)
 * Layout: cột trái (thông tin cá nhân, kỹ năng, học văn) | cột phải (tóm tắt, kinh nghiệm, dự án)
 */
export default function TemplateClassic({ user = {} as Partial<UserData>, resume = {} as Partial<ResumeData> }: TemplateProps) {
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
        socicallink: resume.socicallink || [],
        education: resume.education || [],
        experience: resume.experience || [],
        projects: resume.projects || [],
    });

    const [showSaveToast, setShowSaveToast] = useState(false);

    // Load saved data on mount
    useEffect(() => {
        const savedUser = localStorage.getItem("pqjobs_cv_user");
        const savedResume = localStorage.getItem("pqjobs_cv_resume");
        if (savedUser) {
            try {
                setUserData(JSON.parse(savedUser));
            } catch (e) {
                console.error("Failed to parse saved user data", e);
            }
        }
        if (savedResume) {
            try {
                setResumeData(JSON.parse(savedResume));
            } catch (e) {
                console.error("Failed to parse saved resume data", e);
            }
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem("pqjobs_cv_user", JSON.stringify(userData));
        localStorage.setItem("pqjobs_cv_resume", JSON.stringify(resumeData));
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
        <div className="min-h-screen bg-stone-100 py-8 px-4 print:p-0">
            {/* Control Panel (Hidden when printing) */}
            <div className="max-w-5xl mx-auto mb-6 bg-white p-4 rounded-lg shadow-sm border border-stone-200 flex justify-between items-center print:hidden">
                <span className="text-sm font-semibold text-stone-600"> Chế độ chỉnh sửa trực quan (Template Classic)</span>
                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        className="bg-emerald-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-emerald-700 transition"
                    >
                        Lưu thay đổi
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="bg-stone-800 text-white px-4 py-2 rounded text-sm font-medium hover:bg-stone-700 transition"
                    >
                        In / Xuất PDF
                    </button>
                </div>
            </div>

            {/* Resume Sheet */}
            <div className="max-w-5xl mx-auto bg-white shadow-lg border border-stone-200 min-h-[1100px] font-serif text-gray-800 print:shadow-none print:border-none print:my-0">
                {/* ── Header ─────────────────────────────────────────────── */}
                <header className="flex items-center gap-6 bg-stone-800 px-10 py-8 text-white">
                    <div className="relative group shrink-0">
                        <img
                            src={userData.avatar}
                            alt={userData.name}
                            className="h-24 w-24 rounded-full border-4 border-stone-400 object-cover"
                        />
                        <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full text-white text-[11px] font-semibold cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                            📷 Thay ảnh
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
                    <div className="flex-1 space-y-1">
                        <input
                            type="text"
                            value={userData.name}
                            onChange={(e) => handleUserChange("name", e.target.value)}
                            className="bg-transparent border-none outline-none text-3xl font-bold tracking-wide text-white w-full rounded focus:bg-stone-700/50 px-2 -mx-2 focus:ring-1 focus:ring-stone-400"
                            placeholder="Họ và Tên"
                        />
                        <input
                            type="text"
                            value={resumeData.degree}
                            onChange={(e) => handleResumeChange("degree", e.target.value)}
                            className="bg-transparent border-none outline-none text-base text-stone-300 italic w-full rounded focus:bg-stone-700/50 px-2 -mx-2 focus:ring-1 focus:ring-stone-400"
                            placeholder="Bằng cấp / Vị trí ứng tuyển"
                        />
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-300">
                            <span className="flex items-center gap-1">
                                ✉
                                <input
                                    type="email"
                                    value={userData.email}
                                    onChange={(e) => handleUserChange("email", e.target.value)}
                                    className="bg-transparent border-none outline-none text-stone-300 rounded focus:bg-stone-700/50 px-1 focus:ring-1 focus:ring-stone-400 w-48 text-sm"
                                    placeholder="Email"
                                />
                            </span>
                            <span className="flex items-center gap-1">
                                📞
                                <input
                                    type="text"
                                    value={userData.phone}
                                    onChange={(e) => handleUserChange("phone", e.target.value)}
                                    className="bg-transparent border-none outline-none text-stone-300 rounded focus:bg-stone-700/50 px-1 focus:ring-1 focus:ring-stone-400 w-36 text-sm"
                                    placeholder="Số điện thoại"
                                />
                            </span>
                            <span className="flex items-center gap-1">
                                📍
                                <input
                                    type="text"
                                    value={resumeData.address}
                                    onChange={(e) => handleResumeChange("address", e.target.value)}
                                    className="bg-transparent border-none outline-none text-stone-300 rounded focus:bg-stone-700/50 px-1 focus:ring-1 focus:ring-stone-400 w-56 text-sm"
                                    placeholder="Địa chỉ"
                                />
                            </span>
                        </div>

                        {/* Social Links */}
                        <div className="mt-2 flex flex-wrap gap-3 text-sm">
                            {resumeData.socicallink.map((s, i) => (
                                <div key={i} className="flex items-center gap-1 bg-stone-700/40 px-2 py-0.5 rounded border border-stone-600/40 relative group/link">
                                    <input
                                        type="text"
                                        value={s.platform}
                                        onChange={(e) => handleArrayChange("socicallink", i, "platform", e.target.value)}
                                        className="bg-transparent border-none outline-none text-stone-200 text-xs w-16 font-semibold"
                                        placeholder="Nền tảng"
                                    />
                                    <input
                                        type="text"
                                        value={s.url}
                                        onChange={(e) => handleArrayChange("socicallink", i, "url", e.target.value)}
                                        className="bg-transparent border-none outline-none text-stone-300 text-xs w-28"
                                        placeholder="URL liên kết"
                                    />
                                    <button
                                        onClick={() => removeArrayItem("socicallink", i)}
                                        className="text-stone-400 hover:text-red-400 font-sans text-xs ml-1 opacity-0 group-hover/link:opacity-100 transition-opacity print:hidden"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => addArrayItem("socicallink", { platform: "GitHub", url: "" })}
                                className="text-stone-300 hover:text-white text-xs underline font-sans flex items-center gap-1 print:hidden"
                            >
                                + Thêm liên kết
                            </button>
                        </div>
                    </div>
                </header>

                {/* ── Body ───────────────────────────────────────────────── */}
                <div className="grid grid-cols-[280px_1fr] min-h-[900px] border-t border-stone-200">
                    {/* LEFT COLUMN */}
                    <aside className="bg-stone-50 px-7 py-8 space-y-8 border-r border-stone-200">
                        {/* Education */}
                        <Section
                            title="Học vấn"
                            onAdd={() => addArrayItem("education", { school: "Tên trường", degree: "Bằng cấp", field: "", startYear: "2020", endYear: "2024", GPA: "", description: "" })}
                        >
                            {resumeData.education.map((e, i) => (
                                <div key={i} className="mb-6 relative group/item border-b border-stone-200/50 pb-4 last:border-b-0 last:pb-0">
                                    <button
                                        onClick={() => removeArrayItem("education", i)}
                                        className="absolute -right-2 top-0 text-red-500 hover:text-red-700 text-xs font-sans font-bold opacity-0 group-hover/item:opacity-100 transition-opacity print:hidden"
                                    >
                                        Xóa
                                    </button>
                                    <input
                                        type="text"
                                        value={e.school}
                                        onChange={(eVal) => handleArrayChange("education", i, "school", eVal.target.value)}
                                        className="bg-transparent border-none outline-none font-semibold text-stone-800 w-full focus:bg-stone-200/40 rounded px-1 -mx-1 focus:ring-1 focus:ring-stone-400 text-sm"
                                        placeholder="Trường học"
                                    />
                                    <div className="flex gap-1 mt-0.5">
                                        <input
                                            type="text"
                                            value={e.degree}
                                            onChange={(eVal) => handleArrayChange("education", i, "degree", eVal.target.value)}
                                            className="bg-transparent border-none outline-none text-xs text-stone-600 focus:bg-stone-200/40 rounded px-1 -mx-1 focus:ring-1 focus:ring-stone-400 w-1/2"
                                            placeholder="Bằng cấp"
                                        />
                                        <input
                                            type="text"
                                            value={e.field}
                                            onChange={(eVal) => handleArrayChange("education", i, "field", eVal.target.value)}
                                            className="bg-transparent border-none outline-none text-xs text-stone-600 focus:bg-stone-200/40 rounded px-1 -mx-1 focus:ring-1 focus:ring-stone-400 w-1/2"
                                            placeholder="Ngành học"
                                        />
                                    </div>
                                    <div className="flex gap-2 mt-0.5 text-xs text-stone-500">
                                        <input
                                            type="text"
                                            value={e.startYear}
                                            onChange={(eVal) => handleArrayChange("education", i, "startYear", eVal.target.value)}
                                            className="bg-transparent border-none outline-none focus:bg-stone-200/40 rounded px-1 -mx-1 focus:ring-1 focus:ring-stone-400 w-16"
                                            placeholder="Bắt đầu"
                                        />
                                        <span>–</span>
                                        <input
                                            type="text"
                                            value={e.endYear || ""}
                                            onChange={(eVal) => handleArrayChange("education", i, "endYear", eVal.target.value)}
                                            className="bg-transparent border-none outline-none focus:bg-stone-200/40 rounded px-1 -mx-1 focus:ring-1 focus:ring-stone-400 w-16"
                                            placeholder="Kết thúc"
                                        />
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5 text-xs text-stone-500">
                                        <span>GPA:</span>
                                        <input
                                            type="text"
                                            value={e.GPA || ""}
                                            onChange={(eVal) => handleArrayChange("education", i, "GPA", eVal.target.value)}
                                            className="bg-transparent border-none outline-none focus:bg-stone-200/40 rounded px-1 -mx-1 focus:ring-1 focus:ring-stone-400 w-16"
                                            placeholder="3.5"
                                        />
                                    </div>
                                    <textarea
                                        value={e.description || ""}
                                        onChange={(eVal) => handleArrayChange("education", i, "description", eVal.target.value)}
                                        className="bg-transparent border-none outline-none text-xs text-stone-600 w-full focus:bg-stone-200/40 rounded px-1 -mx-1 focus:ring-1 focus:ring-stone-400 mt-1 resize-y"
                                        placeholder="Mô tả học vấn..."
                                        rows={2}
                                    />
                                </div>
                            ))}
                        </Section>

                        {/* Languages */}
                        <Section title="Ngôn ngữ">
                            <textarea
                                value={resumeData.languages}
                                onChange={(e) => handleResumeChange("languages", e.target.value)}
                                className="bg-transparent border-none outline-none text-sm text-stone-700 w-full focus:bg-stone-200/40 rounded px-1 -mx-1 focus:ring-1 focus:ring-stone-400 resize-y"
                                placeholder="Ví dụ: Tiếng Anh (IELTS 7.0)..."
                                rows={4}
                            />
                        </Section>
                    </aside>

                    {/* RIGHT COLUMN */}
                    <main className="px-10 py-8 space-y-8">
                        {/* Summary */}
                        <Section title="Tóm tắt">
                            <textarea
                                value={resumeData.summary}
                                onChange={(e) => handleResumeChange("summary", e.target.value)}
                                className="bg-transparent border-none outline-none text-sm leading-relaxed text-gray-700 w-full focus:bg-stone-100 rounded px-1 -mx-1 focus:ring-1 focus:ring-stone-400 resize-y"
                                placeholder="Nhập một đoạn tóm tắt ngắn về bản thân..."
                                rows={4}
                            />
                        </Section>

                        {/* Experience */}
                        <Section
                            title="Kinh nghiệm làm việc"
                            onAdd={() => addArrayItem("experience", { position: "Chức vụ", company: "Tên công ty", startYear: "01/2023", endYear: "", description: "" })}
                        >
                            {resumeData.experience.map((exp, i) => (
                                <div key={i} className="mb-6 relative group/item border-b border-stone-200/50 pb-4 last:border-b-0 last:pb-0">
                                    <button
                                        onClick={() => removeArrayItem("experience", i)}
                                        className="absolute -right-2 top-0 text-red-500 hover:text-red-700 text-xs font-sans font-bold opacity-0 group-hover/item:opacity-100 transition-opacity print:hidden"
                                    >
                                        Xóa
                                    </button>
                                    <div className="flex justify-between items-baseline gap-2">
                                        <input
                                            type="text"
                                            value={exp.position}
                                            onChange={(eVal) => handleArrayChange("experience", i, "position", eVal.target.value)}
                                            className="bg-transparent border-none outline-none font-semibold text-stone-800 w-full focus:bg-stone-100 rounded px-1 -mx-1 focus:ring-1 focus:ring-stone-400 text-sm"
                                            placeholder="Chức danh công việc"
                                        />
                                        <div className="flex gap-1 text-xs text-stone-500 shrink-0">
                                            <input
                                                type="text"
                                                value={exp.startYear}
                                                onChange={(eVal) => handleArrayChange("experience", i, "startYear", eVal.target.value)}
                                                className="bg-transparent border-none outline-none focus:bg-stone-100 rounded px-1 -mx-1 focus:ring-1 focus:ring-stone-400 w-16 text-right"
                                                placeholder="Bắt đầu"
                                            />
                                            <span>–</span>
                                            <input
                                                type="text"
                                                value={exp.endYear || ""}
                                                onChange={(eVal) => handleArrayChange("experience", i, "endYear", eVal.target.value)}
                                                className="bg-transparent border-none outline-none focus:bg-stone-100 rounded px-1 -mx-1 focus:ring-1 focus:ring-stone-400 w-16"
                                                placeholder="nay"
                                            />
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        value={exp.company}
                                        onChange={(eVal) => handleArrayChange("experience", i, "company", eVal.target.value)}
                                        className="bg-transparent border-none outline-none text-xs text-stone-600 italic w-full focus:bg-stone-100 rounded px-1 -mx-1 focus:ring-1 focus:ring-stone-400 mt-0.5"
                                        placeholder="Công ty"
                                    />
                                    <textarea
                                        value={exp.description || ""}
                                        onChange={(eVal) => handleArrayChange("experience", i, "description", eVal.target.value)}
                                        className="bg-transparent border-none outline-none text-sm text-gray-700 w-full focus:bg-stone-100 rounded px-1 -mx-1 focus:ring-1 focus:ring-stone-400 mt-2 resize-y"
                                        placeholder="Mô tả công việc và thành tựu..."
                                        rows={3}
                                    />
                                </div>
                            ))}
                        </Section>

                        {/* Projects */}
                        <Section
                            title="Dự án"
                            onAdd={() => addArrayItem("projects", { name: "Tên dự án", position: "Vai trò", link: "", description: "" })}
                        >
                            {resumeData.projects.map((p, i) => (
                                <div key={i} className="mb-6 relative group/item border-b border-stone-200/50 pb-4 last:border-b-0 last:pb-0">
                                    <button
                                        onClick={() => removeArrayItem("projects", i)}
                                        className="absolute -right-2 top-0 text-red-500 hover:text-red-700 text-xs font-sans font-bold opacity-0 group-hover/item:opacity-100 transition-opacity print:hidden"
                                    >
                                        Xóa
                                    </button>
                                    <div className="flex justify-between items-baseline gap-2">
                                        <input
                                            type="text"
                                            value={p.name}
                                            onChange={(eVal) => handleArrayChange("projects", i, "name", eVal.target.value)}
                                            className="bg-transparent border-none outline-none font-semibold text-stone-800 w-full focus:bg-stone-100 rounded px-1 -mx-1 focus:ring-1 focus:ring-stone-400 text-sm"
                                            placeholder="Tên dự án"
                                        />
                                        <input
                                            type="text"
                                            value={p.link || ""}
                                            onChange={(eVal) => handleArrayChange("projects", i, "link", eVal.target.value)}
                                            className="bg-transparent border-none outline-none text-xs text-stone-500 underline w-28 text-right"
                                            placeholder="Link dự án"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        value={p.position || ""}
                                        onChange={(eVal) => handleArrayChange("projects", i, "position", eVal.target.value)}
                                        className="bg-transparent border-none outline-none text-xs text-stone-600 italic w-full focus:bg-stone-100 rounded px-1 -mx-1 focus:ring-1 focus:ring-stone-400 mt-0.5"
                                        placeholder="Vai trò trong dự án"
                                    />
                                    <textarea
                                        value={p.description || ""}
                                        onChange={(eVal) => handleArrayChange("projects", i, "description", eVal.target.value)}
                                        className="bg-transparent border-none outline-none text-sm text-gray-700 w-full focus:bg-stone-100 rounded px-1 -mx-1 focus:ring-1 focus:ring-stone-400 mt-2 resize-y"
                                        placeholder="Mô tả dự án..."
                                        rows={3}
                                    />
                                </div>
                            ))}
                        </Section>
                    </main>
                </div>
            </div>
            {showSaveToast && (
                <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-bounce print:hidden">
                    <span>✓</span>
                    <span>Đã lưu thông tin CV vào trình duyệt của bạn!</span>
                </div>
            )}
        </div>
    );
}

/* ── Reusable section heading ──────────────────────────────── */
function Section({ title, children, onAdd }) {
    return (
        <section className="relative group/section">
            <div className="flex justify-between items-center mb-3 border-b-2 border-stone-400 pb-1">
                <h2 className="text-xs uppercase tracking-widest font-bold text-stone-600">
                    {title}
                </h2>
                {onAdd && (
                    <button
                        onClick={onAdd}
                        className="text-stone-500 hover:text-stone-800 text-xs font-sans flex items-center gap-1 opacity-0 group-hover/section:opacity-100 transition-opacity print:hidden"
                    >
                        ➕ Thêm
                    </button>
                )}
            </div>
            {children}
        </section>
    );
}