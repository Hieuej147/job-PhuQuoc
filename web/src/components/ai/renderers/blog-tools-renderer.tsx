"use client";

import Link from "next/link";
import { CheckCircle2, ChevronRight, FileEdit } from "lucide-react";
import { useRenderTool } from "@copilotkit/react-core/v2";
import { z } from "zod";

function parseResult(result: unknown) {
    try {
        return typeof result === "string" ? JSON.parse(result) : result;
    } catch {
        return null;
    }
}

export function CreateBlogPostResultCard({ data }: { data: any }) {
    if (data?.error || data?.success === false) {
        return (
            <div className="my-3 rounded-xl border bg-destructive/10 p-4 text-sm text-destructive">
                Không thể tạo bài viết: {data?.error || "Đã có lỗi xảy ra."}
            </div>
        );
    }

    // Chỉ cho click mở link công khai /blog/{slug} khi bài ĐÃ ĐĂNG — trang
    // public chỉ trả bài đã publish (isPublished=true), bấm vào link này với
    // bài còn nháp sẽ ra trang "không tìm thấy". Chưa có route "sửa bài" xác
    // nhận cho trường hợp nháp, nên khi đó chỉ hiện badge, không làm link vỡ.
    const isPublished = Boolean(data?.is_published);
    const canOpen = isPublished && Boolean(data?.slug);

    const cardContent = (
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-accent/50">
            <div className="mt-0.5 rounded-full bg-emerald-500/10 p-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground">Đã tạo bài viết</p>
                {data?.title && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{data.title}</p>
                )}
                <span
                    className={`mt-1 inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${isPublished
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-primary/10 text-primary"
                        }`}
                >
                    {isPublished ? "Đã đăng công khai" : "Bản nháp — chưa công khai"}
                </span>
                {!canOpen && (
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                        Xem và chỉnh sửa tại trang "Bài viết của tôi".
                    </p>
                )}
            </div>
            {canOpen && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
            {!canOpen && <FileEdit className="h-4 w-4 shrink-0 text-muted-foreground" />}
        </div>
    );

    if (canOpen) {
        return (
            <Link href={`/blog/${data.slug}`} target="_blank" className="block cursor-pointer">
                {cardContent}
            </Link>
        );
    }
    return cardContent;
}

/**
 * Renderer DÙNG CHUNG cho tool create_blog_post — tool này được đăng ký ở CẢ
 * CandidateAgent lẫn RecruiterAgent (xem tools/shared/create_blog_post.py),
 * nên hook này phải được gọi ở CẢ 4 nơi hiển thị chat AI trong app:
 * global-ai-chat-widget.tsx (CandidateSidebarBody + RecruiterSidebarBody) và
 * dashboard-ai-tab.tsx (CandidateDashboardAiTab + EmployerDashboardAiTab).
 * Thiếu bất kỳ nơi nào sẽ khiến create_blog_post ở khu vực đó rơi về
 * accordion "Done" mặc định thay vì card đẹp.
 */
export function useBlogPostRenderer() {
    useRenderTool({
        name: "create_blog_post",
        parameters: z.object({
            title: z.string(),
            sections: z.array(
                z.object({
                    type: z.enum(["heading2", "heading3", "paragraph", "bullet_list", "ordered_list"]),
                    text: z.string().optional(),
                    items: z.array(z.string()).optional(),
                }),
            ),
            excerpt: z.string().optional(),
            category_id: z.string().optional(),
            is_published: z.boolean().optional(),
        }),
        render: ({ status, result }) => {
            if (status === "inProgress") return <></>;
            if (status === "complete" && result) {
                const data = parseResult(result);
                if (!data) return <></>;
                return <CreateBlogPostResultCard data={data} />;
            }
            return <></>;
        },
    });
}