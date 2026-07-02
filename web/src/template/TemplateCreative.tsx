// @ts-nocheck
"use client";
import type { TemplateProps, UserData, ResumeData } from "./index";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { downloadResumePdf } from "@/lib/resume-pdf";

/**
 * TemplateCreative — Phong cách sáng tạo, trẻ trung, sử dụng Google Material Symbols
 */
export default function TemplateCreative({ user = {} as Partial<UserData>, resume = {} as Partial<ResumeData>, resumeId, readOnly = false }: TemplateProps) {
    const router = useRouter();
    const [userData, setUserData] = useState({
        name: user.name || "Họ và Tên",
        email: user.email || "",
        phone: user.phone || "",
        avatar: user.avatar || "https://i.pravatar.cc/150?img=12",
    });

    const [resumeData, setResumeData] = useState({
        title: resume.title || "CV của tôi",
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

    const handleSave = async () => {
        const isNew = !resumeId;
        const url = isNew ? "/api/v1/resumes" : `/api/v1/resumes/${resumeId}`;
        const method = isNew ? "POST" : "PATCH";

        try {
            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: resumeData.title || "CV của tôi",
                    templateId: "tpl-creative-04",
                    name: userData.name,
                    email: userData.email,
                    phone: userData.phone,
                    avatar: userData.avatar,
                    address: resumeData.address,
                    summary: resumeData.summary,
                    skills: resume.skills || "",
                    degree: resumeData.degree,
                    languages: resumeData.languages,
                    socialLinks: resumeData.socialLinks,
                    education: resumeData.education,
                    experience: resumeData.experience,
                    projects: resumeData.projects,
                }),
            });
            if (response.ok) {
                toast.success(isNew ? "Tạo CV thành công!" : "Lưu CV thành công!");
                router.push("/candidate/resumes");
            } else {
                toast.error("Lưu CV thất bại!");
            }
        } catch (err) {
            toast.error("Lỗi khi lưu dữ liệu CV");
        }
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
        <div className="min-h-screen bg-violet-50/50 py-8 px-4 print:p-0">
            {/* Control Panel (Hidden when printing) */}
            {!readOnly && (
                <div className="max-w-4xl mx-auto mb-6 bg-white p-4 rounded-lg shadow-sm border border-violet-100 flex justify-between items-center print:hidden">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-violet-500 uppercase tracking-wider">Tên CV:</span>
                        <input
                            type="text"
                            value={resumeData.title}
                            onChange={(e) => handleResumeChange("title", e.target.value)}
                            className="bg-violet-50/50 border border-violet-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 w-52 font-medium transition text-slate-800"
                            placeholder="Nhập tên CV..."
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            className="bg-emerald-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-emerald-700 transition"
                        >
                            Lưu thay đổi
                        </button>
                        {resumeId && (
                            <button
                                onClick={() => downloadResumePdf(resumeId, resumeData.title)}
                                className="bg-violet-700 text-white px-4 py-2 rounded text-sm font-medium hover:bg-violet-800 transition"
                            >
                                Xuất PDF
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Resume Sheet */}
            <div className={`max-w-4xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden border border-violet-100 min-h-[1100px] font-sans text-slate-800 print:shadow-none print:border-none print:my-0 print:rounded-none ${readOnly ? 'pointer-events-none select-none' : ''}`}>
                
                {/* ── Dynamic Banner & Header ───────────────────────────────── */}
                <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white px-10 py-12 relative">
                    <div className="absolute right-0 top-0 w-1/3 h-full opacity-10 bg-[radial-gradient(circle_at_right,_white,_transparent)]" />
                    
                    <div className="relative flex flex-col md:flex-row items-center gap-6 z-10">
                        {/* Avatar container */}
                        <div className="relative group shrink-0">
                            <img
                                src={userData.avatar}
                                alt={userData.name}
                                className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-2xl"
                            />
                            <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full text-white text-[11px] font-semibold cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                                <span className="material-symbols-outlined mb-1">photo_camera</span>
                                Thay ảnh
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                handleUserChange("avatar", reader.result as string);
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        {/* User basic info */}
                        <div className="flex-grow text-center md:text-left space-y-2 w-full">
                            <input
                                type="text"
                                value={userData.name}
                                onChange={(e) => handleUserChange("name", e.target.value)}
                                className="bg-transparent border-none outline-none text-4xl font-extrabold text-white w-full rounded focus:bg-white/10 px-2 -mx-2 focus:ring-1 focus:ring-violet-300 text-center md:text-left"
                                placeholder="Họ và Tên"
                            />
                            <input
                                type="text"
                                value={resumeData.degree}
                                onChange={(e) => handleResumeChange("degree", e.target.value)}
                                className="bg-transparent border-none outline-none text-lg text-violet-100 font-medium w-full rounded focus:bg-white/10 px-2 -mx-2 focus:ring-1 focus:ring-violet-300 text-center md:text-left"
                                placeholder="Vị trí mong muốn"
                            />
                            
                            {/* Contact Fields with Google Material Icons */}
                            <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-4 text-xs text-violet-100">
                                <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
                                    <span className="material-symbols-outlined text-sm">mail</span>
                                    <input
                                        type="email"
                                        value={userData.email}
                                        onChange={(e) => handleUserChange("email", e.target.value)}
                                        className="bg-transparent border-none outline-none text-white w-36 ml-1 placeholder-violet-200"
                                        placeholder="Email"
                                    />
                                </span>
                                <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
                                    <span className="material-symbols-outlined text-sm">call</span>
                                    <input
                                        type="text"
                                        value={userData.phone}
                                        onChange={(e) => handleUserChange("phone", e.target.value)}
                                        className="bg-transparent border-none outline-none text-white w-28 ml-1 placeholder-violet-200"
                                        placeholder="Số điện thoại"
                                    />
                                </span>
                                <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
                                    <span className="material-symbols-outlined text-sm">location_on</span>
                                    <input
                                        type="text"
                                        value={resumeData.address}
                                        onChange={(e) => handleResumeChange("address", e.target.value)}
                                        className="bg-transparent border-none outline-none text-white w-40 ml-1 placeholder-violet-200"
                                        placeholder="Địa chỉ"
                                    />
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Main Layout ────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] min-h-[850px] border-t border-violet-100">
                    
                    {/* Sidebar / Left Column */}
                    <aside className="bg-violet-50/30 p-8 space-y-8 border-r border-violet-100">
                        {/* Social Links */}
                        <Section title="Mạng xã hội" icon="share">
                            <div className="space-y-2">
                                {resumeData.socialLinks.map((s, i) => (
                                    <div key={i} className="flex items-center gap-1 bg-white p-2 rounded-lg border border-violet-100 relative group/link shadow-sm">
                                        <span className="material-symbols-outlined text-sm text-violet-500">link</span>
                                        <input
                                            type="text"
                                            value={s.platform}
                                            onChange={(e) => handleArrayChange("socialLinks", i, "platform", e.target.value)}
                                            className="bg-transparent border-none outline-none text-xs w-14 font-semibold text-slate-700"
                                            placeholder="Nền tảng"
                                        />
                                        <input
                                            type="text"
                                            value={s.url}
                                            onChange={(e) => handleArrayChange("socialLinks", i, "url", e.target.value)}
                                            className="bg-transparent border-none outline-none text-xs w-24 text-violet-600"
                                            placeholder="Link URL"
                                        />
                                        <button
                                            onClick={() => removeArrayItem("socialLinks", i)}
                                            className="text-red-500 hover:text-red-700 font-bold ml-1 text-xs opacity-0 group-hover/link:opacity-100 transition-opacity print:hidden"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => addArrayItem("socialLinks", { platform: "Social", url: "" })}
                                    className="text-xs text-violet-600 hover:text-violet-800 font-semibold flex items-center gap-1 pt-1 print:hidden"
                                >
                                    <span className="material-symbols-outlined text-xs">add_circle</span>
                                    Thêm mạng xã hội
                                </button>
                            </div>
                        </Section>

                        {/* Languages / Skills */}
                        <Section title="Kỹ năng & Ngôn ngữ" icon="psychology">
                            <textarea
                                value={resumeData.languages}
                                onChange={(e) => handleResumeChange("languages", e.target.value)}
                                className="bg-transparent border-none outline-none text-sm text-slate-600 w-full focus:bg-white rounded p-2 focus:ring-1 focus:ring-violet-300 resize-y border border-transparent focus:border-violet-100"
                                placeholder="Nhập các kỹ năng, chứng chỉ, ngôn ngữ..."
                                rows={6}
                            />
                        </Section>

                        {/* Education */}
                        <Section 
                            title="Học vấn" 
                            icon="school"
                            onAdd={() => addArrayItem("education", { school: "Tên trường", degree: "Bằng cấp", field: "", startYear: "2020", endYear: "", GPA: "", description: "" })}
                        >
                            <div className="space-y-4">
                                {resumeData.education.map((e, i) => (
                                    <div key={i} className="relative group/edu bg-white p-3 rounded-lg border border-violet-100/70 shadow-sm">
                                        <input
                                            type="text"
                                            value={e.school}
                                            onChange={(eVal) => handleArrayChange("education", i, "school", eVal.target.value)}
                                            className="bg-transparent border-none outline-none font-bold text-slate-800 text-xs w-full focus:ring-1 focus:ring-violet-300 rounded"
                                            placeholder="Tên trường"
                                        />
                                        <div className="flex gap-1 text-[10px] text-slate-500 mt-1">
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
                                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                                            <input
                                                type="text"
                                                value={e.startYear}
                                                onChange={(eVal) => handleArrayChange("education", i, "startYear", eVal.target.value)}
                                                className="bg-transparent border-none outline-none w-10"
                                                placeholder="2018"
                                            />
                                            <span>–</span>
                                            <input
                                                type="text"
                                                value={e.endYear || ""}
                                                onChange={(eVal) => handleArrayChange("education", i, "endYear", eVal.target.value)}
                                                className="bg-transparent border-none outline-none w-10"
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
                                            className="absolute right-2 top-2 text-red-400 hover:text-red-600 font-bold opacity-0 group-hover/edu:opacity-100 transition-opacity print:hidden text-[10px]"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    </aside>

                    {/* Content Column / Right */}
                    <main className="p-8 space-y-8 bg-white">
                        {/* Summary */}
                        <Section title="Giới thiệu bản thân" icon="account_circle">
                            <textarea
                                value={resumeData.summary}
                                onChange={(e) => handleResumeChange("summary", e.target.value)}
                                className="bg-transparent border-none outline-none text-sm leading-relaxed text-slate-600 w-full focus:bg-slate-50 rounded p-2 focus:ring-1 focus:ring-violet-300 resize-y border border-transparent focus:border-violet-100"
                                placeholder="Viết giới thiệu bản thân chi tiết..."
                                rows={4}
                            />
                        </Section>

                        {/* Experience */}
                        <Section 
                            title="Kinh nghiệm làm việc" 
                            icon="work"
                            onAdd={() => addArrayItem("experience", { position: "Chức danh", company: "Tên công ty", startYear: "2023", endYear: "", description: "" })}
                        >
                            <div className="space-y-6">
                                {resumeData.experience.map((exp, i) => (
                                    <div key={i} className="relative group/exp border-l-2 border-violet-200 pl-4 py-1 space-y-1">
                                        <div className="flex justify-between items-baseline">
                                            <input
                                                type="text"
                                                value={exp.position}
                                                onChange={(eVal) => handleArrayChange("experience", i, "position", eVal.target.value)}
                                                className="bg-transparent border-none outline-none font-bold text-slate-800 text-sm focus:ring-1 focus:ring-violet-300 rounded"
                                                placeholder="Chức danh"
                                            />
                                            <div className="flex gap-1 text-xs text-slate-400 shrink-0">
                                                <input
                                                    type="text"
                                                    value={exp.startYear}
                                                    onChange={(eVal) => handleArrayChange("experience", i, "startYear", eVal.target.value)}
                                                    className="bg-transparent border-none outline-none w-12 text-right"
                                                    placeholder="Bắt đầu"
                                                />
                                                <span>–</span>
                                                <input
                                                    type="text"
                                                    value={exp.endYear || ""}
                                                    onChange={(eVal) => handleArrayChange("experience", i, "endYear", eVal.target.value)}
                                                    className="bg-transparent border-none outline-none w-12"
                                                    placeholder="nay"
                                                />
                                            </div>
                                        </div>
                                        <input
                                            type="text"
                                            value={exp.company}
                                            onChange={(eVal) => handleArrayChange("experience", i, "company", eVal.target.value)}
                                            className="bg-transparent border-none outline-none text-xs text-violet-600 font-semibold italic focus:ring-1 focus:ring-violet-300 rounded w-full"
                                            placeholder="Tên công ty"
                                        />
                                        <textarea
                                            value={exp.description || ""}
                                            onChange={(eVal) => handleArrayChange("experience", i, "description", eVal.target.value)}
                                            className="bg-transparent border-none outline-none text-xs text-slate-600 w-full focus:bg-slate-50 rounded p-1 focus:ring-1 focus:ring-violet-300 resize-y border border-transparent focus:border-violet-100"
                                            placeholder="Mô tả công việc..."
                                            rows={3}
                                        />
                                        <button
                                            onClick={() => removeArrayItem("experience", i)}
                                            className="absolute right-0 top-0 text-red-500 hover:text-red-700 text-xs font-semibold opacity-0 group-hover/exp:opacity-100 transition-opacity print:hidden"
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </Section>

                        {/* Projects */}
                        <Section 
                            title="Dự án thực tế" 
                            icon="article"
                            onAdd={() => addArrayItem("projects", { name: "Tên dự án", position: "Vai trò", link: "", description: "" })}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {resumeData.projects.map((p, i) => (
                                    <div key={i} className="p-4 bg-indigo-50/30 rounded-xl border border-indigo-100/50 relative group/proj shadow-sm">
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
                                                className="bg-transparent border-none outline-none font-bold text-slate-800 text-sm focus:bg-white rounded px-1 -mx-1 w-5/6 focus:ring-1 focus:ring-violet-300"
                                                placeholder="Tên dự án"
                                            />
                                            <input
                                                type="text"
                                                value={p.link || ""}
                                                onChange={(eVal) => handleArrayChange("projects", i, "link", eVal.target.value)}
                                                className="bg-transparent border-none outline-none text-xs text-violet-600 hover:underline focus:bg-white rounded px-1 -mx-1 focus:ring-1 focus:ring-violet-300"
                                                placeholder="Link dự án"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            value={p.position || ""}
                                            onChange={(eVal) => handleArrayChange("projects", i, "position", eVal.target.value)}
                                            className="bg-transparent border-none outline-none text-xs text-slate-500 mt-1 focus:bg-white rounded px-1 -mx-1 focus:ring-1 focus:ring-violet-300 w-full"
                                            placeholder="Vai trò"
                                        />
                                        <textarea
                                            value={p.description || ""}
                                            onChange={(eVal) => handleArrayChange("projects", i, "description", eVal.target.value)}
                                            className="bg-transparent border-none outline-none mt-2 text-xs text-slate-600 w-full focus:bg-white rounded px-1 -mx-1 resize-y focus:ring-1 focus:ring-violet-300"
                                            placeholder="Mô tả ngắn..."
                                            rows={3}
                                        />
                                    </div>
                                ))}
                            </div>
                        </Section>
                    </main>
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
            <h2 className="mb-4 text-xs font-extrabold uppercase tracking-widest text-slate-400 flex items-center justify-between gap-2 border-b border-violet-100/50 pb-2">
                <span className="flex items-center gap-1.5 text-violet-700">
                    {icon && <span className="material-symbols-outlined text-lg leading-none">{icon}</span>}
                    {title}
                </span>
                {onAdd && (
                    <button
                        onClick={onAdd}
                        className="text-slate-400 hover:text-violet-700 text-xs font-sans flex items-center gap-1 opacity-0 group-hover/section:opacity-100 transition-opacity print:hidden normal-case tracking-normal shrink-0"
                    >
                        <span className="material-symbols-outlined text-xs">add_circle</span>
                        Thêm mới
                    </button>
                )}
            </h2>
            {children}
        </section>
    );
}
