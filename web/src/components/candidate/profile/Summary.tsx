import { FileText, Pencil, Save } from "lucide-react";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";

export default function Summary({
    activeSection,
    summary,
    setSummary,
    editing,
    setEditing,
    handleSave,
    saving
}: {
    activeSection: string;
    summary: string;
    setSummary: (summary: string) => void;
    editing: boolean;
    setEditing: (editing: boolean) => void;
    handleSave: () => Promise<boolean>;
    saving: boolean;
}) {
    return (
        <>
            {activeSection === "summary" && (
                <div className="space-y-4">
                    <h3 className="text-base font-bold flex items-center gap-2 border-b pb-2 text-slate-900 dark:text-[#E0F2FE]">
                        <FileText className="size-5 text-[#005a71]" />
                        Tóm tắt bản thân
                        {!editing && <button onClick={() => setEditing(true)} className="ml-auto text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1 font-medium"><Pencil className="size-3" /> Sửa</button>}
                    </h3>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Tóm tắt nghề nghiệp (giới thiệu bản thân và mục tiêu)</label>
                        {editing ? (
                            <Textarea
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                placeholder="Tôi là một Frontend Developer có 2 năm kinh nghiệm thiết kế UI/UX..."
                                rows={8}
                            />
                        ) : (
                            <div className="text-sm text-slate-800 dark:text-slate-200 py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-md min-h-[100px] whitespace-pre-wrap">
                                {summary || <span className="text-muted-foreground italic">Chưa cập nhật</span>}
                            </div>
                        )}
                    </div>
                    {editing && (
                        <div className="flex justify-end pt-4 border-t mt-4">
                            <Button onClick={async () => { const ok = await handleSave(); if (ok) setEditing(false); }} disabled={saving} size="sm">
                                <Save className="size-4 mr-1.5" />
                                {saving ? "Đang lưu..." : "Lưu tóm tắt bản thân"}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}