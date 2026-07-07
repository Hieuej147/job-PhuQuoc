import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle } from "lucide-react";


export default function Checklist({ activeSection, checklist, handleSectionChange, completionPct }: { activeSection: string, checklist: { id: string, label: string, done: boolean }[], handleSectionChange: (section: string) => void, completionPct: number }) {
    return (
        <Card className="lg:col-span-1 border-[#e1efff] dark:border-[#1E5F74]/50 dark:bg-[#0d2d42] bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,90,113,0.06)] h-fit">
            <CardHeader>
                <CardTitle className="text-base font-bold">Hoàn thiện hồ sơ</CardTitle>
                <CardDescription className="text-xs">Đạt 100% để hiển thị hồ sơ cá nhân đầy đủ và chuyên nghiệp nhất.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500 dark:text-[#94A3B8] text-xs">Tổng thể</span>
                        <span className="font-bold text-[#005a71] dark:text-[#67E8F9]">{completionPct}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#e1efff] dark:bg-[#1E5F74]">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#005a71] to-[#0e7490] transition-all duration-500" style={{ width: `${completionPct}%` }} />
                    </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                    {checklist.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleSectionChange(item.id)}
                            className={`flex items-center gap-3 w-full text-left p-2 rounded-xl transition border ${activeSection === item.id
                                ? "border-[#005a71]/30 bg-[#005a71]/5 dark:bg-[#67E8F9]/10 text-slate-900 dark:text-cyan-400 font-semibold"
                                : "border-transparent text-gray-500 dark:text-[#94A3B8] hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                }`}
                        >
                            {item.done ? (
                                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                    <CheckCircle2 className="size-3.5 text-green-600" />
                                </div>
                            ) : (
                                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-[#1E5F74]/30">
                                    <Circle className="size-3.5 text-gray-400" />
                                </div>
                            )}
                            <span className="text-xs truncate flex-1">{item.label}</span>
                        </button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}