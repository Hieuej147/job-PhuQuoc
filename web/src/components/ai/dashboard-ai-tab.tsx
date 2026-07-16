"use client";
import { CopilotChat, useAgentContext, useConfigureSuggestions } from "@copilotkit/react-core/v2";
import { useMemo } from "react";
import { createAgentProgressMessageView } from "@/components/ai/agent-progress-chat-message";
import { useJobSearchRenderer } from "@/components/ai/renderers/job-search-renderer";
import { useCvToolsRenderer } from "@/components/ai/renderers/cv-tools-renderer";
import { useTemplateRenderer } from "@/hooks/use-template-renderer";
import { ThreadSidebar } from "@/features/ai-chat/thread-sidebar";
import { useAiThreadActivityTracker } from "@/features/ai-chat/use-ai-thread-activity";
import {
  AI_AGENT_ID_TO_TYPE,
  AI_AGENT_SUGGESTIONS,
  type AiAgentId,
} from "@/features/ai-chat/constants";
import { useAiChatThreadSession } from "@/features/ai-chat/use-ai-chat-thread-session";

export type DashboardAgentId = AiAgentId;

interface DashboardAiTabProps {
  agentId: DashboardAgentId;
  title: string;
  initialMessage: string;
  contextDescription: string;
  contextValue: unknown;
}

function ThreadActivityTracker({
  agentId,
  threadId,
  onTouch,
  onGenerateTitle,
}: {
  agentId: DashboardAgentId;
  threadId: string;
  onTouch: (id: string) => void;
  onGenerateTitle: (id: string, firstMessage: string) => void;
}) {
  useAiThreadActivityTracker({ agentId, threadId, onTouch, onGenerateTitle });
  return null;
}

function DashboardAiChat({
  agentId,
  title,
  initialMessage,
  contextDescription,
  contextValue,
}: DashboardAiTabProps) {
  const agentType = AI_AGENT_ID_TO_TYPE[agentId];
  const {
    threads,
    isLoading,
    activeThreadId,
    setActiveThreadId,
    isCreatingThread,
    createNewThread,
    renameThread,
    deleteThreadAndSelectNext,
    touchThread,
    generateTitleStream,
  } = useAiChatThreadSession(agentType);

  useAgentContext({
    description: contextDescription,
    value: JSON.stringify(contextValue, null, 2),
  });

  useConfigureSuggestions({ suggestions: AI_AGENT_SUGGESTIONS[agentId] });

  const progressMessageView = useMemo(
    () => createAgentProgressMessageView(agentId, title, initialMessage),
    [agentId, title, initialMessage],
  );

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
        onNewThread={createNewThread}
        isCreatingThread={isCreatingThread}
        onRenameThread={(id, t) => renameThread({ id, title: t })}
        onDeleteThread={deleteThreadAndSelectNext}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        {activeThreadId ? (
          <>
            <ThreadActivityTracker
              agentId={agentId}
              threadId={activeThreadId}
              onTouch={(id) => touchThread(id).catch(() => { })}
              onGenerateTitle={(id, content) =>
                generateTitleStream({ id, firstMessage: content }).catch((error) => {
                  console.warn("Generate thread title failed", error);
                })
              }
            />
            <CopilotChat
              key={activeThreadId}
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
  return <DashboardAiChat {...props} agentId="recruiter" />;
}
