import { Briefcase, Pencil, Trash2, Plus, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface ExperienceItem {
    company: string;
    position: string;
    startYear: string;
    endYear: string;
    description: string;
}

export default function Experience({
    activeSection,
    editing,
    setEditing,
    experiences,
    newExp,
    setNewExp,
    addExperience,
    removeExperience,
    handleSave,
    saving
}: {
    activeSection: string;
    editing: boolean;
    setEditing: (editing: boolean) => void;
    experiences: ExperienceItem[];
    newExp: ExperienceItem;
    setNewExp: (newExp: any) => void;
    addExperience: () => void;
    removeExperience: (index: number) => void;
    handleSave: () => Promise<boolean>;
    saving: boolean;
}) {
    return (
        <>
            {activeSection === "experience" && (
                <div className="space-y-6">
                    <h3 className="text-base font-bold flex items-center gap-2 border-b pb-2 text-slate-900 dark:text-[#E0F2FE]">
                        <Briefcase className="size-5 text-[#005a71]" />
                        Kinh nghiệm làm việc
                        {!editing && <button onClick={() => setEditing(true)} className="ml-auto text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1 font-medium"><Pencil className="size-3" /> Sửa</button>}
                    </h3>

                    {/* List of existing experiences */}
                    <div className="space-y-3">
                        {experiences.map((exp, index) => (
                            <div key={index} className="flex justify-between items-start p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-800/30">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-900 dark:text-[#E0F2FE]">{exp.position}</p>
                                    <p className="text-xs font-medium text-cyan-600 dark:text-cyan-400">{exp.company}</p>
                                    <p className="text-[10px] text-muted-foreground">{exp.startYear} – {exp.endYear || "Hiện tại"}</p>
                                    {exp.description && <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1 whitespace-pre-wrap">{exp.description}</p>}
                                </div>
                                {editing && (
                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 size-8" onClick={() => removeExperience(index)}>
                                        <Trash2 className="size-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        {experiences.length === 0 && (
                            <p className="text-xs text-center text-muted-foreground py-6">Chưa có kinh nghiệm nào được ghi nhận.</p>
                        )}
                    </div>

                    {/* Add new experience form - only in editing mode */}
                    {editing && (
                        <>
                            <div className="p-4 rounded-xl border border-dashed space-y-3">
                                <p className="text-xs font-bold text-[#005a71] dark:text-[#67E8F9]">+ Thêm kinh nghiệm mới</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Tên công ty *</label>
                                        <Input value={newExp.company} onChange={(e) => setNewExp({ ...newExp, company: e.target.value })} placeholder="FPT Software" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Chức danh / Vị trí *</label>
                                        <Input value={newExp.position} onChange={(e) => setNewExp({ ...newExp, position: e.target.value })} placeholder="Frontend Engineer" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Năm bắt đầu *</label>
                                        <Input value={newExp.startYear} onChange={(e) => setNewExp({ ...newExp, startYear: e.target.value })} placeholder="2021" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Năm kết thúc *</label>
                                        <Input value={newExp.endYear} onChange={(e) => setNewExp({ ...newExp, endYear: e.target.value })} placeholder="2023" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Mô tả công việc *</label>
                                        <Textarea value={newExp.description} onChange={(e) => setNewExp({ ...newExp, description: e.target.value })} placeholder="Xây dựng giao diện web, tối ưu hóa CSS..." rows={3} />
                                    </div>
                                </div>
                                <Button type="button" size="sm" onClick={addExperience}>
                                    <Plus className="size-4 mr-1" /> Thêm vào danh sách
                                </Button>
                            </div>
                            <div className="flex justify-end pt-4 border-t mt-4">
                                <Button onClick={async () => { const ok = await handleSave(); if (ok) setEditing(false); }} disabled={saving} size="sm">
                                    <Save className="size-4 mr-1.5" />
                                    {saving ? "Đang lưu..." : "Lưu kinh nghiệm làm việc"}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
}