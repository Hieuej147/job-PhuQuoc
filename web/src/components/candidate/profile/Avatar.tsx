import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Camera, Pencil, Upload, User } from "lucide-react";

export default function Avatar({ activeSection, avatar, uploadingAvatar, handleAvatarChange, editing, setEditing }: { activeSection: string, avatar: string, uploadingAvatar: boolean, handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void, editing: boolean, setEditing: (editing: boolean) => void }) {
    return (
        <>
            {activeSection === "avatar" && (
                <div className="space-y-4">
                    <h3 className="text-base font-bold flex items-center gap-2 border-b pb-2 text-slate-900 dark:text-[#E0F2FE]">
                        <Camera className="size-5 text-[#005a71]" />
                        Ảnh đại diện
                        {!editing && <button onClick={() => setEditing(true)} className="ml-auto text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1 font-medium"><Pencil className="size-3" /> Sửa</button>}
                    </h3>
                    <div className="flex flex-col items-center justify-center p-6 space-y-4">
                        <div className="relative size-32 rounded-full overflow-hidden border-2 border-cyan-500 shadow-lg bg-slate-100 flex items-center justify-center">
                            {avatar ? (
                                <img src={avatar} alt="Avatar" className="size-full object-cover" />
                            ) : (
                                <User className="size-16 text-slate-400" />
                            )}
                            {uploadingAvatar && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <Spinner size="sm" className="text-white" />
                                </div>
                            )}
                        </div>

                        {editing && (
                            <>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        disabled={uploadingAvatar}
                                    />
                                    <Button type="button" variant="outline" size="sm" disabled={uploadingAvatar}>
                                        <Upload className="size-4 mr-1.5" />
                                        {uploadingAvatar ? "Đang tải ảnh..." : "Chọn ảnh từ máy tính"}
                                    </Button>
                                </div>
                                <p className="text-[10px] text-muted-foreground">Chấp nhận JPG, PNG, WEBP. Tối đa 5MB.</p>
                            </>
                        )}
                        {!editing && !avatar && <p className="text-xs text-muted-foreground italic">Chưa có ảnh đại diện</p>}
                    </div>
                </div>
            )}
        </>
    );
}