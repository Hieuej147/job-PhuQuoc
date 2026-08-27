"use client";

import { CopilotChat, useConfigureSuggestions } from "@copilotkit/react-core/v2";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  History,
  Maximize2,
  MessageSquare,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { createAgentProgressMessageView } from "@/components/ai/agent-progress-chat-message";
import { useCvToolsRenderer } from "@/components/ai/renderers/cv-tools-renderer";
import { useJobSearchRenderer } from "@/components/ai/renderers/job-search-renderer";
import { useJobToolsRenderer } from "@/components/ai/renderers/job-tools-renderer";
import { useBlogPostRenderer } from "@/components/ai/renderers/blog-tools-renderer";
import { useTemplateRenderer } from "@/hooks/use-template-renderer";
import { type ChatThread } from "@/features/ai-chat/api";
import {
  AI_AGENT_ID_TO_TYPE,
  AI_AGENT_META,
  AI_AGENT_SUGGESTIONS,
  FULL_PAGE_AI_ROUTE,
  type AiAgentId,
} from "@/features/ai-chat/constants";
import { useAiChatThreadSession } from "@/features/ai-chat/use-ai-chat-thread-session";
import { useAiThreadActivityTracker } from "@/features/ai-chat/use-ai-thread-activity";

const HIDDEN_ROUTE_PATTERNS = [
  /^\/resumes\/[^/]+\/print$/,
  /^\/applications\/[^/]+\/resume\/print$/,
];

const DASHBOARD_ROUTE_PATTERNS = [/^\/candidate\/dashboard/, /^\/employer\/dashboard/];

// Route cá nhân: giữ hiển thị dạng sidebar toàn chiều cao (như trước giờ)
const PERSONAL_ROUTE_PATTERNS = [/^\/candidate(\/|$)/, /^\/employer(\/|$)/];

const SIDEBAR_WIDTH_CSS = "min(440px, 92vw)";
const POPUP_WIDTH_CSS = "min(400px, 92vw)";
const POPUP_HEIGHT_CSS = "min(600px, 75vh)";

type WidgetVariant = "sidebar" | "popup";

