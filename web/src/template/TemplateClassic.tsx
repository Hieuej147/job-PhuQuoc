// @ts-nocheck
"use client";
import type { TemplateProps, UserData, ResumeData } from "./index";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { downloadResumePdf } from "@/lib/resume-pdf";
import { apiUrl } from "@/lib/api-client";

/**
 * TemplateClassic — Phong cách thanh lịch, truyền thống và sang trọng
 * Layout: Cân đối, sử dụng font chữ Serif cổ điển, đường viền phân cách kép tinh tế.
 */
export default function TemplateClassic({ user = {} as Partial<UserData>, resume = {} as Partial<ResumeData>, resumeId, readOnly = false }: TemplateProps) {
    const router = useRouter();
    const [userData, setUserData] = useState({
        name: user.name || "Họ và Tên",
        email: user.email || "email@example.com",
        phone: user.phone || "090 1234 567",
        avatar: user.avatar || "https://i.pravatar.cc/150?img=12",
    });

    const [resumeData, setResumeData] = useState({
        title: resume.title || "CV của tôi",
        address: resume.address || "Dương Đông, Phú Quốc",
        summary: resume.summary || "Bản tóm tắt nghề nghiệp ấn tượng giới thiệu năng lực bản thân...",
        degree: resume.degree || "Cử nhân / Kỹ sư",
        languages: resume.languages || "Tiếng Anh, Tiếng Việt",
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
                    templateId: "tpl-classic-02",
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
        <div className="cv-classic-root min-h-screen bg-stone-50 dark:bg-slate-950 py-8 px-4 print:bg-white print:p-0">
            <style>{`
                @media print {
                    .cv-classic-root {
                        min-height: auto !important;
                        padding: 0 !important;
                        background: transparent !important;
                    }
                    .cv-classic-sheet {
                        width: 210mm !important;
                        max-width: 210mm !important;
                        min-height: auto !important;
                        padding: 10mm 12mm !important;
                        border: 0 !important;
                        box-shadow: none !important;
                        overflow: visible !important;
                    }
                    .cv-classic-header {
                        break-after: avoid !important;
                    }
                    .cv-classic-body {
                        padding-top: 8mm !important;
                    }
                    .cv-classic-project-grid {
                        display: grid !important;
                        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                    }
                    .cv-classic-block,
                    .cv-classic-card {
                        break-inside: avoid !important;
                    }
                }
            `}</style>
            {/* Control Panel */}
            {!readOnly && (
                <div className="max-w-4xl mx-auto mb-6 bg-white p-4 rounded-xl shadow-sm border border-stone-200 flex justify-between items-center print:hidden">
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
                            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
                        >
                            Lưu thay đổi
                        </button>
                        {resumeId && (
                            <button
                                onClick={() => downloadResumePdf(resumeId, resumeData.title)}
                                className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-700 transition"
                            >
                                Xuất PDF
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Resume Page */}
            <div className={`cv-classic-sheet max-w-4xl mx-auto bg-white shadow-2xl border border-stone-200 min-h-[29.7cm] p-12 font-serif text-stone-800 relative print:shadow-none print:border-none print:p-0 print:my-0 ${readOnly ? 'pointer-events-none select-none' : ''}`}>
                {/* Header */}
                <header className="cv-classic-header text-center space-y-4 pb-6 border-b-2 border-stone-800">
                    <div className="relative inline-block group">
                        <img
                            src={userData.avatar}
                            alt={userData.name}
                            className="h-24 w-24 rounded-full border-2 border-stone-300 object-cover mx-auto"
                        />
                        <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full text-white text-[10px] font-semibold cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
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

                    <div className="space-y-1">
                        <input
                            type="text"
                            value={userData.name}
                            onChange={(e) => handleUserChange("name", e.target.value)}
                            className="bg-transparent text-center border-b border-transparent hover:border-stone-300 focus:border-stone-800 outline-none text-3xl font-extrabold tracking-wide text-stone-900 w-full px-2 transition-colors uppercase"
                            placeholder="Họ và Tên"
                        />
                        <input
                            type="text"
                            value={resumeData.degree}
                            onChange={(e) => handleResumeChange("degree", e.target.value)}
                            className="bg-transparent text-center border-b border-transparent hover:border-stone-300 focus:border-stone-800 outline-none text-base text-stone-500 italic w-full px-2 transition-colors"
                            placeholder="Vị trí ứng tuyển / Bằng cấp"
                        />
                    </div>

                    {/* Contact details */}
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-1.5 text-xs font-sans text-stone-600">
                        <span className="flex items-center gap-1.5">
                            ✉️
                            <input
                                type="email"
                                value={userData.email}
                                onChange={(e) => handleUserChange("email", e.target.value)}
                                className="bg-transparent border-b border-transparent hover:border-stone-300 focus:border-stone-800 outline-none w-44 text-stone-600 transition-colors"
                                placeholder="Email"
                            />
                        </span>
                        <span className="flex items-center gap-1.5">
                            📞
                            <input
                                type="text"
                                value={userData.phone}
                                onChange={(e) => handleUserChange("phone", e.target.value)}
                                className="bg-transparent border-b border-transparent hover:border-stone-300 focus:border-stone-800 outline-none w-32 text-stone-600 transition-colors"
                                placeholder="Điện thoại"
                            />
                        </span>
                        <span className="flex items-center gap-1.5">
                            📍
                            <input
                                type="text"
                                value={resumeData.address}
                                onChange={(e) => handleResumeChange("address", e.target.value)}
                                className="bg-transparent border-b border-transparent hover:border-stone-300 focus:border-stone-800 outline-none w-52 text-stone-600 transition-colors"
                                placeholder="Địa chỉ"
                            />
                        </span>
                    </div>

                    {/* Social links */}
                    <div className="flex flex-wrap justify-center gap-3 text-xs font-sans">
                        {resumeData.socialLinks.map((s, i) => (
                            <div key={i} className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200/70 px-2.5 py-1 rounded border border-stone-200/50 relative group/link">
                                🔗
                                <input
                                    type="text"
                                    value={s.platform}
                                    onChange={(e) => handleArrayChange("socialLinks", i, "platform", e.target.value)}
                                    className="bg-transparent border-none outline-none text-stone-700 text-xs w-16 font-bold"
                                    placeholder="Github"
                                />
                                <input
                                    type="text"
                                    value={s.url}
                                    onChange={(e) => handleArrayChange("socialLinks", i, "url", e.target.value)}
                                    className="bg-transparent border-none outline-none text-stone-500 text-xs w-28"
                                    placeholder="Link"
                                />
                                <button
                                    onClick={() => removeArrayItem("socialLinks", i)}
                                    className="text-stone-400 hover:text-red-600 font-sans text-xs ml-1 opacity-0 group-hover/link:opacity-100 transition-opacity print:hidden"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={() => addArrayItem("socialLinks", { platform: "Mạng xã hội", url: "" })}
                            className="text-stone-500 hover:text-stone-800 text-xs underline font-sans flex items-center gap-1 print:hidden"
                        >
                            + Thêm liên kết
                        </button>
                    </div>
                </header>

                {/* Body Content */}
                <div className="cv-classic-body space-y-8 pt-8">
                    {/* Summary */}
                    <Block title="Tóm tắt nghề nghiệp" accent>
                        <textarea
                            value={resumeData.summary}
                            onChange={(e) => handleResumeChange("summary", e.target.value)}
                            className="bg-transparent border-none outline-none text-sm leading-relaxed text-stone-700 w-full focus:bg-stone-50 rounded p-2 resize-none"
                            placeholder="Nhập giới thiệu bản thân..."
                            rows={3}
                        />
                    </Block>

                    {/* Experience */}
                    <Block
                        title="Kinh nghiệm làm việc"
                        onAdd={() => addArrayItem("experience", { position: "Chức vụ", company: "Tên công ty", startYear: "2022", endYear: "Hiện tại", description: "Mô tả công việc và thành tựu..." })}
                    >
                        <div className="space-y-6">
                            {resumeData.experience.map((exp, i) => (
                                <div key={i} className="cv-classic-card relative group/item border-l-2 border-stone-200 pl-4 space-y-2">
                                    <button
                                        onClick={() => removeArrayItem("experience", i)}
                                        className="absolute right-0 top-0 text-red-500 hover:text-red-700 text-xs font-semibold opacity-0 group-hover/item:opacity-100 transition-opacity print:hidden"
                                    >
                                        Gỡ bỏ
                                    </button>
                                    <div className="flex flex-wrap justify-between items-baseline gap-2">
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                value={exp.company}
                                                onChange={(eVal) => handleArrayChange("experience", i, "company", eVal.target.value)}
                                                className="bg-transparent border-b border-transparent hover:border-stone-300 focus:border-stone-800 outline-none font-bold text-stone-900 text-sm w-44"
                                                placeholder="Công ty"
                                            />
                                            <span className="text-stone-400">|</span>
                                            <input
                                                type="text"
                                                value={exp.position}
                                                onChange={(eVal) => handleArrayChange("experience", i, "position", eVal.target.value)}
                                                className="bg-transparent border-b border-transparent hover:border-stone-300 focus:border-stone-800 outline-none font-semibold text-stone-600 text-xs w-48"
                                                placeholder="Vị trí"
                                            />
                                        </div>
                                        <div className="flex gap-1 text-xs text-stone-400 bg-stone-50 px-2.5 py-1 rounded border border-stone-200/50">
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
                                    <textarea
                                        value={exp.description}
                                        onChange={(eVal) => handleArrayChange("experience", i, "description", eVal.target.value)}
                                        className="bg-transparent border-none outline-none text-xs text-stone-600 w-full focus:bg-stone-50 rounded p-2 resize-none"
                                        placeholder="Mô tả công việc cụ thể..."
                                        rows={3}
                                    />
                                </div>
                            ))}
                        </div>
                    </Block>

                    {/* Projects */}
                    <Block
                        title="Dự án thực tế"
                        onAdd={() => addArrayItem("projects", { name: "Tên dự án", position: "Vai trò", link: "", description: "Mô tả dự án..." })}
                    >
                        <div className="cv-classic-project-grid grid grid-cols-1 md:grid-cols-2 gap-6">
                            {resumeData.projects.map((proj, i) => (
                                <div key={i} className="cv-classic-card bg-stone-50/50 p-4 rounded-xl border border-stone-200/60 relative group/proj hover:shadow-sm transition-all duration-200">
                                    <button
                                        onClick={() => removeArrayItem("projects", i)}
                                        className="absolute top-3 right-3 text-red-500 hover:text-red-700 text-xs font-semibold opacity-0 group-hover/proj:opacity-100 transition-opacity print:hidden"
                                    >
                                        ✕
                                    </button>
                                    <div className="space-y-2">
                                        <div className="space-y-0.5">
                                            <input
                                                type="text"
                                                value={proj.name}
                                                onChange={(eVal) => handleArrayChange("projects", i, "name", eVal.target.value)}
                                                className="bg-transparent border-b border-transparent hover:border-stone-300 focus:border-stone-800 outline-none font-bold text-stone-900 text-sm w-full"
                                                placeholder="Dự án"
                                            />
                                            <input
                                                type="text"
                                                value={proj.position}
                                                onChange={(eVal) => handleArrayChange("projects", i, "position", eVal.target.value)}
                                                className="bg-transparent border-b border-transparent hover:border-stone-300 focus:border-stone-800 outline-none text-stone-600 text-xs w-full"
                                                placeholder="Vai trò"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            value={proj.link || ""}
                                            onChange={(eVal) => handleArrayChange("projects", i, "link", eVal.target.value)}
                                            className="bg-transparent border-b border-transparent hover:border-stone-300 focus:border-stone-800 outline-none text-blue-600 text-[11px] underline w-full"
                                            placeholder="Đường dẫn (URL)"
                                        />
                                        <textarea
                                            value={proj.description}
                                            onChange={(eVal) => handleArrayChange("projects", i, "description", eVal.target.value)}
                                            className="bg-transparent border-none outline-none text-xs text-stone-600 w-full focus:bg-white rounded p-1 resize-none"
                                            placeholder="Mô tả dự án..."
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Block>

                    {/* Education */}
                    <Block
                        title="Học vấn & Bằng cấp"
                        onAdd={() => addArrayItem("education", { school: "Trường đại học", degree: "Cử nhân", field: "Ngành học", startYear: "2018", endYear: "2022", GPA: "" })}
                    >
                        <div className="space-y-4">
                            {resumeData.education.map((edu, i) => (
                                <div key={i} className="cv-classic-card relative group/edu flex justify-between items-start gap-4">
                                    <div className="space-y-1 flex-1">
                                        <input
                                            type="text"
                                            value={edu.school}
                                            onChange={(eVal) => handleArrayChange("education", i, "school", eVal.target.value)}
                                            className="bg-transparent border-b border-transparent hover:border-stone-300 focus:border-stone-800 outline-none font-bold text-stone-900 text-sm w-full"
                                            placeholder="Trường học"
                                        />
                                        <div className="flex gap-2 text-xs text-stone-600">
                                            <input
                                                type="text"
                                                value={edu.degree}
                                                onChange={(eVal) => handleArrayChange("education", i, "degree", eVal.target.value)}
                                                className="bg-transparent border-b border-transparent hover:border-stone-300 focus:border-stone-800 outline-none w-20"
                                                placeholder="Bằng cấp"
                                            />
                                            <span>-</span>
                                            <input
                                                type="text"
                                                value={edu.field}
                                                onChange={(eVal) => handleArrayChange("education", i, "field", eVal.target.value)}
                                                className="bg-transparent border-b border-transparent hover:border-stone-300 focus:border-stone-800 outline-none w-44"
                                                placeholder="Chuyên ngành"
                                            />
                                            {edu.GPA && (
                                                <span className="flex items-center gap-1">
                                                    (GPA: 
                                                    <input
                                                        type="text"
                                                        value={edu.GPA}
                                                        onChange={(eVal) => handleArrayChange("education", i, "GPA", eVal.target.value)}
                                                        className="bg-transparent border-b border-transparent hover:border-stone-300 focus:border-stone-800 outline-none w-10 text-center"
                                                        placeholder="4.0"
                                                    />)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <div className="flex gap-1 text-xs text-stone-500 font-semibold">
                                            <input
                                                type="text"
                                                value={edu.startYear}
                                                onChange={(eVal) => handleArrayChange("education", i, "startYear", eVal.target.value)}
                                                className="bg-transparent border-none outline-none w-12 text-right"
                                                placeholder="2018"
                                            />
                                            <span>–</span>
                                            <input
                                                type="text"
                                                value={edu.endYear}
                                                onChange={(eVal) => handleArrayChange("education", i, "endYear", eVal.target.value)}
                                                className="bg-transparent border-none outline-none w-12"
                                                placeholder="2022"
                                            />
                                        </div>
                                        <button
                                            onClick={() => removeArrayItem("education", i)}
                                            className="text-red-500 hover:text-red-700 text-xs font-semibold opacity-0 group-hover/edu:opacity-100 transition-opacity print:hidden"
                                        >
                                            Gỡ bỏ
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Block>

                    {/* Skills */}
                    <Block title="Kỹ năng & Ngôn ngữ">
                        <textarea
                            value={resumeData.languages}
                            onChange={(e) => handleResumeChange("languages", e.target.value)}
                            className="bg-transparent border-none outline-none text-sm text-stone-700 w-full focus:bg-stone-50 rounded p-2 resize-none"
                            placeholder="Liệt kê các kỹ năng chính và ngoại ngữ..."
                            rows={3}
                        />
                    </Block>
                </div>
            </div>

            {showSaveToast && (
                <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-bounce print:hidden">
                    <span>✓</span>
                    <span>Đã cập nhật bản xem trước!</span>
                </div>
            )}
        </div>
    );
}

/* Reusable block component */
function Block({ title, children, accent = false, onAdd }) {
    return (
        <section className="cv-classic-block relative group/section space-y-3">
            <h2 className="text-xs font-black uppercase tracking-widest text-stone-900 border-b-2 border-stone-800 pb-1 flex justify-between items-center">
                <span>{title}</span>
                {onAdd && (
                    <button
                        onClick={onAdd}
                        className="text-stone-500 hover:text-stone-900 text-[10px] font-sans flex items-center gap-1 opacity-0 group-hover/section:opacity-100 transition-opacity print:hidden normal-case tracking-normal shrink-0"
                    >
                        ➕ Thêm mới
                    </button>
                )}
            </h2>
            {children}
        </section>
    );
}
