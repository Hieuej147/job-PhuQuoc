import { GraduationCap, Pencil, Trash2, Plus, Save } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";

interface EducationProps {
    activeSection: string;
    editing: boolean;
    setEditing: (editing: boolean) => void;
    educations: any[];
    removeEducation: (index: number) => void;
    newEdu: any;
    setNewEdu: (newEdu: any) => void;
    addEducation: () => void;
    handleSave: () => Promise<boolean>;
    saving: boolean;
}
export default function Education({ activeSection, editing, setEditing, educations, removeEducation, newEdu, setNewEdu, addEducation, handleSave, saving }: EducationProps) {
    return (
        <>
            {activeSection === "education" && (
                <div className="space-y-6">
                    <h3 className="text-base font-bold flex items-center gap-2 border-b pb-2 text-slate-900 dark:text-[#E0F2FE]">
                        <GraduationCap className="size-5 text-[#005a71]" />
                        Học vấn & bằng cấp
                        {!editing && <button onClick={() => setEditing(true)} className="ml-auto text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1 font-medium"><Pencil className="size-3" /> Sửa</button>}
                    </h3>

                    {/* List of existing educations */}
                    <div className="space-y-3">
                        {educations.map((edu, index) => (
                            <div key={index} className="flex justify-between items-start p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-800/30">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-900 dark:text-[#E0F2FE]">{edu.school}</p>
                                    <p className="text-xs font-medium text-cyan-600 dark:text-cyan-400">{edu.degree} – {edu.field}</p>
                                    <p className="text-[10px] text-muted-foreground">{edu.startYear} – {edu.endYear || "Hiện tại"}</p>
                                </div>
                                {editing && (
                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 size-8" onClick={() => removeEducation(index)}>
                                        <Trash2 className="size-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        {educations.length === 0 && (
                            <p className="text-xs text-center text-muted-foreground py-6">Chưa có học vấn nào được ghi nhận.</p>
                        )}
                    </div>

                    {/* Add new education form - only in editing mode */}
                    {editing && (
                        <>
                            <div className="p-4 rounded-xl border border-dashed space-y-3">
                                <p className="text-xs font-bold text-[#005a71] dark:text-[#67E8F9]">+ Thêm học vấn mới</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Tên trường *</label>
                                        <Input value={newEdu.school} onChange={(e) => setNewEdu({ ...newEdu, school: e.target.value })} placeholder="Đại học Công nghệ thông tin" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Bằng cấp *</label>
                                        <Input value={newEdu.degree} onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })} placeholder="Cử nhân" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Ngành học / Chuyên ngành *</label>
                                        <Input value={newEdu.field} onChange={(e) => setNewEdu({ ...newEdu, field: e.target.value })} placeholder="Kỹ thuật phần mềm" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Năm bắt đầu *</label>
                                        <Input value={newEdu.startYear} onChange={(e) => setNewEdu({ ...newEdu, startYear: e.target.value })} placeholder="2018" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Năm kết thúc *</label>
                                        <Input value={newEdu.endYear} onChange={(e) => setNewEdu({ ...newEdu, endYear: e.target.value })} placeholder="2022" />
                                    </div>
                                </div>
                                <Button type="button" size="sm" onClick={addEducation}>
                                    <Plus className="size-4 mr-1" /> Thêm vào danh sách
                                </Button>
                            </div>
                            <div className="flex justify-end pt-4 border-t mt-4">
                                <Button onClick={async () => { const ok = await handleSave(); if (ok) setEditing(false); }} disabled={saving} size="sm">
                                    <Save className="size-4 mr-1.5" />
                                    {saving ? "Đang lưu..." : "Lưu học vấn & bằng cấp"}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            )}

        </>
    )
}