"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Mail, Send, Loader2, XCircle } from "lucide-react";
import { useRenderTool, useHumanInTheLoop } from "@copilotkit/react-core/v2";
import { z } from "zod";
import { sendEmailViaGmail } from "@/features/employer-email/api";

function parseResult(result: unknown) {
    try {
        return typeof result === "string" ? JSON.parse(result) : result;
    } catch {
        return null;
    }
}

export function CreateJobResultCard({ data }: { data: any }) {
    if (data?.error || data?.success === false) {
        return (
            <div className="my-3 rounded-xl border bg-destructive/10 p-4 text-sm text-destructive">
                Không thể tạo tin tuyển dụng: {data?.error || "Đã có lỗi xảy ra."}
            </div>
        );
    }

    const cardContent = (
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-accent/50">
            <div className="mt-0.5 rounded-full bg-emerald-500/10 p-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground">Đã tạo tin tuyển dụng</p>
                {data?.title && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{data.title}</p>
                )}
                {data?.status && (
                    <span className="mt-1 inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {data.status === "DRAFT" ? "Bản nháp — chưa công khai" : data.status}
                    </span>
                )}
            </div>
            {data?.job_id && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
        </div>
    );

    if (data?.job_id) {
        return (
            <Link href={`/employer/jobs/${data.job_id}/edit`} className="block cursor-pointer">
                {cardContent}
            </Link>
        );
    }
    return cardContent;
}

/**
 * Preview nội dung draft_email — CHỈ hiển thị, không gửi gì. HTML do chính
 * draft_email.py sinh ra (mọi input người dùng đã được escape ở backend), nên
 * an toàn để render trong iframe sandbox không chạy script, giống cách CV
 * preview đang làm trong dự án.
 */
function DraftEmailPreviewCard({ data }: { data: any }) {
    if (!data?.subject || !data?.body) return <></>;

    return (
        <div className="my-3 overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5">
                <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <p className="min-w-0 flex-1 truncate text-xs font-medium text-muted-foreground">
                    Bản nháp — {data.subject}
                </p>
            </div>
            <iframe
                title="Xem trước email"
                srcDoc={data.body}
                sandbox=""
                style={{ width: "100%", height: 360, border: "none", display: "block" }}
            />
        </div>
    );
}

interface SendEmailArgs {
    to_email?: string;
    subject?: string;
    body?: string;
}

/**
 * Card xác nhận CỨNG trước khi gửi email thật — đây là hàng rào bảo vệ THẬT
 * SỰ (nút bấm React, không phải lời nhắc trong prompt). LangGraph (FastAPI)
 * không hỗ trợ interrupt() graph-paused, nên "send_email" được đăng ký hoàn
 * toàn ở đây như 1 frontend tool qua useHumanInTheLoop — LLM chỉ có thể "đề
 * nghị" gọi tool này, nhưng Gmail API THẬT chỉ được gọi bên trong onClick của
 * nút "Xác nhận gửi" dưới đây, dùng cookie session thật của trình duyệt (qua
 * sendEmailViaGmail), không qua Python Agent nữa.
 */
