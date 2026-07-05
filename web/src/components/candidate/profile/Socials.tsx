import { Share2, Pencil, Save } from "lucide-react";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";

export default function Socials({
    activeSection,
    editing,
    setEditing,
    facebook,
    setFacebook,
    linkedin,
    setLinkedin,
    github,
    setGithub,
    website,
    setWebsite,
    handleSave,
    saving
}: {
    activeSection: string;
    editing: boolean;
    setEditing: (editing: boolean) => void;
    facebook: string;
    setFacebook: (facebook: string) => void;
    linkedin: string;
    setLinkedin: (linkedin: string) => void;
    github: string;
    setGithub: (github: string) => void;
    website: string;
    setWebsite: (website: string) => void;
    handleSave: () => Promise<boolean>;
    saving: boolean;
}) {
    return (
        <>
            {activeSection === "socials" && (
                <div className="space-y-4">
                    <h3 className="text-base font-bold flex items-center gap-2 border-b pb-2 text-slate-900 dark:text-[#E0F2FE]">
                        <Share2 className="size-5 text-[#005a71]" />
                        Liên kết mạng xã hội
                        {!editing && <button onClick={() => setEditing(true)} className="ml-auto text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1 font-medium"><Pencil className="size-3" /> Sửa</button>}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Facebook</label>
                            {editing ? <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/user" /> : <p className="text-sm text-slate-800 dark:text-slate-200 py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-md min-h-[36px] truncate">{facebook || <span className="text-muted-foreground italic">Chưa cập nhật</span>}</p>}
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">LinkedIn</label>
                            {editing ? <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/user" /> : <p className="text-sm text-slate-800 dark:text-slate-200 py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-md min-h-[36px] truncate">{linkedin || <span className="text-muted-foreground italic">Chưa cập nhật</span>}</p>}
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">GitHub</label>
                            {editing ? <Input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/user" /> : <p className="text-sm text-slate-800 dark:text-slate-200 py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-md min-h-[36px] truncate">{github || <span className="text-muted-foreground italic">Chưa cập nhật</span>}</p>}
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Website cá nhân / Blog</label>
                            {editing ? <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://mywebsite.com" /> : <p className="text-sm text-slate-800 dark:text-slate-200 py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-md min-h-[36px] truncate">{website || <span className="text-muted-foreground italic">Chưa cập nhật</span>}</p>}
                        </div>
                    </div>
                    {editing && (
                        <div className="flex justify-end pt-4 border-t mt-4">
                            <Button onClick={async () => { const ok = await handleSave(); if (ok) setEditing(false); }} disabled={saving} size="sm">
                                <Save className="size-4 mr-1.5" />
                                {saving ? "Đang lưu..." : "Lưu liên kết mạng xã hội"}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}