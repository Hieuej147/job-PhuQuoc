// @ts-nocheck
"use client";
import type { TemplateProps, UserData, ResumeData } from "./index";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { downloadResumePdf } from "@/lib/resume-pdf";
import { apiUrl } from "@/lib/api-client";

/**
 * TemplateElegant — Phong cách sang trọng, tối giản, thanh lịch, sử dụng Google Material Symbols
 */
export default function TemplateElegant({ user = {} as Partial<UserData>, resume = {} as Partial<ResumeData>, resumeId, readOnly = false }: TemplateProps) {
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
            const response = await fetch(apiUrl(url), {
                method: method,
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    title: resumeData.title || "CV của tôi",
                    templateId: "tpl-elegant-03", // Placeholder for elegant
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
        <div className="cv-elegant-root min-h-screen bg-stone-50 dark:bg-slate-950 py-8 px-4 print:p-0">
            <style>{`
                @media print {
                    .cv-elegant-root {
                        min-height: auto !important;
                        padding: 0 !important;
                        background: transparent !important;
                    }
                    .cv-elegant-sheet {
                        width: 210mm !important;
                        max-width: 210mm !important;
                        min-height: auto !important;
                        padding: 10mm 12mm !important;
                        border: 0 !important;
                        box-shadow: none !important;
                        overflow: visible !important;
                    }
                    .cv-elegant-header {
                        display: flex !important;
                        flex-direction: row !important;
                        align-items: flex-start !important;
                        text-align: left !important;
                        break-after: avoid !important;
                    }
                    .cv-elegant-header [class~="flex-grow"] {
                        text-align: left !important;
                    }
                    .cv-elegant-header input {
                        text-align: left !important;
                    }
                    .cv-elegant-header [class~="md:justify-start"],
                    .cv-elegant-header .justify-center {
                        justify-content: flex-start !important;
                    }
                    .cv-elegant-main {
                        display: grid !important;
                        grid-template-columns: minmax(0, 1fr) 66mm !important;
                        gap: 8mm !important;
                        padding-top: 8mm !important;
                    }
                    .cv-elegant-sidebar {
                        width: 66mm !important;
                        padding: 6mm !important;
                    }
                    .cv-elegant-section,
                    .cv-elegant-card {
                        break-inside: avoid !important;
                    }
                }
            `}</style>
            {/* Control Panel (Hidden when printing) */}
            {!readOnly && (
                <div className="max-w-4xl mx-auto mb-6 bg-white p-4 rounded-lg shadow-sm border border-stone-200 flex justify-between items-center print:hidden">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Tên CV:</span>
                        <input
                            type="text"
                            value={resumeData.title}
                            onChange={(e) => handleResumeChange("title", e.target.value)}
                            className="bg-stone-50 border border-stone-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500/20 focus:border-stone-500 w-52 font-medium transition text-stone-850"
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
                                className="bg-stone-800 text-white px-4 py-2 rounded text-sm font-medium hover:bg-stone-700 transition"
                            >
                                Xuất PDF
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Resume Sheet */}
            <div className={`cv-elegant-sheet max-w-4xl mx-auto bg-white shadow-xl border border-stone-200 min-h-[1100px] font-sans text-stone-850 p-12 print:shadow-none print:border-none print:my-0 print:p-0 ${readOnly ? 'pointer-events-none select-none' : ''}`}>
                
                {/* ── Top Header Section ───────────────────────────────────── */}
                <header className="cv-elegant-header border-b border-stone-300 pb-8 flex flex-col md:flex-row justify-between items-center md:items-start gap-6">
                    <div className="space-y-3 flex-grow text-center md:text-left">
                        <input
                            type="text"
                            value={userData.name}
                            onChange={(e) => handleUserChange("name", e.target.value)}
                            className="bg-transparent border-none outline-none text-4xl font-light tracking-wide text-stone-900 w-full focus:bg-stone-50 rounded px-2 -mx-2 focus:ring-1 focus:ring-stone-400 text-center md:text-left"
                            placeholder="Họ và Tên"
                        />
                        <input
                            type="text"
                            value={resumeData.degree}
                            onChange={(e) => handleResumeChange("degree", e.target.value)}
                            className="bg-transparent border-none outline-none text-lg text-amber-700 tracking-wider font-semibold uppercase w-full focus:bg-stone-50 rounded px-2 -mx-2 focus:ring-1 focus:ring-stone-400 text-center md:text-left"
                            placeholder="Vị trí mong muốn"
                        />
                        
                        {/* Contact details with Google Icons */}
                        <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 text-xs text-stone-500">
                            <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm text-stone-400">mail</span>
                                <input
                                    type="email"
                                    value={userData.email}
                                    onChange={(e) => handleUserChange("email", e.target.value)}
                                    className="bg-transparent border-none outline-none text-stone-600 w-44 rounded focus:bg-stone-50 px-1 focus:ring-1 focus:ring-stone-400 text-xs"
                                    placeholder="Email"
                                />
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm text-stone-400">call</span>
                                <input
                                    type="text"
                                    value={userData.phone}
                                    onChange={(e) => handleUserChange("phone", e.target.value)}
                                    className="bg-transparent border-none outline-none text-stone-600 w-32 rounded focus:bg-stone-50 px-1 focus:ring-1 focus:ring-stone-400 text-xs"
                                    placeholder="Số điện thoại"
                                />
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm text-stone-400">home_pin</span>
                                <input
                                    type="text"
                                    value={resumeData.address}
                                    onChange={(e) => handleResumeChange("address", e.target.value)}
                                    className="bg-transparent border-none outline-none text-stone-600 w-48 rounded focus:bg-stone-50 px-1 focus:ring-1 focus:ring-stone-400 text-xs"
                                    placeholder="Địa chỉ"
                                />
                            </span>
                        </div>
                    </div>

                    {/* Right-aligned Avatar */}
                    <div className="relative group shrink-0">
                        <img
                            src={userData.avatar}
                            alt={userData.name}
                            className="h-28 w-28 rounded-lg border border-stone-200 object-cover grayscale hover:grayscale-0 transition shadow-sm"
                        />
                        <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-lg text-white text-[10px] font-semibold cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                            <span className="material-symbols-outlined text-sm mb-1">upload_file</span>
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
                </header>

                {/* ── Content Layout ───────────────────────────────────────── */}
                <div className="cv-elegant-main grid grid-cols-1 md:grid-cols-[1fr_260px] gap-8 pt-8">
                    
                    {/* Left Column (Main content) */}
                    <div className="space-y-8">
                        {/* Summary */}
                        <Section title="Hồ sơ tóm tắt" icon="badge">
                            <textarea
                                value={resumeData.summary}
                                onChange={(e) => handleResumeChange("summary", e.target.value)}
                                className="bg-transparent border-none outline-none text-sm leading-relaxed text-stone-600 w-full focus:bg-stone-50 rounded p-1 focus:ring-1 focus:ring-stone-400 resize-y"
                                placeholder="Tóm tắt quá trình làm việc và định hướng nghề nghiệp..."
                                rows={4}
                            />
                        </Section>

                        {/* Experience */}
                        <Section 
                            title="Kinh nghiệm nghề nghiệp" 
                            icon="work_history"
                            onAdd={() => addArrayItem("experience", { position: "Chức danh", company: "Tên công ty", startYear: "2023", endYear: "", description: "" })}
                        >
                            <div className="space-y-6">
                                {resumeData.experience.map((exp, i) => (
                                    <div key={i} className="cv-elegant-card relative group/exp space-y-1">
                                        <div className="flex justify-between items-baseline gap-2">
                                            <input
                                                type="text"
                                                value={exp.position}
                                                onChange={(eVal) => handleArrayChange("experience", i, "position", eVal.target.value)}
                                                className="bg-transparent border-none outline-none font-bold text-stone-850 text-sm focus:ring-1 focus:ring-stone-400 rounded w-1/2"
                                                placeholder="Chức danh"
                                            />
                                            <div className="flex gap-1 text-xs text-stone-400 shrink-0">
                                                <input
                                                    type="text"
                                                    value={exp.startYear}
                                                    onChange={(eVal) => handleArrayChange("experience", i, "startYear", eVal.target.value)}
                                                    className="bg-transparent border-none outline-none w-12 text-right focus:ring-1 focus:ring-stone-400 rounded"
                                                    placeholder="Bắt đầu"
                                                />
                                                <span>–</span>
                                                <input
                                                    type="text"
                                                    value={exp.endYear || ""}
                                                    onChange={(eVal) => handleArrayChange("experience", i, "endYear", eVal.target.value)}
                                                    className="bg-transparent border-none outline-none w-12 focus:ring-1 focus:ring-stone-400 rounded"
                                                    placeholder="nay"
                                                />
                                            </div>
                                        </div>
                                        <input
                                            type="text"
                                            value={exp.company}
                                            onChange={(eVal) => handleArrayChange("experience", i, "company", eVal.target.value)}
                                            className="bg-transparent border-none outline-none text-xs text-amber-800 font-semibold italic focus:ring-1 focus:ring-stone-400 rounded w-full"
                                            placeholder="Tên công ty"
                                        />
                                        <textarea
                                            value={exp.description || ""}
                                            onChange={(eVal) => handleArrayChange("experience", i, "description", eVal.target.value)}
                                            className="bg-transparent border-none outline-none text-xs text-stone-600 w-full focus:bg-stone-50 rounded p-1 focus:ring-1 focus:ring-stone-400 resize-y mt-1"
                                            placeholder="Mô tả công việc và các kết quả đạt được..."
                                            rows={3}
                                        />
                                        <button
                                            onClick={() => removeArrayItem("experience", i)}
                                            className="absolute right-0 top-0 text-red-500 hover:text-red-700 text-xs font-semibold opacity-0 group-hover/exp:opacity-100 transition-opacity print:hidden"
                                        >
                                            ✕ Xóa
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </Section>

                        {/* Projects */}
                        <Section 
                            title="Dự án nổi bật" 
                            icon="assignment"
                            onAdd={() => addArrayItem("projects", { name: "Tên dự án", position: "Vai trò", link: "", description: "" })}
                        >
                            <div className="space-y-4">
                                {resumeData.projects.map((p, i) => (
                                    <div key={i} className="cv-elegant-card relative group/proj border-b border-stone-200 pb-4 last:border-0">
                                        <div className="flex justify-between items-baseline gap-2">
                                            <input
                                                type="text"
                                                value={p.name}
                                                onChange={(eVal) => handleArrayChange("projects", i, "name", eVal.target.value)}
                                                className="bg-transparent border-none outline-none font-semibold text-stone-850 text-sm focus:ring-1 focus:ring-stone-400 rounded w-2/3"
                                                placeholder="Tên dự án"
                                            />
                                            <input
                                                type="text"
                                                value={p.link || ""}
                                                onChange={(eVal) => handleArrayChange("projects", i, "link", eVal.target.value)}
                                                className="bg-transparent border-none outline-none text-xs text-amber-700 underline text-right w-24 focus:ring-1 focus:ring-stone-400 rounded"
                                                placeholder="Link dự án"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            value={p.position || ""}
                                            onChange={(eVal) => handleArrayChange("projects", i, "position", eVal.target.value)}
                                            className="bg-transparent border-none outline-none text-xs text-stone-400 italic focus:ring-1 focus:ring-stone-400 rounded w-full"
                                            placeholder="Vai trò"
                                        />
                                        <textarea
                                            value={p.description || ""}
                                            onChange={(eVal) => handleArrayChange("projects", i, "description", eVal.target.value)}
                                            className="bg-transparent border-none outline-none mt-1.5 text-xs text-stone-600 w-full focus:bg-stone-50 rounded p-1 focus:ring-1 focus:ring-stone-400 resize-y"
                                            placeholder="Mô tả dự án..."
                                            rows={2}
                                        />
                                        <button
                                            onClick={() => removeArrayItem("projects", i)}
                                            className="absolute right-0 top-0 text-red-500 hover:text-red-700 text-xs font-semibold opacity-0 group-hover/proj:opacity-100 transition-opacity print:hidden"
                                        >
                                            ✕ Xóa
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    </div>

                    {/* Right Column (Sidebar content) */}
                    <div className="cv-elegant-sidebar space-y-8 bg-stone-50/50 p-6 rounded-xl border border-stone-200/50">
                        {/* Social */}
                        <Section title="Kết nối" icon="share">
                            <div className="space-y-2">
                                {resumeData.socialLinks.map((s, i) => (
                                    <div key={i} className="cv-elegant-card flex items-center gap-1 border-b border-stone-200/60 pb-1.5 relative group/link">
                                        <input
                                            type="text"
                                            value={s.platform}
                                            onChange={(e) => handleArrayChange("socialLinks", i, "platform", e.target.value)}
                                            className="bg-transparent border-none outline-none text-xs w-16 font-semibold text-stone-700"
                                            placeholder="Mạng xã hội"
                                        />
                                        <input
                                            type="text"
                                            value={s.url}
                                            onChange={(e) => handleArrayChange("socialLinks", i, "url", e.target.value)}
                                            className="bg-transparent border-none outline-none text-[10px] w-28 text-amber-700"
                                            placeholder="Liên kết"
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
                                    className="text-xs text-amber-800 hover:text-amber-950 font-semibold flex items-center gap-1 pt-1 print:hidden"
                                >
                                    <span className="material-symbols-outlined text-xs">add</span>
                                    Thêm liên kết
                                </button>
                            </div>
                        </Section>

                        {/* Languages / Skills */}
                        <Section title="Kỹ năng & Ngôn ngữ" icon="translate">
                            <textarea
                                value={resumeData.languages}
                                onChange={(e) => handleResumeChange("languages", e.target.value)}
                                className="bg-transparent border-none outline-none text-xs text-stone-600 w-full focus:bg-white rounded p-1.5 focus:ring-1 focus:ring-stone-400 resize-y border border-transparent focus:border-stone-200"
                                placeholder="Kỹ năng chuyên môn, ngoại ngữ..."
                                rows={6}
                            />
                        </Section>

                        {/* Education */}
                        <Section 
                            title="Học vấn" 
                            icon="school"
                            onAdd={() => addArrayItem("education", { school: "Trường", degree: "Bằng", field: "", startYear: "2020", endYear: "", GPA: "", description: "" })}
                        >
                            <div className="space-y-4">
                                {resumeData.education.map((e, i) => (
                                    <div key={i} className="cv-elegant-card relative group/edu border-b border-stone-200 pb-3 last:border-0 last:pb-0">
                                        <input
                                            type="text"
                                            value={e.school}
                                            onChange={(eVal) => handleArrayChange("education", i, "school", eVal.target.value)}
                                            className="bg-transparent border-none outline-none font-bold text-stone-850 text-xs w-full focus:ring-1 focus:ring-stone-400 rounded"
                                            placeholder="Trường học"
                                        />
                                        <div className="flex gap-1 text-[10px] text-stone-500 mt-0.5">
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
                                                placeholder="Chuyên ngành"
                                            />
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-stone-400 mt-0.5">
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
        <section className="cv-elegant-section relative group/section">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-stone-400 flex items-center justify-between gap-2 border-b border-stone-200 pb-2">
                <span className="flex items-center gap-1.5 text-stone-800">
                    {icon && <span className="material-symbols-outlined text-lg leading-none text-amber-700">{icon}</span>}
                    {title}
                </span>
                {onAdd && (
                    <button
                        onClick={onAdd}
                        className="text-stone-400 hover:text-amber-800 text-xs font-sans flex items-center gap-0.5 opacity-0 group-hover/section:opacity-100 transition-opacity print:hidden normal-case tracking-normal shrink-0"
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
