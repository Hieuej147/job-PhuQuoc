"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CopilotChat, useAgent, useConfigureSuggestions } from "@copilotkit/react-core/v2";
import { Sparkles, X, Maximize2, Plus, History, ArrowLeft, MessageSquare, Trash2 } from "lucide-react";
import { createAgentProgressMessageView } from "@/components/ai/agent-progress-chat-message";
import { useJobSearchRenderer } from "@/components/ai/renderers/job-search-renderer";
import { useCvToolsRenderer } from "@/components/ai/renderers/cv-tools-renderer";
import { useJobToolsRenderer } from "@/components/ai/renderers/job-tools-renderer";
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

// 4 khu vực trang công khai chính (khớp đúng 4 mục nav: Trang chủ, Việc làm, Công ty,
// Bài viết) — bao gồm luôn trang con của mỗi khu vực (vd: /jobs/[slug]). Ở các trang
// này widget hiển thị dạng POPUP nổi góc phải dưới, không đẩy nội dung trang. Mọi
// trang khác (dashboard, profile, resumes, applications, employer/*...) vẫn giữ dạng
// sidebar đẩy nội dung như trước.
const MAIN_PAGE_PATTERNS = [
    /^\/$/,
    /^\/jobs(\/.*)?$/,
    /^\/companies(\/.*)?$/,
    /^\/blog(\/.*)?$/,
];

function isMainPublicPage(pathname: string): boolean {
    return MAIN_PAGE_PATTERNS.some((p) => p.test(pathname));
}

type WidgetAgentId = "candidate" | "recruiter";
type WidgetView = "chat" | "threads";
type WidgetVariant = "push" | "popup";

// Dùng chung 1 giá trị cho cả bề rộng sidebar lẫn margin-right của nội dung trang,
// để 2 bên luôn khớp nhau tuyệt đối (giống split-view của Claude.ai). min() để không
// tràn trên màn hình hẹp.
const SIDEBAR_WIDTH_CSS = "min(440px, 92vw)";

