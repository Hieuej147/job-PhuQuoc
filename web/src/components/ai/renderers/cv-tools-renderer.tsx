"use client";

import { useRenderTool } from "@copilotkit/react-core/v2";
import { z } from "zod";
import { CheckCircle2, FileText, Pencil, ChevronRight } from "lucide-react";
import Link from "next/link";

export function SaveCvResultCard({ data }: { data: any }) {
    if (data?.error) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                Không thể lưu CV: {data.error}
            </div>
        );
    }

    const isUpdate = data?.action === "updated";
    const cardContent = (
        <div className="flex items-center gap-3 rounded-xl border border-[#e1efff] bg-white p-4 shadow-sm transition-colors hover:border-[#005a71]/40 hover:bg-[#f5fbfd] dark:border-[#1E5F74] dark:bg-[#0d2d42] dark:hover:bg-[#0d2d42]/70">
            <div className="mt-0.5 rounded-full bg-emerald-50 p-1.5 dark:bg-emerald-900/40">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
                <p className="font-medium text-slate-900 dark:text-white">
                    {isUpdate ? "Đã cập nhật CV" : "Đã tạo CV mới"}
                </p>
                {data?.title && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">{data.title}</p>
                )}
            </div>
            {data?.id && <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />}
        </div>
    );

    if (data?.id) {
        return (
            <Link href={`/candidate/resumes/${data.id}`} className="block cursor-pointer">
                {cardContent}
            </Link>
        );
    }
    return cardContent;
}

export function CvListCard({ data }: { data: any }) {
    const cvs = data?.cvs || [];

    if (data?.error) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {data.error}
            </div>
        );
    }

    if (cvs.length === 0) {
        return (
            <div className="rounded-xl border border-[#e1efff] bg-white p-4 text-sm text-slate-500 dark:border-[#1E5F74] dark:bg-[#0d2d42] dark:text-slate-400">
                Bạn chưa có CV nào được lưu.
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {cvs.map((cv: any) => (
                <Link
                    key={cv.id}
                    href={`/candidate/resumes/${cv.id}`}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#e1efff] bg-white p-3 shadow-sm transition-colors hover:border-[#005a71]/40 hover:bg-[#f5fbfd] dark:border-[#1E5F74] dark:bg-[#0d2d42] dark:hover:bg-[#0d2d42]/70"
                >
                    <div className="rounded-full bg-blue-50 p-1.5 dark:bg-blue-900/40">
                        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white">{cv.title || "CV chưa đặt tên"}</p>
                        {cv.isDefault && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400">CV mặc định</p>
                        )}
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                </Link>
            ))}
        </div>
    );
}

export function CvDetailCard({ data }: { data: any }) {
    if (data?.error) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {data.error}
            </div>
        );
    }

    const resume = data?.resume;
    if (!resume) return <></>;

    const cardContent = (
        <div className="flex items-center gap-3 rounded-xl border border-[#e1efff] bg-white p-4 shadow-sm transition-colors hover:border-[#005a71]/40 hover:bg-[#f5fbfd] dark:border-[#1E5F74] dark:bg-[#0d2d42] dark:hover:bg-[#0d2d42]/70">
            <div className="mt-0.5 rounded-full bg-amber-50 p-1.5 dark:bg-amber-900/40">
                <Pencil className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
                <p className="font-medium text-slate-900 dark:text-white">{resume.title || "CV"}</p>
                {resume.summary && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{resume.summary}</p>
                )}
            </div>
            {resume?.id && <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />}
        </div>
    );

    if (resume?.id) {
        return (
            <Link href={`/candidate/resumes/${resume.id}`} className="block cursor-pointer">
                {cardContent}
            </Link>
        );
    }
    return cardContent;
}

function parseResult(result: unknown) {
    try {
        return typeof result === "string" ? JSON.parse(result) : result;
    } catch {
        return null;
    }
}

export function useCvToolsRenderer() {
    useRenderTool({
        name: "save_cv",
        parameters: z.object({
            resume_id: z.string().optional(),
            title: z.string().optional(),
            name: z.string().optional(),
            email: z.string().optional(),
            phone: z.string().optional(),
            summary: z.string().optional(),
            skills: z.string().optional(),
            languages: z.string().optional(),
            style_preference: z.string().optional(),
            replace_lists: z.boolean().optional(),
        }),
        render: ({ status, result }) => {
            if (status === "inProgress") return <></>;
            if (status === "complete" && result) {
                const data = parseResult(result);
                if (!data) return <></>;
                return <SaveCvResultCard data={data} />;
            }
            return <></>;
        },
    });

    useRenderTool({
        name: "list_my_cvs",
        parameters: z.object({}),
        render: ({ status, result }) => {
            if (status === "inProgress") return <></>;
            if (status === "complete" && result) {
                const data = parseResult(result);
                if (!data) return <></>;
                return <CvListCard data={data} />;
            }
            return <></>;
        },
    });

    useRenderTool({
        name: "get_cv_detail",
        parameters: z.object({
            resume_id: z.string().optional(),
            title_hint: z.string().optional(),
        }),
        render: ({ status, result }) => {
            if (status === "inProgress") return <></>;
            if (status === "complete" && result) {
                const data = parseResult(result);
                if (!data) return <></>;
                return <CvDetailCard data={data} />;
            }
            return <></>;
        },
    });
}