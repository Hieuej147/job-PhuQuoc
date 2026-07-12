// @ts-nocheck
"use client";
import type { TemplateProps, UserData, ResumeData } from "./index";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { downloadResumePdf } from "@/lib/resume-pdf";

/**
 * TemplateModern — Phong cách hiện đại, bold, single-column (Form nhập liệu)
 * Accent màu xanh dương đậm, typography sắc nét
 */
export default function TemplateModern({ user = {} as Partial<UserData>, resume = {} as Partial<ResumeData>, resumeId, readOnly = false }: TemplateProps) {
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
                    templateId: "tpl-modern-01",
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
        <div className="cv-modern-root min-h-screen bg-slate-100 dark:bg-slate-950 py-8 px-4 print:p-0">
            <style>{`
                @media print {
                    .cv-modern-root {
                        min-height: auto !important;
                        padding: 0 !important;
                        background: transparent !important;
                    }
                    .cv-modern-sheet {
                        width: 210mm !important;
                        max-width: 210mm !important;
                        min-height: auto !important;
                        border: 0 !important;
                        box-shadow: none !important;
                        overflow: visible !important;
                    }
                    .cv-modern-header {
                        padding: 8mm 10mm !important;
                        break-after: avoid !important;
                    }
                    .cv-modern-header img {
                        width: 24mm !important;
                        height: 24mm !important;
                    }
                    .cv-modern-header input {
                        line-height: 1.15 !important;
                    }
                    .cv-modern-body {
                        max-width: none !important;
                        padding: 7mm 10mm !important;
                        break-before: avoid !important;
                    }
                    .cv-modern-body > * + * {
                        margin-top: 6mm !important;
                    }
                    .cv-modern-body h2 {
                        margin-bottom: 3mm !important;
                    }
                    .cv-modern-two-col,
                    .cv-modern-project-grid {
                        display: grid !important;
                        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                    }
                    .cv-modern-two-col {
                        gap: 6mm !important;
                    }
                    .cv-modern-project-grid {
                        gap: 4mm !important;
                    }
                    .cv-modern-block {
                        break-inside: auto !important;
                    }
                    .cv-modern-card {
                        break-inside: avoid !important;
                    }
                    .cv-modern-card {
                        padding-top: 2mm !important;
                        padding-bottom: 2mm !important;
                    }
                    .cv-modern-card textarea {
                        min-height: 0 !important;
                    }
                }
            `}</style>
            {/* Control Panel (Hidden when printing) */}
            {!readOnly && (
                <div className="max-w-4xl mx-auto mb-6 bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex justify-between items-center print:hidden">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tên CV:</span>
                        <input
                            type="text"
                            value={resumeData.title}
                            onChange={(e) => handleResumeChange("title", e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-52 font-medium transition text-slate-800"
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
                                className="bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-800 transition"
                            >
                                Xuất PDF
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Resume Sheet */}
            <div className={`cv-modern-sheet max-w-4xl mx-auto bg-white shadow-lg border border-slate-200 min-h-[1100px] font-sans text-gray-900 print:shadow-none print:border-none print:my-0 ${readOnly ? 'pointer-events-none select-none' : ''}`}>
                {/* ── Hero Header ────────────────────────────────────────── */}
                <header className="cv-modern-header relative overflow-hidden bg-blue-700 px-12 py-10 text-white">
                    {/* decorative circle */}
                    <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-600 opacity-40 print:hidden" />
                    <div className="absolute -bottom-10 right-32 h-40 w-40 rounded-full bg-blue-500 opacity-30 print:hidden" />

                    <div className="relative flex items-center gap-8">
                        <div className="relative group shrink-0">
                            <img
                                src={userData.avatar}
                                alt={userData.name}
                                className="h-28 w-28 rounded-2xl border-4 border-white/30 object-cover shadow-xl"
                            />
                            <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-2xl text-white text-[11px] font-semibold cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                                📷 Thay ảnh
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
                        <div className="flex-grow space-y-2">
                            <input
                                type="text"
                                value={userData.name}
                                onChange={(e) => handleUserChange("name", e.target.value)}
                                className="bg-transparent border-none outline-none text-4xl font-extrabold tracking-tight leading-none text-white w-full rounded focus:bg-blue-800 px-2 -mx-2 focus:ring-1 focus:ring-blue-300"
                                placeholder="Họ và Tên"
                            />
                            <input
                                type="text"
                                value={resumeData.degree}
                                onChange={(e) => handleResumeChange("degree", e.target.value)}
                                className="bg-transparent border-none outline-none text-blue-200 text-lg font-medium w-full rounded focus:bg-blue-800 px-2 -mx-2 focus:ring-1 focus:ring-blue-300"
                                placeholder="Bằng cấp / Vị trí ứng tuyển"
                            />

                            {/* Contact pills */}
                            <div className="mt-4 flex flex-wrap gap-2 text-xs">
                                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 font-medium">
                                    ✉
                                    <input
                                        type="email"
                                        value={userData.email}
                                        onChange={(e) => handleUserChange("email", e.target.value)}
                                        className="bg-transparent border-none outline-none text-white placeholder-blue-200 w-36 ml-0.5"
                                        placeholder="Email"
                                    />
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 font-medium">
                                    📞
                                    <input
                                        type="text"
                                        value={userData.phone}
                                        onChange={(e) => handleUserChange("phone", e.target.value)}
                                        className="bg-transparent border-none outline-none text-white placeholder-blue-200 w-28 ml-0.5"
                                        placeholder="Số điện thoại"
                                    />
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 font-medium">
                                    📍
                                    <input
                                        type="text"
                                        value={resumeData.address}
                                        onChange={(e) => handleResumeChange("address", e.target.value)}
                                        className="bg-transparent border-none outline-none text-white placeholder-blue-200 w-48 ml-0.5"
                                        placeholder="Địa chỉ"
                                    />
                                </span>
                            </div>

                            {/* Social Links */}
                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                {resumeData.socialLinks.map((s, i) => (
                                    <div key={i} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 font-medium relative group/link">
                                        🔗
                                        <input
                                            type="text"
                                            value={s.platform}
                                            onChange={(e) => handleArrayChange("socialLinks", i, "platform", e.target.value)}
                                            className="bg-transparent border-none outline-none text-white w-14 font-semibold ml-0.5"
                                            placeholder="GitHub"
                                        />
                                        <input
                                            type="text"
                                            value={s.url}
                                            onChange={(e) => handleArrayChange("socialLinks", i, "url", e.target.value)}
                                            className="bg-transparent border-none outline-none text-blue-200 w-24 ml-0.5"
                                            placeholder="URL"
                                        />
                                        <button
                                            onClick={() => removeArrayItem("socialLinks", i)}
                                            className="text-red-300 hover:text-red-500 font-bold ml-1 opacity-0 group-hover/link:opacity-100 transition-opacity print:hidden"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => addArrayItem("socialLinks", { platform: "Social", url: "" })}
                                    className="inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/20 hover:bg-white/10 transition px-3 py-1 text-white text-xs print:hidden"
                                >
                                    + Thêm mạng xã hội
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* ── Content ────────────────────────────────────────────── */}
                <div className="cv-modern-body mx-auto max-w-4xl px-12 py-10 space-y-10">
                    {/* Summary */}
                    <Block title="Về tôi" accent>
                        <textarea
                            value={resumeData.summary}
                            onChange={(e) => handleResumeChange("summary", e.target.value)}
                            className="bg-transparent border-none outline-none text-sm leading-relaxed text-gray-600 w-full focus:bg-slate-50 rounded px-1 -mx-1 focus:ring-1 focus:ring-blue-500 resize-y"
                            placeholder="Nhập phần tóm tắt nghề nghiệp..."
                            rows={3}
                        />
                    </Block>

                    {/* Experience */}
                    <Block
                        title="Kinh nghiệm"
                        onAdd={() => addArrayItem("experience", { position: "Chức vụ", company: "Công ty", startYear: "2023", endYear: "", description: "" })}
                    >
                        <div className="space-y-6">
                            {resumeData.experience.map((exp, i) => (
                                <div key={i} className="cv-modern-card flex gap-4 relative group/item border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
                                    <div className="flex flex-col items-center pt-1 shrink-0">
                                        <div className="h-3 w-3 rounded-full bg-blue-600" />
                                        <div className="flex-1 w-px bg-blue-100 mt-1" />
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex flex-wrap justify-between items-baseline gap-2">
                                            <input
                                                type="text"
                                                value={exp.position}
                                                onChange={(eVal) => handleArrayChange("experience", i, "position", eVal.target.value)}
                                                className="bg-transparent border-none outline-none font-bold text-gray-800 text-sm focus:bg-slate-50 rounded px-1 -mx-1 focus:ring-1 focus:ring-blue-500 w-1/2"
                                                placeholder="Chức danh"
                                            />
                                            <div className="flex gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-slate-100">
                                                <input
                                                    type="text"
                                                    value={exp.startYear}
                                                    onChange={(eVal) => handleArrayChange("experience", i, "startYear", eVal.target.value)}
                                                    className="bg-transparent border-none outline-none w-14 text-right"
                                                    placeholder="Bắt đầu"
                                                />
                                                <span>–</span>
                                                <input
                                                    type="text"
                                                    value={exp.endYear || ""}
                                                    onChange={(eVal) => handleArrayChange("experience", i, "endYear", eVal.target.value)}
                                                    className="bg-transparent border-none outline-none w-14"
                                                    placeholder="nay"
                                                />
                                            </div>
                                        </div>
                                        <input
                                            type="text"
                                            value={exp.company}
                                            onChange={(eVal) => handleArrayChange("experience", i, "company", eVal.target.value)}
                                            className="bg-transparent border-none outline-none text-xs text-blue-600 italic font-semibold mt-0.5 focus:bg-slate-50 rounded px-1 -mx-1 focus:ring-1 focus:ring-blue-500 w-64"
                                            placeholder="Tên công ty"
                                        />
                                        <textarea
                                            value={exp.description || ""}
                                            onChange={(eVal) => handleArrayChange("experience", i, "description", eVal.target.value)}
                                            className="bg-transparent border-none outline-none mt-2 text-sm text-gray-600 w-full focus:bg-slate-50 rounded px-1 -mx-1 focus:ring-1 focus:ring-blue-500 resize-y"
                                            placeholder="Mô tả chi tiết..."
                                            rows={3}
                                        />
                                    </div>
                                    <button
                                        onClick={() => removeArrayItem("experience", i)}
                                        className="absolute right-0 top-0 text-red-500 hover:text-red-700 text-xs font-semibold opacity-0 group-hover/item:opacity-100 transition-opacity print:hidden"
                                    >
                                        Xóa
                                    </button>
                                </div>
                            ))}
                        </div>
                    </Block>

                    {/* Two-col: Education + Skills */}
                    <div className="cv-modern-two-col grid grid-cols-2 gap-8">
                        <Block
                            title="Học vấn"
                            onAdd={() => addArrayItem("education", { school: "Trường", degree: "Bằng cấp", field: "", startYear: "2020", endYear: "", GPA: "", description: "" })}
                        >
                            <div className="space-y-6">
                                {resumeData.education.map((e, i) => (
                                    <div key={i} className="cv-modern-card relative group/edu border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
                                        <input
                                            type="text"
                                            value={e.school}
                                            onChange={(eVal) => handleArrayChange("education", i, "school", eVal.target.value)}
                                            className="bg-transparent border-none outline-none font-bold text-gray-800 text-sm focus:bg-slate-50 rounded px-1 -mx-1 focus:ring-1 focus:ring-blue-500 w-full"
                                            placeholder="Tên trường học"
                                        />
                                        <div className="flex gap-1 mt-0.5 text-xs text-gray-500">
                                            <input
                                                type="text"
                                                value={e.degree}
                                                onChange={(eVal) => handleArrayChange("education", i, "degree", eVal.target.value)}
                                                className="bg-transparent border-none outline-none focus:bg-slate-50 rounded px-1 -mx-1 w-1/2"
                                                placeholder="Bằng cấp"
                                            />
                                            <input
                                                type="text"
                                                value={e.field}
                                                onChange={(eVal) => handleArrayChange("education", i, "field", eVal.target.value)}
                                                className="bg-transparent border-none outline-none focus:bg-slate-50 rounded px-1 -mx-1 w-1/2"
                                                placeholder="Ngành"
                                            />
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                                            <input
                                                type="text"
                                                value={e.startYear}
                                                onChange={(eVal) => handleArrayChange("education", i, "startYear", eVal.target.value)}
                                                className="bg-transparent border-none outline-none w-12"
                                                placeholder="2018"
                                            />
                                            <span>–</span>
                                            <input
                                                type="text"
                                                value={e.endYear || ""}
                                                onChange={(eVal) => handleArrayChange("education", i, "endYear", eVal.target.value)}
                                                className="bg-transparent border-none outline-none w-12"
                                                placeholder="2022"
                                            />
                                            <span className="ml-1">· GPA:</span>
                                            <input
                                                type="text"
                                                value={e.GPA || ""}
                                                onChange={(eVal) => handleArrayChange("education", i, "GPA", eVal.target.value)}
                                                className="bg-transparent border-none outline-none w-12"
                                                placeholder="3.5"
                                            />
                                        </div>
                                        <textarea
                                            value={e.description || ""}
                                            onChange={(eVal) => handleArrayChange("education", i, "description", eVal.target.value)}
                                            className="bg-transparent border-none outline-none text-xs text-gray-600 w-full focus:bg-slate-50 rounded px-1 -mx-1 mt-1 resize-y"
                                            placeholder="Chi tiết học vấn..."
                                            rows={2}
                                        />
                                        <button
                                            onClick={() => removeArrayItem("education", i)}
                                            className="absolute right-0 top-0 text-red-500 hover:text-red-700 text-[10px] font-semibold opacity-0 group-hover/edu:opacity-100 transition-opacity print:hidden"
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </Block>

                        <Block title="Ngôn ngữ & kỹ năng">
                            <textarea
                                value={resumeData.languages}
                                onChange={(e) => handleResumeChange("languages", e.target.value)}
                                className="bg-transparent border-none outline-none text-sm text-gray-600 w-full focus:bg-slate-50 rounded px-1 -mx-1 focus:ring-1 focus:ring-blue-500 resize-y"
                                placeholder="Nhập ngôn ngữ và kỹ năng..."
                                rows={8}
                            />
                        </Block>
                    </div>

                    {/* Projects */}
                    <Block
                        title="Dự án nổi bật"
                        onAdd={() => addArrayItem("projects", { name: "Tên dự án", position: "Vai trò", link: "", description: "" })}
                    >
                        <div className="cv-modern-project-grid grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {resumeData.projects.map((p, i) => (
                                <div
                                    key={i}
                                    className="cv-modern-card rounded-xl border border-blue-100 bg-blue-50/50 p-4 hover:shadow-md transition relative group/proj"
                                >
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
                                            className="bg-transparent border-none outline-none font-bold text-blue-800 text-sm focus:bg-white rounded px-1 -mx-1 w-5/6"
                                            placeholder="Tên dự án"
                                        />
                                        <input
                                            type="text"
                                            value={p.link || ""}
                                            onChange={(eVal) => handleArrayChange("projects", i, "link", eVal.target.value)}
                                            className="bg-transparent border-none outline-none text-xs text-blue-500 underline focus:bg-white rounded px-1 -mx-1"
                                            placeholder="Link dự án"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        value={p.position || ""}
                                        onChange={(eVal) => handleArrayChange("projects", i, "position", eVal.target.value)}
                                        className="bg-transparent border-none outline-none text-xs text-blue-600 mt-1 focus:bg-white rounded px-1 -mx-1 w-full"
                                        placeholder="Vai trò"
                                    />
                                    <textarea
                                        value={p.description || ""}
                                        onChange={(eVal) => handleArrayChange("projects", i, "description", eVal.target.value)}
                                        className="bg-transparent border-none outline-none mt-2 text-xs text-gray-600 w-full focus:bg-white rounded px-1 -mx-1 resize-y"
                                        placeholder="Mô tả dự án..."
                                        rows={3}
                                    />
                                </div>
                            ))}
                        </div>
                    </Block>
                </div>
            </div>
            {showSaveToast && (
                <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-bounce print:hidden">
                    <span>✓</span>
                    <span>Đã cập nhật bản xem trước trong phiên làm việc!</span>
                </div>
            )}
        </div>
    );
}

/* ── Reusable block component ──────────────────────────────── */
function Block({ title, children, accent = false, onAdd }) {
    return (
        <section className="cv-modern-block relative group/section">
            <h2
                className={`mb-4 text-xs font-extrabold uppercase tracking-widest ${accent ? "text-blue-700" : "text-gray-400"
                    } flex items-center justify-between gap-2`}
            >
                <span className="flex items-center gap-2 flex-grow">
                    {accent && <span className="h-3 w-1 rounded-full bg-blue-600 inline-block" />}
                    {title}
                    {!accent && <span className="flex-1 border-t border-gray-200 ml-2" />}
                </span>
                {onAdd && (
                    <button
                        onClick={onAdd}
                        className="text-gray-400 hover:text-blue-700 text-xs font-sans flex items-center gap-1 opacity-0 group-hover/section:opacity-100 transition-opacity print:hidden normal-case tracking-normal shrink-0"
                    >
                        ➕ Thêm mới
                    </button>
                )}
            </h2>
            {children}
        </section>
    );
}
