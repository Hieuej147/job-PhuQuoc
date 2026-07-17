"use client";
import { CopilotChat, useAgentContext, useAgent, useConfigureSuggestions } from "@copilotkit/react-core/v2";
import { useEffect, useMemo, useRef, useState } from "react";
import { createAgentProgressMessageView } from "@/components/ai/agent-progress-chat-message";
import { useJobSearchRenderer } from "@/components/ai/renderers/job-search-renderer";
import { useCvToolsRenderer } from "@/components/ai/renderers/cv-tools-renderer";
import { useJobToolsRenderer } from "@/components/ai/renderers/job-tools-renderer";
import { useTemplateRenderer } from "@/hooks/use-template-renderer";
import { ThreadSidebar } from "@/features/ai-chat/thread-sidebar";
import { useChatThreads } from "@/features/ai-chat/use-chat-threads";
import { type ChatAgentType } from "@/features/ai-chat/api";

export type DashboardAgentId = "candidate" | "recruiter";

interface DashboardAiTabProps {
  agentId: DashboardAgentId;
  title: string;
  initialMessage: string;
  contextDescription: string;
  contextValue: unknown;
}

const AGENT_ID_TO_TYPE: Record<DashboardAgentId, ChatAgentType> = {
  candidate: "CANDIDATE",
  recruiter: "RECRUITER",
};

// Gợi ý tin nhắn dạng chip hiện ở màn hình chào (trước khi có tin nhắn nào) —
// giống hệt danh sách dùng ở global-ai-chat-widget.tsx để trải nghiệm nhất quán
// giữa sidebar toàn site và tab AI full-page ở dashboard.
const AGENT_SUGGESTIONS: Record<DashboardAgentId, { title: string; message: string }[]> = {
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

function ThreadActivityTracker({
  agentId,
  threadId,
  isFreshThread,
  onTouch,
  onGenerateTitle,
}: {
  agentId: DashboardAgentId;
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
  }, [agent.messages, (agent as any).threadId, threadId, isFreshThread]);

  return null;
}

function DashboardAiChat({
  agentId,
  title,
  initialMessage,
  contextDescription,
  contextValue,
}: DashboardAiTabProps) {
  const agentType = AGENT_ID_TO_TYPE[agentId];
  const { threads, isLoading, createThread, renameThread, deleteThread, touchThread, generateTitle } =
    useChatThreads(agentType);
  const [activeThreadId, setActiveThreadId] = useState<string | undefined>();
  const isCreatingRef = useRef(false);
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [freshThreadMap, setFreshThreadMap] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    if (!activeThreadId) return;
    if (freshThreadMap.has(activeThreadId)) return;
    const thread = threads.find((t) => t.id === activeThreadId);
    const isFresh = thread ? thread.createdAt === thread.updatedAt : true;
    setFreshThreadMap((prev) => {
      const next = new Map(prev);
      next.set(activeThreadId, isFresh);
      return next;
    });
  }, [activeThreadId, threads, freshThreadMap]);

  useAgentContext({
    description: contextDescription,
    value: JSON.stringify(contextValue, null, 2),
  });

  useConfigureSuggestions({ suggestions: AGENT_SUGGESTIONS[agentId] });

  const progressMessageView = useMemo(
    () => createAgentProgressMessageView(agentId, title, initialMessage),
    [agentId, title, initialMessage],
  );

  const handleCreateThread = () => {
    if (isCreatingRef.current) return;
    isCreatingRef.current = true;
    setIsCreatingThread(true);
    createThread(undefined)
      .then((thread) => setActiveThreadId(thread.id))
      .catch(() => { })
      .finally(() => {
        isCreatingRef.current = false;
        setIsCreatingThread(false);
      });
  };

  useEffect(() => {
    if (activeThreadId || isCreatingRef.current || isLoading) return;

    // Ưu tiên mở lại cuộc trò chuyện GẦN ĐÂY NHẤT (nếu đã có sẵn) — giống ChatGPT,
    // quay lại trang là vào đúng chỗ đang dở, không tự nhảy vào cuộc mới.
    if (threads.length > 0) {
      setActiveThreadId(threads[0].id); // threads đã sort theo updatedAt desc
      return;
    }

    handleCreateThread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThreadId, isLoading, threads]);

  useEffect(() => {
    if (!activeThreadId) return;
    if (freshThreadMap.has(activeThreadId)) return;
    const thread = threads.find((t) => t.id === activeThreadId);
    const isFresh = thread ? thread.createdAt === thread.updatedAt : true;
    setFreshThreadMap((prev) => {
      const next = new Map(prev);
      next.set(activeThreadId, isFresh);
      return next;
    });
  }, [activeThreadId, threads, freshThreadMap]);

  const handleDeleteThread = async (id: string) => {
    await deleteThread(id);
    if (activeThreadId === id) {
      setActiveThreadId(undefined);
    }
  };

  return (
    <div className="flex h-[760px] min-h-[620px] overflow-hidden rounded-xl border border-[#e1efff] bg-white shadow-sm dark:border-[#1E5F74] dark:bg-[#0d2d42]">
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
      <ThreadSidebar
        threads={threads}
        isLoading={isLoading}
        activeThreadId={activeThreadId}
        onSelectThread={setActiveThreadId}
        onNewThread={handleCreateThread}
        isCreatingThread={isCreatingThread}
        onRenameThread={(id, t) => renameThread({ id, title: t })}
        onDeleteThread={handleDeleteThread}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        {activeThreadId ? (
          <>
            <ThreadActivityTracker
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
                modalHeaderTitle: title,
                welcomeMessageText: initialMessage,
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

export function CandidateDashboardAiTab(
  props: Omit<DashboardAiTabProps, "agentId">,
) {
  useJobSearchRenderer();
  useTemplateRenderer();
  useCvToolsRenderer();
  return <DashboardAiChat {...props} agentId="candidate" />;
}

export function EmployerDashboardAiTab(
  props: Omit<DashboardAiTabProps, "agentId">,
) {
  // Trước đây EmployerDashboardAiTab không đăng ký renderer nào cả — mọi tool
  // của recruiter (create_job, rank_candidates...) luôn rơi về accordion "Done"
  // mặc định. Giờ đăng ký renderer cho create_job (card đẹp, click chuyển tới
  // trang sửa tin /employer/jobs/{id}/edit).
  useJobToolsRenderer();
  return <DashboardAiChat {...props} agentId="recruiter" />;
}