function WidgetThreadTracker({
  agentId,
  threadId,
  onTouch,
  onGenerateTitle,
}: {
  agentId: AiAgentId;
  threadId: string;
  onTouch: (id: string) => void;
  onGenerateTitle: (id: string, firstMessage: string) => void;
}) {
  useAiThreadActivityTracker({ agentId, threadId, onTouch, onGenerateTitle });
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
        <p className="text-sm font-medium text-muted-foreground">Chưa có cuộc trò chuyện nào</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-2">
      {threads.map((thread) => {
        const isActive = thread.id === activeThreadId;
        return (
          <div
            key={thread.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(thread.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(thread.id);
              }
            }}
            className={`group flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left transition-colors ${isActive
              ? "bg-[#005a71]/10 text-[#005a71] dark:bg-white/10 dark:text-[#67E8F9]"
              : "text-gray-700 hover:bg-gray-100 dark:text-[#D9EAF6] dark:hover:bg-[#1E5F74]/25"
              }`}
          >
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-[#1E5F74]/30 dark:text-[#94A3B8]">
              <MessageSquare className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {thread.title || "Cuộc trò chuyện"}
              </p>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {new Date(thread.updatedAt).toLocaleString("vi-VN")}
              </p>
            </div>
            <button
              type="button"
              aria-label="Xoá cuộc trò chuyện"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(thread.id);
              }}
              className="hidden size-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 group-hover:flex dark:hover:bg-red-500/10 dark:hover:text-red-300"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function WidgetPanel({
  agentId,
  variant,
  topOffset,
  onClose,
}: {
  agentId: AiAgentId;
  variant: WidgetVariant;
  topOffset: number;
  onClose: () => void;
}) {
  const agentType = AI_AGENT_ID_TO_TYPE[agentId];
  const meta = AI_AGENT_META[agentId];
  const {
    threads,
    isLoading,
    activeThreadId,
    setActiveThreadId,
    isCreatingThread,
    createNewThread,
    deleteThreadAndSelectNext,
    touchThread,
    generateTitleStream,
  } = useAiChatThreadSession(agentType);
  const [view, setView] = useState<"chat" | "threads">("chat");

  const progressMessageView = useMemo(
    () => createAgentProgressMessageView(agentId, meta.title, meta.welcome),
    [agentId, meta.title, meta.welcome],
  );

  useConfigureSuggestions({ suggestions: AI_AGENT_SUGGESTIONS[agentId] });

  const handleCreateThread = () => {
    createNewThread();
    setView("chat");
  };

  const isThreadsView = view === "threads";
  const isSidebar = variant === "sidebar";

  const wrapperClassName = isSidebar
    ? "animate-in slide-in-from-right duration-300 fixed inset-y-0 right-0 z-40 flex flex-col overflow-hidden bg-white shadow-[-24px_0_70px_-30px_rgba(0,0,0,0.45)] ring-1 ring-black/5 dark:bg-[#0d2d42] dark:ring-white/10"
    : "animate-in slide-in-from-bottom-4 fade-in duration-200 fixed bottom-24 right-5 z-40 flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)] ring-1 ring-black/5 dark:bg-[#0d2d42] dark:ring-white/10";

  const wrapperStyle = isSidebar
    ? { width: SIDEBAR_WIDTH_CSS, top: topOffset }
    : { width: POPUP_WIDTH_CSS, height: POPUP_HEIGHT_CSS };

  return (
    <div className={wrapperClassName} style={wrapperStyle}>
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
                disabled={isCreatingThread}
                title="Cuộc trò chuyện mới"
                className="flex size-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60 dark:text-[#94A3B8] dark:hover:bg-[#1E5F74]/30 dark:hover:text-[#E0F2FE]"
              >
                <Plus className="size-4" />
              </button>
              <Link
                href={meta.fullPageHref}
                title="Mở toàn màn hình"
                className="flex size-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-[#94A3B8] dark:hover:bg-[#1E5F74]/30 dark:hover:text-[#E0F2FE]"
              >
                <Maximize2 className="size-4" />
              </Link>
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
            onDelete={deleteThreadAndSelectNext}
          />
        ) : activeThreadId ? (
          <>
            <WidgetThreadTracker
              agentId={agentId}
              threadId={activeThreadId}
              onTouch={(id) => touchThread(id).catch(() => { })}
              onGenerateTitle={(id, content) =>
                generateTitleStream({ id, firstMessage: content }).catch((error) => {
                  console.warn("Generate thread title failed", error);
                })
              }
            />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <CopilotChat
                key={activeThreadId}
                agentId={agentId}
                threadId={activeThreadId}
                messageView={progressMessageView}
                labels={{
                  modalHeaderTitle: meta.title,
                  welcomeMessageText: meta.welcome,
                }}
              />
            </div>
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
  useJobSearchRenderer();
  useTemplateRenderer();
  useCvToolsRenderer();
  useBlogPostRenderer();

  return <WidgetPanel agentId="candidate" variant={variant} topOffset={topOffset} onClose={onClose} />;
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
  useJobToolsRenderer();
  useBlogPostRenderer();
  return <WidgetPanel agentId="recruiter" variant={variant} topOffset={topOffset} onClose={onClose} />;
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

export function AiChatShell({
  header,
  children,
}: {
  header: ReactNode;
  children: ReactNode;
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

  const agentId: AiAgentId | null =
    user?.role === "CANDIDATE" ? "candidate" : user?.role === "EMPLOYER" ? "recruiter" : null;

  const isHiddenRoute = HIDDEN_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
  const isDashboardRoute = DASHBOARD_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
  const isPersonalRoute = PERSONAL_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
  const isOnFullPageAiRoute = agentId != null && pathname === FULL_PAGE_AI_ROUTE[agentId];
  const shouldShowPopup =
    isAuthenticated && !!agentId && !isHiddenRoute && !isDashboardRoute && !isOnFullPageAiRoute;

  const variant: WidgetVariant = isPersonalRoute ? "sidebar" : "popup";

  return (
    <>
      <div ref={headerRef}>{header}</div>

      <div
        className="transition-[margin-right] duration-300 ease-in-out"
        style={{
          marginRight: shouldShowPopup && isOpen && variant === "sidebar" ? SIDEBAR_WIDTH_CSS : undefined,
        }}
      >
        {children}
      </div>

      {shouldShowPopup &&
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