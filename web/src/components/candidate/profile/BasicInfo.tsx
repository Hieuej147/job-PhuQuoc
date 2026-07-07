import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { User, Award, Languages, MapPin, Pencil, Save } from "lucide-react";

export default function BasicInfo({
    activeSection,
    editing,
    setEditing,
    handleSave,
    name,
    phone,
    email,
    address,
    degree,
    languages,
    skills,
    saving,
    setName,
    setPhone,
    setAddress,
    setDegree,
    setLanguages,
    setSkills
}: {
    activeSection: string;
    editing: boolean;
    setEditing: (editing: boolean) => void;
    handleSave: () => Promise<boolean>;
    name: string;
    phone: string;
    email: string;
    address: string;
    degree: string;
    languages: string;
    skills: string;
    saving: boolean;
    setName: (name: string) => void;
    setPhone: (phone: string) => void;
    setAddress: (address: string) => void;
    setDegree: (degree: string) => void;
    setLanguages: (languages: string) => void;
    setSkills: (skills: string) => void;
}) {
    return (
        <>
            {activeSection === "basic" && (
                <div className="space-y-4">
                    <h3 className="text-base font-bold flex items-center gap-2 border-b pb-2 text-slate-900 dark:text-[#E0F2FE]">
                        <User className="size-5 text-[#005a71]" />
                        Thông tin cơ bản
                        {!editing && <button onClick={() => setEditing(true)} className="ml-auto text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1 font-medium"><Pencil className="size-3" /> Sửa</button>}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Họ và tên</label>
                            {editing ? <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyen Van A" /> : <p className="text-sm text-slate-800 dark:text-slate-200 py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-md min-h-[36px]">{name || <span className="text-muted-foreground italic">Chưa cập nhật</span>}</p>}
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Số điện thoại</label>
                            {editing ? <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0912345678" /> : <p className="text-sm text-slate-800 dark:text-slate-200 py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-md min-h-[36px]">{phone || <span className="text-muted-foreground italic">Chưa cập nhật</span>}</p>}
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Email liên hệ</label>
                            <p className="text-sm text-slate-800 dark:text-slate-200 py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-md min-h-[36px] opacity-60">{email}</p>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Địa chỉ</label>
                            {editing ? (
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input value={address} onChange={(e) => setAddress(e.target.value)} className="pl-10" placeholder="Phú Quốc, Kiên Giang" />
                                </div>
                            ) : <p className="text-sm text-slate-800 dark:text-slate-200 py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-md min-h-[36px]">{address || <span className="text-muted-foreground italic">Chưa cập nhật</span>}</p>}
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Học vị / Học hàm</label>
                            {editing ? (
                                <div className="relative">
                                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input value={degree} onChange={(e) => setDegree(e.target.value)} className="pl-10" placeholder="Cử nhân CNTT" />
                                </div>
                            ) : <p className="text-sm text-slate-800 dark:text-slate-200 py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-md min-h-[36px]">{degree || <span className="text-muted-foreground italic">Chưa cập nhật</span>}</p>}
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Ngôn ngữ</label>
                            {editing ? (
                                <div className="relative">
                                    <Languages className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input value={languages} onChange={(e) => setLanguages(e.target.value)} className="pl-10" placeholder="Tiếng Việt, Tiếng Anh" />
                                </div>
                            ) : <p className="text-sm text-slate-800 dark:text-slate-200 py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-md min-h-[36px]">{languages || <span className="text-muted-foreground italic">Chưa cập nhật</span>}</p>}
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Kỹ năng (phân cách bằng dấu phẩy)</label>
                            {editing ? <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Node.js, Next.js, Prisma" /> : <p className="text-sm text-slate-800 dark:text-slate-200 py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-md min-h-[36px]">{skills || <span className="text-muted-foreground italic">Chưa cập nhật</span>}</p>}
                        </div>
                    </div>
                    {editing && (
                        <div className="flex justify-end pt-4 border-t mt-4">
                            <Button onClick={async () => { const ok = await handleSave(); if (ok) setEditing(false); }} disabled={saving} size="sm">
                                <Save className="size-4 mr-1.5" />
                                {saving ? "Đang lưu..." : "Lưu thông tin cơ bản"}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}