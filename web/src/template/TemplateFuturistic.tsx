// @ts-nocheck
"use client";
import type { TemplateProps, UserData, ResumeData } from "./index";

import { useState } from "react";

/**
 * TemplateFuturistic — Phong cách tương lai, tối tân (Tech/Dark Mode), sử dụng Google Material Symbols
 */
export default function TemplateFuturistic({ user = {} as Partial<UserData>, resume = {} as Partial<ResumeData> }: TemplateProps) {
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
        <div className="min-h-screen bg-slate-950 py-8 px-4 print:p-0">
            {/* Control Panel (Hidden when printing) */}
            <div className="max-w-4xl mx-auto mb-6 bg-slate-900/80 p-4 rounded-xl border border-cyan-500/20 backdrop-blur-md flex justify-between items-center print:hidden">
                <span className="text-sm font-semibold text-cyan-400 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm animate-pulse">rocket_launch</span>
                    Chế độ chỉnh sửa trực quan (Template Futuristic)
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
                        className="bg-cyan-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-cyan-700 transition"
                    >
                        In / Xuất PDF
                    </button>
                </div>
            </div>

            {/* Resume Sheet */}
            <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl overflow-hidden min-h-[1100px] font-sans p-10 print:border-none print:bg-slate-900 print:my-0 print:p-0 print:rounded-none">
                
                {/* ── Futuristic Header ────────────────────────────────────── */}
                <header className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-cyan-500/20 pb-8">
                    <div className="flex-grow text-center md:text-left space-y-3 w-full">
                        <div className="relative inline-block md:block">
                            <input
                                type="text"
                                value={userData.name}
                                onChange={(e) => handleUserChange("name", e.target.value)}
                                className="bg-transparent border-none outline-none text-4xl font-black tracking-tight text-white w-full rounded focus:bg-slate-800 px-2 -mx-2 focus:ring-1 focus:ring-cyan-500 text-center md:text-left uppercase"
                                placeholder="Họ và Tên"
                            />
                            <div className="h-1 w-20 bg-cyan-500 mx-auto md:mx-0 mt-1" />
                        </div>
                        <input
                            type="text"
                            value={resumeData.degree}
                            onChange={(e) => handleResumeChange("degree", e.target.value)}
                            className="bg-transparent border-none outline-none text-lg text-cyan-400 font-semibold tracking-wider w-full focus:bg-slate-800 px-2 -mx-2 focus:ring-1 focus:ring-cyan-500 text-center md:text-left uppercase"
                            placeholder="Vị trí mong muốn"
                        />

                        {/* Contact details with Cyan glows */}
                        <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-4 text-xs text-slate-300">
                            <span className="flex items-center gap-1.5 bg-slate-800/60 px-3 py-1 rounded border border-slate-700">
                                <span className="material-symbols-outlined text-sm text-cyan-400">mail</span>
                                <input
                                    type="email"
                                    value={userData.email}
                                    onChange={(e) => handleUserChange("email", e.target.value)}
                                    className="bg-transparent border-none outline-none text-slate-200 w-36 ml-0.5 placeholder-slate-500"
                                    placeholder="Email"
                                />
                            </span>
                            <span className="flex items-center gap-1.5 bg-slate-800/60 px-3 py-1 rounded border border-slate-700">
                                <span className="material-symbols-outlined text-sm text-cyan-400">call</span>
                                <input
                                    type="text"
                                    value={userData.phone}
                                    onChange={(e) => handleUserChange("phone", e.target.value)}
                                    className="bg-transparent border-none outline-none text-slate-200 w-28 ml-0.5 placeholder-slate-500"
                                    placeholder="Số điện thoại"
                                />
                            </span>
                            <span className="flex items-center gap-1.5 bg-slate-800/60 px-3 py-1 rounded border border-slate-700">
                                <span className="material-symbols-outlined text-sm text-cyan-400">location_on</span>
                                <input
                                    type="text"
                                    value={resumeData.address}
                                    onChange={(e) => handleResumeChange("address", e.target.value)}
                                    className="bg-transparent border-none outline-none text-slate-200 w-44 ml-0.5 placeholder-slate-500"
                                    placeholder="Địa chỉ"
                                />
                            </span>
                        </div>
                    </div>

                    {/* Cyber Avatar with glowing border */}
                    <div className="relative group shrink-0">
                        <div className="absolute inset-0 bg-cyan-500 rounded-2xl filter blur-md opacity-40 group-hover:opacity-75 transition-opacity" />
                        <img
                            src={userData.avatar}
                            alt={userData.name}
                            className="relative h-28 w-28 rounded-2xl border-2 border-cyan-400 object-cover shadow-2xl"
                        />
                        <label className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 rounded-2xl text-cyan-400 text-[10px] font-semibold cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity print:hidden z-20 border border-cyan-400">
                            <span className="material-symbols-outlined text-sm mb-1">upload_file</span>
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

                {/* ── Content Layout ───────────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-8 pt-8">
                    
                    {/* Left Column (Experiences & Projects) */}
                    <div className="space-y-8">
                        {/* Summary */}
                        <Section title="Về bản thân" icon="person_search">
                            <textarea
                                value={resumeData.summary}
                                onChange={(e) => handleResumeChange("summary", e.target.value)}
                                className="bg-slate-800/40 border border-slate-800 focus:border-cyan-500/50 outline-none text-sm leading-relaxed text-slate-300 w-full rounded p-3 focus:ring-1 focus:ring-cyan-500/50 resize-y"
                                placeholder="Tóm tắt về bạn..."
                                rows={4}
                            />
                        </Section>

                        {/* Experience */}
                        <Section 
                            title="Quá trình làm việc" 
                            icon="timeline"
                            onAdd={() => addArrayItem("experience", { position: "Chức vụ", company: "Công ty", startYear: "2023", endYear: "", description: "" })}
                        >
                            <div className="space-y-6">
                                {resumeData.experience.map((exp, i) => (
                                    <div key={i} className="relative group/exp bg-slate-800/30 p-4 rounded-xl border border-slate-800/80 hover:border-cyan-500/20 transition space-y-1">
                                        <div className="flex justify-between items-baseline gap-2">
                                            <input
                                                type="text"
                                                value={exp.position}
                                                onChange={(eVal) => handleArrayChange("experience", i, "position", eVal.target.value)}
                                                className="bg-transparent border-none outline-none font-bold text-white text-sm focus:ring-1 focus:ring-cyan-500 rounded"
                                                placeholder="Chức danh"
                                            />
                                            <div className="flex gap-1 text-[11px] text-cyan-400 bg-cyan-950/40 border border-cyan-800/30 px-2 py-0.5 rounded-full shrink-0">
                                                <input
                                                    type="text"
                                                    value={exp.startYear}
                                                    onChange={(eVal) => handleArrayChange("experience", i, "startYear", eVal.target.value)}
                                                    className="bg-transparent border-none outline-none w-10 text-right"
                                                    placeholder="Bắt đầu"
                                                />
                                                <span>–</span>
                                                <input
                                                    type="text"
                                                    value={exp.endYear || ""}
                                                    onChange={(eVal) => handleArrayChange("experience", i, "endYear", eVal.target.value)}
                                                    className="bg-transparent border-none outline-none w-10"
                                                    placeholder="nay"
                                                />
                                            </div>
                                        </div>
                                        <input
                                            type="text"
                                            value={exp.company}
                                            onChange={(eVal) => handleArrayChange("experience", i, "company", eVal.target.value)}
                                            className="bg-transparent border-none outline-none text-xs text-cyan-400 italic focus:ring-1 focus:ring-cyan-500 rounded w-full"
                                            placeholder="Tên công ty"
                                        />
                                        <textarea
                                            value={exp.description || ""}
                                            onChange={(eVal) => handleArrayChange("experience", i, "description", eVal.target.value)}
                                            className="bg-transparent border-none outline-none text-xs text-slate-400 w-full focus:bg-slate-800/50 rounded p-1 focus:ring-1 focus:ring-cyan-500 resize-y mt-2"
                                            placeholder="Chi tiết công việc..."
                                            rows={3}
                                        />
                                        <button
                                            onClick={() => removeArrayItem("experience", i)}
                                            className="absolute right-3 top-3 text-red-400 hover:text-red-500 text-xs font-semibold opacity-0 group-hover/exp:opacity-100 transition-opacity print:hidden"
                                        >
                                            ✕ Xóa
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </Section>

                        {/* Projects */}
                        <Section 
                            title="Dự án phát triển" 
                            icon="terminal"
                            onAdd={() => addArrayItem("projects", { name: "Tên dự án", position: "Vai trò", link: "", description: "" })}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {resumeData.projects.map((p, i) => (
                                    <div key={i} className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl hover:border-cyan-500/20 transition relative group/proj shadow-sm">
                                        <button
                                            onClick={() => removeArrayItem("projects", i)}
                                            className="absolute right-3 top-3 text-red-500 hover:text-red-700 text-xs font-semibold opacity-0 group-hover/proj:opacity-100 transition-opacity print:hidden"
                                        >
                                            ✕
                                        </button>
                                        <div className="flex flex-col gap-1">
                                            <input
                                                type="text"
                                                value={p.name}
                                                onChange={(eVal) => handleArrayChange("projects", i, "name", eVal.target.value)}
                                                className="bg-transparent border-none outline-none font-bold text-white text-sm focus:ring-1 focus:ring-cyan-500 rounded"
                                                placeholder="Tên dự án"
                                            />
                                            <input
                                                type="text"
                                                value={p.link || ""}
                                                onChange={(eVal) => handleArrayChange("projects", i, "link", eVal.target.value)}
                                                className="bg-transparent border-none outline-none text-xs text-cyan-400 hover:underline focus:ring-1 focus:ring-cyan-500 rounded"
                                                placeholder="Link dự án"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            value={p.position || ""}
                                            onChange={(eVal) => handleArrayChange("projects", i, "position", eVal.target.value)}
                                            className="bg-transparent border-none outline-none text-xs text-slate-400 mt-1 focus:ring-1 focus:ring-cyan-500 rounded w-full"
                                            placeholder="Vai trò"
                                        />
                                        <textarea
                                            value={p.description || ""}
                                            onChange={(eVal) => handleArrayChange("projects", i, "description", eVal.target.value)}
                                            className="bg-transparent border-none outline-none mt-2 text-xs text-slate-400 w-full focus:bg-slate-800/50 rounded resize-y focus:ring-1 focus:ring-cyan-500"
                                            placeholder="Mô tả dự án..."
                                            rows={3}
                                        />
                                    </div>
                                ))}
                            </div>
                        </Section>
                    </div>

                    {/* Right Column (Sidebar/Tech Info) */}
                    <div className="space-y-8 bg-slate-850 p-6 rounded-xl border border-slate-800">
                        {/* Social */}
                        <Section title="Social Networks" icon="connect_without_contact">
                            <div className="space-y-2">
                                {resumeData.socialLinks.map((s, i) => (
                                    <div key={i} className="flex items-center gap-1 bg-slate-800/80 p-2 rounded border border-slate-700 relative group/link shadow-sm">
                                        <span className="material-symbols-outlined text-sm text-cyan-400">link</span>
                                        <input
                                            type="text"
                                            value={s.platform}
                                            onChange={(e) => handleArrayChange("socialLinks", i, "platform", e.target.value)}
                                            className="bg-transparent border-none outline-none text-xs w-14 font-semibold text-slate-200"
                                            placeholder="Nền tảng"
                                        />
                                        <input
                                            type="text"
                                            value={s.url}
                                            onChange={(e) => handleArrayChange("socialLinks", i, "url", e.target.value)}
                                            className="bg-transparent border-none outline-none text-[10px] w-24 text-cyan-400"
                                            placeholder="URL Link"
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
                                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 pt-1 print:hidden"
                                >
                                    <span className="material-symbols-outlined text-xs">add_circle</span>
                                    Thêm mạng xã hội
                                </button>
                            </div>
                        </Section>

                        {/* Languages / Skills */}
                        <Section title="Kỹ năng & Skill" icon="offline_bolt">
                            <textarea
                                value={resumeData.languages}
                                onChange={(e) => handleResumeChange("languages", e.target.value)}
                                className="bg-transparent border-none outline-none text-xs text-slate-300 w-full focus:bg-slate-800 rounded p-1.5 focus:ring-1 focus:ring-cyan-500 resize-y border border-slate-800"
                                placeholder="Các kỹ năng nổi bật..."
                                rows={6}
                            />
                        </Section>

                        {/* Education */}
                        <Section 
                            title="Học vấn" 
                            icon="auto_stories"
                            onAdd={() => addArrayItem("education", { school: "Trường", degree: "Bằng", field: "", startYear: "2020", endYear: "", GPA: "", description: "" })}
                        >
                            <div className="space-y-4">
                                {resumeData.education.map((e, i) => (
                                    <div key={i} className="relative group/edu bg-slate-800/40 p-3 rounded-lg border border-slate-800">
                                        <input
                                            type="text"
                                            value={e.school}
                                            onChange={(eVal) => handleArrayChange("education", i, "school", eVal.target.value)}
                                            className="bg-transparent border-none outline-none font-bold text-white text-xs w-full focus:ring-1 focus:ring-cyan-500 rounded"
                                            placeholder="Trường học"
                                        />
                                        <div className="flex gap-1 text-[10px] text-slate-400 mt-0.5">
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
                                                placeholder="Ngành học"
                                            />
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-cyan-400/80 mt-0.5">
                                            <input
                                                type="text"
                                                value={e.startYear}
                                                onChange={(eVal) => handleArrayChange("education", i, "startYear", eVal.target.value)}
                                                className="bg-transparent border-none outline-none w-8 text-cyan-400"
                                                placeholder="2018"
                                            />
                                            <span>–</span>
                                            <input
                                                type="text"
                                                value={e.endYear || ""}
                                                onChange={(eVal) => handleArrayChange("education", i, "endYear", eVal.target.value)}
                                                className="bg-transparent border-none outline-none w-8 text-cyan-400"
                                                placeholder="2022"
                                            />
                                            <span className="ml-1 text-slate-400">GPA:</span>
                                            <input
                                                type="text"
                                                value={e.GPA || ""}
                                                onChange={(eVal) => handleArrayChange("education", i, "GPA", eVal.target.value)}
                                                className="bg-transparent border-none outline-none w-8 text-cyan-400"
                                                placeholder="3.5"
                                            />
                                        </div>
                                        <button
                                            onClick={() => removeArrayItem("education", i)}
                                            className="absolute right-2 top-2 text-red-400 hover:text-red-650 font-bold opacity-0 group-hover/edu:opacity-100 transition-opacity print:hidden text-[10px]"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </Section>
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
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5 text-cyan-400">
                    {icon && <span className="material-symbols-outlined text-lg leading-none">{icon}</span>}
                    {title}
                </span>
                {onAdd && (
                    <button
                        onClick={onAdd}
                        className="text-slate-500 hover:text-cyan-400 text-xs font-sans flex items-center gap-0.5 opacity-0 group-hover/section:opacity-100 transition-opacity print:hidden normal-case tracking-normal shrink-0"
                    >
                        <span className="material-symbols-outlined text-xs">add_box</span>
                        Thêm mới
                    </button>
                )}
            </h2>
            {children}
        </section>
    );
}