// Kích thước cửa sổ popup nổi (biến thể "popup") — cố định, không đẩy nội dung trang,
// neo ngay phía trên nút bong bóng mở chat (bottom-5) nên đặt bottom-24 để có khoảng
// cách hợp lý.
const POPUP_WIDTH_CSS = "min(400px, 92vw)";
const POPUP_HEIGHT_CSS = "min(640px, calc(100vh - 140px))";

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
    variant,
    topOffset,
    onClose,
}: {
    agentId: WidgetAgentId;
    variant: WidgetVariant;
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
        () =>
            createAgentProgressMessageView(agentId, meta.title, meta.welcome, {
                // Popup nhỏ hơn nhiều so với sidebar full-height/Dashboard, nên cần
                // min-height thấp hơn hẳn cho màn hình chào — nếu không sẽ bị đẩy lệch
                // giống hệt bản gốc min-h-[600px] vốn chỉ hợp với khung cao ~600px+.
                welcomeMinHeightClassName: variant === "popup" ? "min-h-[220px]" : undefined,
            }),
        [agentId, meta.title, meta.welcome, variant],
    );

    const isThreadsView = view === "threads";

    useConfigureSuggestions({ suggestions: AGENT_SUGGESTIONS[agentId] });

    // Container đổi hoàn toàn theo variant:
    // - "push": full-height dán sát cạnh phải, ngay dưới header (top: topOffset),
    //   đẩy nội dung trang qua margin-right ở AiChatShell (giữ nguyên hành vi cũ).
    // - "popup": cửa sổ nổi kích thước cố định, neo góc phải dưới ngay phía trên
    //   OpenBubble, KHÔNG đẩy nội dung trang (AiChatShell không set marginRight
    //   khi variant này đang mở).
    const containerClassName =
        variant === "popup"
            ? "animate-in slide-in-from-bottom-4 fade-in duration-300 fixed bottom-24 right-5 z-40 flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 dark:bg-[#0d2d42] dark:ring-white/10"
            : "animate-in slide-in-from-right duration-300 fixed inset-y-0 right-0 z-40 flex flex-col overflow-hidden bg-white shadow-[-24px_0_70px_-30px_rgba(0,0,0,0.45)] ring-1 ring-black/5 dark:bg-[#0d2d42] dark:ring-white/10";

    const containerStyle =
        variant === "popup"
            ? { width: POPUP_WIDTH_CSS, height: POPUP_HEIGHT_CSS }
            : { width: SIDEBAR_WIDTH_CSS, top: topOffset };

    return (
        <div className={containerClassName} style={containerStyle}>
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

function CandidateSidebarBody({
    variant,
    topOffset,
    onClose,
}: {
    variant: WidgetVariant;
    topOffset: number;
    onClose: () => void;
}) {
    // Đăng ký renderer y hệt CandidateDashboardAiTab: tìm việc, tạo/chỉnh template CV, quản lý CV.
    useJobSearchRenderer();
    useTemplateRenderer();
    useCvToolsRenderer();

    return <WidgetSidebar agentId="candidate" variant={variant} topOffset={topOffset} onClose={onClose} />;
}

function RecruiterSidebarBody({
    variant,
    topOffset,
    onClose,
}: {
    variant: WidgetVariant;
    topOffset: number;
    onClose: () => void;
}) {
    // Đăng ký renderer cho các tool của recruiter (hiện có: create_job) — trước
    // đây RecruiterSidebarBody không gọi renderer nào cả, khiến mọi tool luôn
    // rơi về accordion "Done" mặc định thay vì card đẹp.
    useJobToolsRenderer();

    return <WidgetSidebar agentId="recruiter" variant={variant} topOffset={topOffset} onClose={onClose} />;
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
 * Dùng riêng cho variant "popup": bong bóng LUÔN hiện (không biến mất khi cửa sổ
 * đang mở, khác với OpenBubble ở variant "push"), vì popup chỉ cao ~640px và
 * không che hết góc phải dưới — vẫn còn chỗ cho bong bóng ở bottom-5. Bấm lần
 * nữa sẽ đóng popup (toggle), icon đổi thành X khi đang mở để rõ affordance.
 */
function ToggleBubble({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            aria-label={isOpen ? "Đóng trợ lý AI" : "Mở trợ lý AI"}
            className="fixed bottom-5 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-[#005a71] to-[#0e7490] text-white shadow-[0_10px_30px_-6px_rgba(0,90,113,0.55)] transition-transform hover:scale-105 active:scale-95"
        >
            {isOpen ? <X className="size-6" /> : <Sparkles className="size-6" />}
        </button>
    );
}

/**
 * Bọc layout gồm 2 phần tách biệt:
 * - `header`: luôn giữ nguyên full-width, KHÔNG bị đẩy/co lại — đo chiều cao thật
 *   bằng ResizeObserver để sidebar biết bắt đầu từ đâu (không che lên header).
 * - `children`: nội dung trang (không gồm header) — bị đẩy sang trái bằng
 *   margin-right đúng bằng bề rộng sidebar khi sidebar (variant "push") mở, giống
 *   split-view của Claude.ai. Ở variant "popup" thì KHÔNG đẩy — cửa sổ nổi đè lên
 *   trên góc phải dưới, không ảnh hưởng layout trang.
 *
 * Variant được chọn tự động theo route:
 * - 4 khu vực trang công khai chính (trang chủ /, việc làm /jobs, công ty
 *   /companies, bài viết /blog — kể cả trang con) → "popup".
 * - Mọi route còn lại (trang cá nhân: profile, resumes, applications, employer/*...)
 *   → "push" (giữ nguyên hành vi cũ).
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

    const variant: WidgetVariant = isMainPublicPage(pathname) ? "popup" : "push";
    const isPushed = isVisible && isOpen && variant === "push";

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

            {isVisible && variant === "popup" && (
                <>
                    {/* Popup: panel và bong bóng cùng tồn tại độc lập — bong bóng KHÔNG biến
                        mất khi mở, bấm lần nữa để đóng (toggle), khác với variant "push". */}
                    {isOpen &&
                        (agentId === "candidate" ? (
                            <CandidateSidebarBody variant={variant} topOffset={headerHeight} onClose={() => setIsOpen(false)} />
                        ) : (
                            <RecruiterSidebarBody variant={variant} topOffset={headerHeight} onClose={() => setIsOpen(false)} />
                        ))}
                    <ToggleBubble isOpen={isOpen} onToggle={() => setIsOpen((v) => !v)} />
                </>
            )}

            {isVisible &&
                variant === "push" &&
                (isOpen ? (
                    agentId === "candidate" ? (
                        <CandidateSidebarBody variant={variant} topOffset={headerHeight} onClose={() => setIsOpen(false)} />
                    ) : (
                        <RecruiterSidebarBody variant={variant} topOffset={headerHeight} onClose={() => setIsOpen(false)} />
                    )
                ) : (
                    <OpenBubble onOpen={() => setIsOpen(true)} />
                ))}
        </>
    );
}