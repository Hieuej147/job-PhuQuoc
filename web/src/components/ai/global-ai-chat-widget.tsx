"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CopilotChat, useAgent, useConfigureSuggestions } from "@copilotkit/react-core/v2";
import { Sparkles, X, Maximize2, Plus, History, ArrowLeft, MessageSquare, Trash2 } from "lucide-react";
import { createAgentProgressMessageView } from "@/components/ai/agent-progress-chat-message";
import { useJobSearchRenderer } from "@/components/ai/renderers/job-search-renderer";
import { useCvToolsRenderer } from "@/components/ai/renderers/cv-tools-renderer";
import { useTemplateRenderer } from "@/hooks/use-template-renderer";
import { useChatThreads } from "@/features/ai-chat/use-chat-threads";
import { type ChatAgentType, type ChatThread } from "@/features/ai-chat/api";
import { useAuth } from "@/components/auth/auth-provider";
import { timeAgo } from "@/lib/utils/date";

// Giống PRINT_ROUTE_PATTERNS trong HeaderGate.tsx — cố tình lặp lại ở đây thay vì
// import chung, để không đụng vào file HeaderGate hiện có.
const HIDDEN_ROUTE_PATTERNS = [
    /^\/resumes\/[^/]+\/print$/,
    /^\/applications\/[^/]+\/resume\/print$/,
];

type WidgetAgentId = "candidate" | "recruiter";
type WidgetView = "chat" | "threads";

// Dùng chung 1 giá trị cho cả bề rộng sidebar lẫn margin-right của nội dung trang,
// để 2 bên luôn khớp nhau tuyệt đối (giống split-view của Claude.ai). min() để không
// tràn trên màn hình hẹp.
const SIDEBAR_WIDTH_CSS = "min(440px, 92vw)";

const AGENT_ID_TO_TYPE: Record<WidgetAgentId, ChatAgentType> = {
    candidate: "CANDIDATE",
    recruiter: "RECRUITER",
};

// Trang dashboard tương ứng đã có sẵn tab "AI Co-worker" full-page — ẩn sidebar ở
// đúng route này (bất kể đang ở tab nào) để tránh 2 khung chat trùng nhau.
// Cố tình chỉ so khớp theo pathname (không dùng useSearchParams) vì component này
// mount ở root layout cho MỌI trang; dùng useSearchParams ở đây sẽ ép các trang
// public/SEO (jobs, blog, about...) phải cần Suspense boundary / mất static rendering.
const FULL_PAGE_AI_ROUTE: Record<WidgetAgentId, string> = {
    candidate: "/candidate/dashboard",
    recruiter: "/employer/dashboard",
};

const AGENT_META: Record<
    WidgetAgentId,
    { title: string; welcome: string; fullPageHref: string }
> = {
    candidate: {
        title: "Career Co-worker",
        welcome:
            "Xin chào! Mình là Career Co-worker — hỏi mình về việc làm, CV hay hồ sơ ứng tuyển bất cứ lúc nào nhé.",
        fullPageHref: "/candidate/dashboard?tab=ai",
    },
    recruiter: {
        title: "Recruiter Co-worker",
        welcome:
            "Xin chào! Mình có thể hỗ trợ bạn xem ứng viên, tạo tin tuyển dụng hoặc soạn email nhanh.",
        fullPageHref: "/employer/dashboard?tab=ai",
    },
};

// Gợi ý tin nhắn dạng chip hiện ở màn hình chào (trước khi có tin nhắn nào) —
// giúp người dùng biết agent làm được gì mà không cần tự gõ từ đầu.
const AGENT_SUGGESTIONS: Record<WidgetAgentId, { title: string; message: string }[]> = {
    candidate: [
        {
            title: "Tìm việc phù hợp",
            message: "Giúp tôi tìm việc làm phù hợp với kỹ năng và kinh nghiệm của tôi.",
        },
        {
            title: "Tạo CV mới",
            message: "Tôi muốn tạo một CV mới, bạn hướng dẫn tôi nhé.",
        },
        {
            title: "Xem CV của tôi",
            message: "Cho tôi xem danh sách CV tôi đã tạo.",
        },
        {
            title: "Tư vấn định hướng nghề nghiệp",
            message: "Dựa vào hồ sơ hiện tại, tôi nên làm gì tiếp theo để cải thiện cơ hội việc làm?",
        },
    ],
    recruiter: [
        {
            title: "Xem ứng viên mới",
            message: "Cho tôi xem danh sách ứng viên vừa ứng tuyển vào các tin đang tuyển.",
        },
        {
            title: "Đăng tin tuyển dụng",
            message: "Tôi muốn đăng một tin tuyển dụng mới, bạn hướng dẫn tôi nhé.",
        },
        {
            title: "Xếp hạng ứng viên",
            message: "Giúp tôi xếp hạng ứng viên cho vị trí đang tuyển theo mức độ phù hợp.",
        },
        {
            title: "Soạn email mời phỏng vấn",
            message: "Soạn giúp tôi một email mời ứng viên phỏng vấn.",
        },
    ],
};

