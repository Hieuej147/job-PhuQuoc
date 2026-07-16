"use client";
import {
  CopilotChatMessageView,
  useAgent,
  useCopilotChatConfiguration,
} from "@copilotkit/react-core/v2";
import { Activity, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  fetchThreadHistory,
  type ThreadHistoryMessage,
} from "@/features/ai-chat/api";
import {
  HistoryBubble,
  ToolCallHistoryCard,
  WelcomeBubble,
} from "@/features/ai-chat/thread-history-renderer";

interface AgentProgressState {
  cv_flow?: string;
  step?: string;
  progress?: number;
  activeWorker?: string;
  currentStep?: string;
  status?: string;
  toolStatus?: string;
}

function resetProgressState(state: AgentProgressState) {
  return {
    ...state,
    activeWorker: undefined,
    currentStep: "",
    status: "idle",
    toolStatus: undefined,
    progress: 0,
    step: "",
    cv_flow: state.cv_flow === "done" ? "done" : "idle",
  };
}

function AgentProgressBubble({
  agentId,
  title,
}: {
  agentId: string;
  title?: string;
}) {
  const { agent } = useAgent({ agentId });
  const wasRunningRef = useRef(false);
  const state = (agent.state || {}) as AgentProgressState;

  useEffect(() => {
    if (wasRunningRef.current && !agent.isRunning) {
      agent.setState(
        resetProgressState((agent.state || {}) as AgentProgressState),
      );
    }
    wasRunningRef.current = agent.isRunning;
  }, [agent, agent.isRunning]);

  const step = state.currentStep || state.step;
  const progress = Math.max(0, Math.min(100, Number(state.progress || 0)));
  const activeWorker = state.activeWorker;
  const status = state.status || state.toolStatus || state.cv_flow;
  const hasState = Boolean(step || activeWorker || progress > 0);
  if (!agent.isRunning || !hasState || status === "idle") return null;
  const done = status === "done" || progress >= 100;

  return (
    <div className="my-3 flex justify-start px-4">
      <div className="w-full max-w-[82%] rounded-xl border border-[#e1efff] bg-white px-4 py-3 text-sm shadow-sm dark:border-[#1E5F74] dark:bg-[#0d2d42]">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#005a71]/10 text-[#005a71] dark:text-[#67E8F9]">
            {done ? (
              <CheckCircle2 className="size-4" />
            ) : progress > 0 ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Activity className="size-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate font-semibold text-foreground">
                {activeWorker || title || "AI đang xử lý"}
              </p>
              <span className="shrink-0 text-xs font-medium text-muted-foreground">
                {progress}%
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {step || "Đang chạy..."}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-[#005a71] transition-all duration-300 dark:bg-[#67E8F9]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TypingCursor() {
  return (
    <div className="flex items-center gap-2 p-4 ml-2 animate-in fade-in duration-500">
      <div className="w-2.5 h-2.5 bg-slate-400 dark:bg-slate-300 rounded-full animate-thinking-dot" />
      <span className="text-xs text-slate-400 dark:text-slate-300 font-medium tracking-wide">
        Assistant is thinking...
      </span>
    </div>
  );
}

function getMessageText(m: any): string {
  if (typeof m.content === "string") return m.content;
  try {
    return JSON.stringify(m.content ?? "");
  } catch {
    return "";
  }
}

function makeRenderSafeMessages(messages: any[]) {
  const seen = new Map<string, number>();

  return messages.map((message, index) => {
    const id = String(
      message.id ??
        message.tool_call_id ??
        message.toolCallId ??
        `message-${index}`,
    );
    const count = seen.get(id) ?? 0;
    seen.set(id, count + 1);

    if (count === 0) return message;

    return {
      ...message,
      id: `${id}:${message.role ?? "message"}:${count}`,
    };
  });
}

/**
 * Tự đọc lịch sử tin nhắn thật từ endpoint riêng (/threads/:id/history), bỏ qua
 * cơ chế "tự tải lại lịch sử khi đổi threadId" lỗi của CopilotKit (GitHub issue
 * #2200, #3181). Lịch sử (text + tool) luôn hiển thị cố định trên cùng theo đúng
 * thứ tự thời gian thật, và tin nhắn "live" trùng nội dung/id với lịch sử sẽ bị
 * lọc bỏ để tránh hiện lặp/sai vị trí.
 */
export function createAgentProgressMessageView(
  agentId: string,
  title?: string,
  welcomeText?: string,
) {
  function AgentProgressMessageView(props: any) {
    const config = useCopilotChatConfiguration();
    const threadId: string | undefined = (config as any)?.threadId;
    const { agent } = useAgent({ agentId });
    const isAgentRunning = Boolean(agent.isRunning || props.isRunning);

    const liveMessages = props.messages ?? [];

    const [history, setHistory] = useState<ThreadHistoryMessage[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const loadedThreadRef = useRef<string | undefined>(undefined);

    useEffect(() => {
      if (!threadId) {
        setHistory([]);
        setHistoryLoading(false);
        return;
      }
      if (loadedThreadRef.current === threadId) return;
      loadedThreadRef.current = threadId;
      setHistoryLoading(true);
      fetchThreadHistory(threadId)
        .then((msgs) => setHistory(msgs))
        .catch(() => setHistory([]))
        .finally(() => setHistoryLoading(false));
    }, [threadId]);

    if (historyLoading) {
      return (
        <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-muted-foreground">
          Đang tải...
        </div>
      );
    }

    const hasHistory = history.length > 0;

    const historyTextSet = new Set(
      history
        .filter((h) => h.kind === "text")
        .map((h) => `${h.role}::${h.content}`),
    );
    // Dùng tool_call_id (không phải id của riêng ToolMessage) để lọc — đảm bảo loại bỏ
    // CẢ CẶP AIMessage(tool_calls) + ToolMessage(kết quả) cùng lúc. Nếu chỉ lọc 1 phía,
    // phía còn lại sẽ hiện treo mãi ở trạng thái "Running" vì mất cặp tương ứng.
    const historyToolCallIdSet = new Set(
      history
        .filter((h) => h.kind === "tool" && h.toolCallId)
        .map((h) => h.toolCallId as string),
    );
    const filteredLiveMessages = liveMessages.filter((m: any) => {
      const toolCallId = m.tool_call_id || m.toolCallId;
      if (toolCallId && historyToolCallIdSet.has(toolCallId)) return false;

      const toolCalls = m.tool_calls || m.toolCalls;
      if (Array.isArray(toolCalls) && toolCalls.length > 0) {
        const allResolved = toolCalls.every((tc: any) =>
          historyToolCallIdSet.has(tc.id),
        );
        if (allResolved) return false;
      }

      const role = m.role === "user" ? "user" : "assistant";
      const text = getMessageText(m);
      return !historyTextSet.has(`${role}::${text}`);
    });
    const renderSafeLiveMessages = makeRenderSafeMessages(filteredLiveMessages);

    if (!hasHistory && renderSafeLiveMessages.length === 0 && welcomeText) {
      return <WelcomeBubble text={welcomeText} />;
    }

    return (
      <>
        {hasHistory && (
          <div>
            {history.map((m) =>
              m.kind === "tool" ? (
                <ToolCallHistoryCard key={m.id} message={m} />
              ) : (
                <HistoryBubble key={m.id} message={m} />
              ),
            )}
          </div>
        )}
        <CopilotChatMessageView
          {...props}
          messages={renderSafeLiveMessages}
          isRunning={false}
        />
        {isAgentRunning && <TypingCursor />}
        <AgentProgressBubble agentId={agentId} title={title} />
      </>
    );
  }
  return AgentProgressMessageView as typeof CopilotChatMessageView;
}