function SendEmailConfirmCard({
    args,
    respond,
}: {
    args: SendEmailArgs;
    respond?: (result: unknown) => void;
}) {
    const [sending, setSending] = useState(false);
    const [answered, setAnswered] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const toEmail = args?.to_email ?? "";
    const subject = args?.subject ?? "";
    const body = args?.body ?? "";

    const handleConfirm = async () => {
        setSending(true);
        setError(null);
        try {
            const result = await sendEmailViaGmail(toEmail, subject, body);
            setAnswered(true);
            respond?.({ success: true, messageId: result.messageId, to: toEmail });
        } catch (e) {
            const message = e instanceof Error ? e.message : "Gửi email thất bại. Vui lòng thử lại.";
            setError(message);
            setSending(false);
        }
    };

    const handleCancel = () => {
        setAnswered(true);
        respond?.({ success: false, cancelled: true });
    };

    if (answered) {
        return (
            <div className="my-3 flex items-center gap-2 rounded-xl border bg-card p-4 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                Đã ghi nhận lựa chọn của bạn.
            </div>
        );
    }

    return (
        <div className="my-3 overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b bg-amber-500/10 px-4 py-2.5">
                <Mail className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                    Xác nhận gửi email tới {toEmail || "ứng viên"}
                </p>
            </div>

            <iframe
                title="Xem trước email trước khi gửi"
                srcDoc={body}
                sandbox=""
                style={{ width: "100%", height: 320, border: "none", display: "block" }}
            />

            {error && (
                <div className="mx-4 mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {error}
                </div>
            )}

            <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
                <button
                    type="button"
                    onClick={handleCancel}
                    disabled={sending}
                    className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50"
                >
                    <XCircle className="h-3.5 w-3.5" />
                    Hủy
                </button>
                <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={sending || !toEmail}
                    className="flex items-center gap-1.5 rounded-full bg-[#005a71] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#00475a] disabled:opacity-50"
                >
                    {sending ? (
                        <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Đang gửi...
                        </>
                    ) : (
                        <>
                            <Send className="h-3.5 w-3.5" />
                            Xác nhận gửi
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

export function useJobToolsRenderer() {
    useRenderTool({
        name: "create_job",
        parameters: z.object({
            title: z.string(),
            description: z.string(),
            category_id: z.string(),
            type: z.string(),
            experience: z.string().optional(),
            level: z.string().optional(),
            salary_min: z.number().optional(),
            salary_max: z.number().optional(),
            requirements: z.string().optional(),
            benefits: z.string().optional(),
            quantity: z.number().optional(),
        }),
        render: ({ status, result }) => {
            if (status === "inProgress") return <></>;
            if (status === "complete" && result) {
                const data = parseResult(result);
                if (!data) return <></>;
                return <CreateJobResultCard data={data} />;
            }
            return <></>;
        },
    });

    useRenderTool({
        name: "draft_email",
        parameters: z.object({
            recipient_name: z.string(),
            email_type: z.string(),
            job_title: z.string(),
            company_name: z.string(),
            additional_info: z.string().optional(),
            interview_datetime: z.string().optional(),
            interview_location: z.string().optional(),
        }),
        render: ({ status, result }) => {
            if (status === "inProgress") return <></>;
            if (status === "complete" && result) {
                const data = parseResult(result);
                if (!data) return <></>;
                return <DraftEmailPreviewCard data={data} />;
            }
            return <></>;
        },
    });

    // send_email KHÔNG có backend node — đây là frontend tool "thật", đăng ký
    // trực tiếp với agent qua useHumanInTheLoop. agentId phải khớp đúng tên
    // agent đã đăng ký trong main.py (name="recruiter_agent").
    // agentId PHẢI khớp đúng key trong CopilotRuntime({ agents: {...} }) ở
    // route.ts ("recruiter"), KHÔNG phải name nội bộ của LangGraph agent
    // ("recruiter_agent" trong main.py) — 2 giá trị này khác nhau. Dùng sai
    // giá trị khiến send_email không bao giờ được đăng ký với đúng phiên
    // agent đang chạy, LLM không "thấy" tool này tồn tại.
    useHumanInTheLoop({
        agentId: "recruiter",
        name: "send_email",
        description:
            "Gửi THẬT email tới ứng viên qua Gmail của nhà tuyển dụng đang đăng nhập. Chỉ gọi " +
            "sau khi đã dùng draft_email để soạn nội dung. Giao diện sẽ luôn hiện thẻ xác nhận " +
            "thật (nút bấm) trước khi gửi — không cần hỏi lại bằng lời trước khi gọi tool này.",
        parameters: z.object({
            to_email: z.string().describe("Email người nhận, lấy từ kết quả get_candidates"),
            subject: z.string().describe("Tiêu đề email — lấy nguyên văn từ kết quả draft_email"),
            body: z.string().describe("Nội dung email (HTML) — lấy nguyên văn từ kết quả draft_email"),
        }),
        render: ({ args, respond }: any) => (
            <SendEmailConfirmCard args={args as SendEmailArgs} respond={respond} />
        ),
    });
}