function WidgetThreadTracker({
    agentId,
    threadId,
    isFreshThread,
    onTouch,
    onGenerateTitle,
}: {
    agentId: WidgetAgentId;
    threadId: string;
    isFreshThread: boolean;
    onTouch: (id: string) => void;
    onGenerateTitle: (id: string, firstMessage: string) => void;
}) {
    const { agent } = useAgent({ agentId });
    const titledThreads = useRef<Set<string>>(new Set());
    const lastCountRef = useRef<number>(0);

    useEffect(() => {
        if ((agent as any).threadId !== threadId) return;

        const messages = agent.messages ?? [];
        if (messages.length === 0) return;
        if (messages.length === lastCountRef.current) return;

        lastCountRef.current = messages.length;
        onTouch(threadId);

        if (!isFreshThread) return;

        const firstUserMessage = messages.find((m: any) => m.role === "user");
        if (firstUserMessage && !titledThreads.current.has(threadId) && messages.length <= 2) {
            titledThreads.current.add(threadId);
            const content =
                typeof firstUserMessage.content === "string"
                    ? firstUserMessage.content
                    : JSON.stringify(firstUserMessage.content ?? "");
            onGenerateTitle(threadId, content);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [agent.messages, (agent as any).threadId, threadId, isFreshThread]);

    return null;
}

function ThreadListBody({
    threads,
    isLoading,
    activeThreadId,
    onSelect,
    onDelete,
}: {
    threads: ChatThread[];
    isLoading: boolean;
    activeThreadId: string | undefined;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
}) {
    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                Đang tải...
            </div>
        );
    }

    if (threads.length === 0) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
                <History className="size-8 text-gray-300 dark:text-[#1E5F74]" />
                <p className="text-sm text-muted-foreground">Chưa có cuộc trò chuyện nào</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-2">
            {threads.map((t) => {
                const isActive = t.id === activeThreadId;
                return (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => onSelect(t.id)}
                        className={`group mb-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors ${isActive
                            ? "bg-[#005a71]/10 dark:bg-[#67E8F9]/10"
                            : "hover:bg-gray-100 dark:hover:bg-[#1E5F74]/20"
                            }`}
                    >
                        <div
                            className={`flex size-8 shrink-0 items-center justify-center rounded-full ${isActive
                                ? "bg-[#005a71] text-white dark:bg-[#67E8F9] dark:text-[#0d2d42]"
                                : "bg-gray-100 text-gray-400 dark:bg-[#1E5F74]/30 dark:text-[#94A3B8]"
                                }`}
                        >
                            <MessageSquare className="size-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-[#E0F2FE]">
                                {t.title || "Cuộc trò chuyện mới"}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-[#64748B]">{timeAgo(t.updatedAt)}</p>
                        </div>
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(t.id);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.stopPropagation();
                                    onDelete(t.id);
                                }
                            }}
                            title="Xoá cuộc trò chuyện"
                            className="flex size-7 shrink-0 items-center justify-center rounded-full text-gray-300 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:text-[#475569] dark:hover:bg-red-900/20"
                        >
                            <Trash2 className="size-3.5" />
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

function WidgetSidebar({
    agentId,
    topOffset,
    onClose,
}: {
    agentId: WidgetAgentId;
    topOffset: number;
    onClose: () => void;
}) {
    const meta = AGENT_META[agentId];
    const agentType = AGENT_ID_TO_TYPE[agentId];
    const { threads, isLoading, createThread, deleteThread, touchThread, generateTitle } =
        useChatThreads(agentType);

    const [view, setView] = useState<WidgetView>("chat");
    const [activeThreadId, setActiveThreadId] = useState<string | undefined>();
    const isCreatingRef = useRef(false);
    const [freshThreadMap, setFreshThreadMap] = useState<Map<string, boolean>>(new Map());

    const handleCreateThread = () => {
        if (isCreatingRef.current) return;
        isCreatingRef.current = true;
        createThread(undefined)
            .then((thread) => {
                setActiveThreadId(thread.id);
                setView("chat");
            })
            .catch(() => { })
            .finally(() => {
                isCreatingRef.current = false;
            });
    };

    const handleDeleteThread = async (id: string) => {
        await deleteThread(id).catch(() => { });
        if (activeThreadId === id) {
            setActiveThreadId(undefined);
        }
    };

    // Giống DashboardAiChat: quay lại đúng cuộc trò chuyện gần nhất nếu đã có,
    // chỉ tạo mới khi chưa từng chat lần nào.
    useEffect(() => {
        if (activeThreadId || isCreatingRef.current || isLoading) return;
        if (threads.length > 0) {
            setActiveThreadId(threads[0].id);
            return;
        }
        handleCreateThread();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeThreadId, isLoading, threads]);

    useEffect(() => {
        if (!activeThreadId || freshThreadMap.has(activeThreadId)) return;
        const thread = threads.find((t) => t.id === activeThreadId);
        const isFresh = thread ? thread.createdAt === thread.updatedAt : true;
        setFreshThreadMap((prev) => new Map(prev).set(activeThreadId, isFresh));
    }, [activeThreadId, threads, freshThreadMap]);

    const progressMessageView = useMemo(
        () => createAgentProgressMessageView(agentId, meta.title, meta.welcome),
        [agentId, meta.title, meta.welcome],
    );

    const isThreadsView = view === "threads";

    useConfigureSuggestions({ suggestions: AGENT_SUGGESTIONS[agentId] });

    return (
        <div
            className="animate-in slide-in-from-right duration-300 fixed inset-y-0 right-0 z-40 flex flex-col overflow-hidden bg-white shadow-[-24px_0_70px_-30px_rgba(0,0,0,0.45)] ring-1 ring-black/5 dark:bg-[#0d2d42] dark:ring-white/10"
            style={{ width: SIDEBAR_WIDTH_CSS, top: topOffset }}
        >
            {/* CopilotChat tự đọc biến --background chung của site (mặc định near-black ở
          dark mode) thay vì màu navy #0d2d42 mà các card khác trong dự án dùng.
          !important + target cả phần tử con để thắng chắc chắn bất kể thứ tự load CSS
          của thư viện CopilotKit. */}
            <style>{`
        .dark [data-copilotkit],
        .dark [data-copilotkit] * {
          --background: #0d2d42 !important;
        }
      `}</style>
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#e1efff] bg-white px-4 py-3.5 dark:border-[#1E5F74] dark:bg-[#12384f]">
                <div className="flex min-w-0 items-center gap-2.5">
                    {isThreadsView ? (
                        <button
                            type="button"
                            onClick={() => setView("chat")}
                            title="Quay lại"
                            className="flex size-8 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-[#94A3B8] dark:hover:bg-[#1E5F74]/30 dark:hover:text-[#E0F2FE]"
                        >
                            <ArrowLeft className="size-4" />
                        </button>
                    ) : (
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#005a71]/10 text-[#005a71] dark:bg-white/10 dark:text-[#67E8F9]">
                            <Sparkles className="size-4" />
                        </div>
                    )}
                    <p className="truncate text-sm font-bold text-gray-900 dark:text-[#E0F2FE]">
                        {isThreadsView ? "Lịch sử trò chuyện" : meta.title}
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    {!isThreadsView && (
                        <>
                            <button
                                type="button"
                                onClick={() => setView("threads")}
                                title="Lịch sử trò chuyện"
                                className="flex size-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-[#94A3B8] dark:hover:bg-[#1E5F74]/30 dark:hover:text-[#E0F2FE]"
                            >
                                <History className="size-4" />
                            </button>
                            <button
                                type="button"
                                onClick={handleCreateThread}
                                title="Cuộc trò chuyện mới"
                                className="flex size-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-[#94A3B8] dark:hover:bg-[#1E5F74]/30 dark:hover:text-[#E0F2FE]"
                            >
                                <Plus className="size-4" />
                            </button>
                            <a
                                href={meta.fullPageHref}
                                title="Mở toàn màn hình"
                                className="flex size-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-[#94A3B8] dark:hover:bg-[#1E5F74]/30 dark:hover:text-[#E0F2FE]"
                            >
                                <Maximize2 className="size-4" />
                            </a>
                        </>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        title="Đóng"
                        className="flex size-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-[#94A3B8] dark:hover:bg-[#1E5F74]/30 dark:hover:text-[#E0F2FE]"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="flex min-h-0 flex-1 flex-col px-3">
                {isThreadsView ? (
                    <ThreadListBody
                        threads={threads}
                        isLoading={isLoading}
                        activeThreadId={activeThreadId}
                        onSelect={(id) => {
                            setActiveThreadId(id);
                            setView("chat");
                        }}
                        onDelete={handleDeleteThread}
                    />
                ) : activeThreadId ? (
                    <>
                        <WidgetThreadTracker
                            agentId={agentId}
                            threadId={activeThreadId}
                            isFreshThread={freshThreadMap.get(activeThreadId) ?? false}
                            onTouch={(id) => touchThread(id).catch(() => { })}
                            onGenerateTitle={(id, content) =>
                                generateTitle({ id, firstMessage: content }).catch(() => { })
                            }
                        />
                        <CopilotChat
                            agentId={agentId}
                            threadId={activeThreadId}
                            messageView={progressMessageView}
                            labels={{
                                modalHeaderTitle: meta.title,
                                welcomeMessageText: meta.welcome,
                            }}
                        />
                    </>
                ) : (
                    <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                        Đang chuẩn bị cuộc trò chuyện...
                    </div>
                )}
            </div>
        </div>
    );
}

function CandidateSidebarBody({ topOffset, onClose }: { topOffset: number; onClose: () => void }) {
    // Đăng ký renderer y hệt CandidateDashboardAiTab: tìm việc, tạo/chỉnh template CV, quản lý CV.
    useJobSearchRenderer();
    useTemplateRenderer();
    useCvToolsRenderer();

    return <WidgetSidebar agentId="candidate" topOffset={topOffset} onClose={onClose} />;
}

function RecruiterSidebarBody({ topOffset, onClose }: { topOffset: number; onClose: () => void }) {
    return <WidgetSidebar agentId="recruiter" topOffset={topOffset} onClose={onClose} />;
}

function OpenBubble({ onOpen }: { onOpen: () => void }) {
    return (
        <button
            type="button"
            onClick={onOpen}
            aria-label="Mở trợ lý AI"
            className="fixed bottom-5 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-[#005a71] to-[#0e7490] text-white shadow-[0_10px_30px_-6px_rgba(0,90,113,0.55)] transition-transform hover:scale-105 active:scale-95"
        >
            <Sparkles className="size-6" />
        </button>
    );
}

/**
 * Bọc layout gồm 2 phần tách biệt:
 * - `header`: luôn giữ nguyên full-width, KHÔNG bị đẩy/co lại — đo chiều cao thật
 *   bằng ResizeObserver để sidebar biết bắt đầu từ đâu (không che lên header).
 * - `children`: nội dung trang (không gồm header) — bị đẩy sang trái bằng
 *   margin-right đúng bằng bề rộng sidebar khi sidebar mở, giống split-view của
 *   Claude.ai.
 *
 * Sidebar/bubble ẩn hoàn toàn khi:
 * - Route print (giống HeaderGate)
 * - Chưa đăng nhập / chưa chọn role / là ADMIN (agent tools cần session hợp lệ,
 *   chỉ có 2 agent: candidate / recruiter)
 * - Đang ở đúng trang dashboard tương ứng (nơi đã có sẵn tab "AI Co-worker" full-page)
 */
export function AiChatShell({
    header,
    children,
}: {
    header: React.ReactNode;
    children: React.ReactNode;
}) {
    const pathname = usePathname() || "";
    const { user, isAuthenticated } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    const headerRef = useRef<HTMLDivElement>(null);
    const [headerHeight, setHeaderHeight] = useState(0);

    useLayoutEffect(() => {
        const el = headerRef.current;
        if (!el) return;
        const update = () => setHeaderHeight(el.offsetHeight);
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const isHiddenRoute = HIDDEN_ROUTE_PATTERNS.some((p) => p.test(pathname));

    const agentId: WidgetAgentId | null =
        user?.role === "CANDIDATE" ? "candidate" : user?.role === "EMPLOYER" ? "recruiter" : null;

    const isOnFullPageAiRoute = agentId != null && pathname === FULL_PAGE_AI_ROUTE[agentId];

    const isVisible = !isHiddenRoute && isAuthenticated && !!agentId && !isOnFullPageAiRoute;
    const isPushed = isVisible && isOpen;

    return (
        <>
            {/* Header giữ nguyên full-width, không tham gia margin-shift bên dưới */}
            <div ref={headerRef}>{header}</div>

            <div
                className="transition-[margin-right] duration-300 ease-in-out"
                style={{ marginRight: isPushed ? SIDEBAR_WIDTH_CSS : undefined }}
            >
                {children}
            </div>

            {isVisible &&
                (isOpen ? (
                    agentId === "candidate" ? (
                        <CandidateSidebarBody topOffset={headerHeight} onClose={() => setIsOpen(false)} />
                    ) : (
                        <RecruiterSidebarBody topOffset={headerHeight} onClose={() => setIsOpen(false)} />
                    )
                ) : (
                    <OpenBubble onOpen={() => setIsOpen(true)} />
                ))}
        </>
    );
}