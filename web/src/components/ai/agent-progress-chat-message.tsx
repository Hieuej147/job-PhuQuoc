"use client";
import {
  CopilotChatMessageView,
  useAgent,
  useCopilotChatConfiguration,
} from "@copilotkit/react-core/v2";
import { Activity, CheckCircle2, Loader2, Copy, Check, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { fetchThreadHistory, type ThreadHistoryMessage } from "@/features/ai-chat/api";
import { RichContent } from "@/components/ui/rich-content";
import { SaveCvResultCard, CvListCard, CvDetailCard } from "@/components/ai/renderers/cv-tools-renderer";
import { CreateJobResultCard } from "@/components/ai/renderers/job-tools-renderer";
import { JobListCard } from "@/components/ai/renderers/job-list-card";
import { CVPreviewInline, normalizeCvResult } from "@/hooks/use-template-renderer";

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

function AgentProgressBubble({ agentId, title }: { agentId: string; title?: string }) {
  const { agent } = useAgent({ agentId });
  const wasRunningRef = useRef(false);
  const state = (agent.state || {}) as AgentProgressState;

  useEffect(() => {
    if (wasRunningRef.current && !agent.isRunning) {
      agent.setState(resetProgressState((agent.state || {}) as AgentProgressState));
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

// Tắt hẳn "loading cursor" mặc định của CopilotKit (data-testid="copilot-loading-cursor")
// — đây chính là nguồn gốc chấm đen nhấp nháy hiện lạc lõng phía trên tool card,
// vì AgentProgressBubble đã đảm nhiệm việc báo hiệu "đang xử lý" rồi.
function NoCursor() {
  return <></>;
}

function WelcomeBubble({
  text,
  minHeightClassName = "min-h-[600px]",
}: {
  text: string;
  minHeightClassName?: string;
}) {
  // Lưu ý cho lần sửa sau: đã thử 3 cách CSS (min-h-full, flex-1, ép flex-grow
  // nhiều cấp cha kèm :has()) để làm WelcomeBubble tự chiếm đúng khoảng trống thật
  // bên trong CopilotChat (thư viện bọc nội dung qua nhiều lớp wrapper không phải
  // flex container, phá chuỗi truyền kích thước) — cả 3 đều không ăn thua trên
  // thực tế dù DevTools xác nhận CSS có áp dụng, khả năng cao còn 1-2 cấp cha khác
  // trong DOM nội bộ thư viện chưa được xử lý. Quay lại dùng min-height CỐ ĐỊNH
  // (đơn giản, đáng tin cậy hơn) — giá trị mặc định 600px giữ nguyên như bản gốc
  // (đã hoạt động ổn cho sidebar "push" và Dashboard full-page), chỉ truyền
  // minHeightClassName nhỏ hơn riêng cho variant "popup" (khung nhỏ hơn nhiều).
  return (
    <div
      className={`flex ${minHeightClassName} w-full flex-col items-center justify-center gap-2 px-10 py-10 text-center`}
    >
      <p className="whitespace-pre-line text-xl font-medium leading-relaxed text-foreground">
        {text}
      </p>
    </div>
  );
}

function HistoryBubble({ message }: { message: ThreadHistoryMessage }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // bỏ qua nếu trình duyệt chặn clipboard
    }
  };

  return (
    <div className={`group my-2 flex flex-col px-4 ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${isUser
          ? "whitespace-pre-wrap bg-[#005a71] text-white"
          : "border border-[#e1efff] bg-white text-foreground dark:border-[#1E5F74] dark:bg-[#0d2d42]"
          }`}
      >
        {isUser ? (
          message.content
        ) : (
          <RichContent
            markdown={message.content}
            className="prose-sm prose-p:my-1 prose-p:first:mt-0 prose-p:last:mb-0"
          />
        )}
      </div>
      <button
        onClick={handleCopy}
        className="mt-1 flex items-center gap-1 text-xs text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? "Đã sao chép" : "Sao chép"}
      </button>
    </div>
  );
}

/**
 * Card hiển thị 1 lượt gọi tool trong lịch sử — nằm đúng vị trí thời gian thật của nó
 * (giữa 2 tin nhắn text liên quan), thay vì bị nguồn khôi phục mặc định của CopilotKit
 * dồn hết xuống cuối luồng chat.
 *
 * Đây là fallback THÔ (accordion Arguments/Result) — chỉ dùng cho tool nào chưa có
 * renderer riêng đẹp hơn. Xem HistoryToolCard bên dưới để biết cách tool có renderer
 * (save_cv, search_jobs, generate_cv_template...) được ưu tiên hiển thị đúng như lúc
 * chat live.
 */
function ToolCallHistoryCard({ message }: { message: ThreadHistoryMessage }) {
  let hasError = false;
  try {
    const parsed = JSON.parse(message.content);
    hasError = Boolean(parsed?.error);
  } catch {
    // content không phải JSON hợp lệ — coi như không có lỗi, hiển thị raw text.
  }

  return (
    <div className="my-2 px-4">
      <details className="group rounded-xl border border-[#e1efff] bg-white px-4 py-2.5 text-sm dark:border-[#1E5F74] dark:bg-[#0d2d42]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
            <span
              className={`size-2 shrink-0 rounded-full ${hasError ? "bg-red-500" : "bg-emerald-500"}`}
            />
            <span className="truncate font-mono text-xs font-semibold text-foreground">
              {message.toolName}
            </span>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${hasError
              ? "bg-red-50 text-red-600 dark:bg-red-900/20"
              : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20"
              }`}
          >
            {hasError ? "Error" : "Done"}
          </span>
        </summary>
        <div className="mt-2 space-y-2 border-t border-[#e1efff] pt-2 text-xs dark:border-[#1E5F74]">
          {message.toolArgs !== undefined && (
            <div>
              <p className="mb-1 font-semibold uppercase tracking-wide text-muted-foreground">
                Arguments
              </p>
              <pre className="overflow-x-auto rounded-lg bg-muted/50 p-2 text-[11px]">
                {JSON.stringify(message.toolArgs ?? {}, null, 2)}
              </pre>
            </div>
          )}
          <div>
            <p className="mb-1 font-semibold uppercase tracking-wide text-muted-foreground">
              Result
            </p>
            <pre className="overflow-x-auto rounded-lg bg-muted/50 p-2 text-[11px]">
              {message.content}
            </pre>
          </div>
        </div>
      </details>
    </div>
  );
}

// Parse an toàn message.content (luôn là string khi đến từ /threads/:id/history) —
// không throw nếu content không phải JSON hợp lệ.
function safeParseJson(content: string): any {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Dispatcher cho tool-call trong LỊCH SỬ: tra theo message.toolName để tái sử dụng
 * đúng card đẹp đã dùng lúc chat live (useRenderTool trong cv-tools-renderer.tsx,
 * job-search-renderer.tsx, use-template-renderer.tsx) — thay vì luôn rơi về
 * ToolCallHistoryCard (accordion Arguments/Result thô).
 *
 * Tool nào chưa có renderer riêng (get_candidates, draft_email, rank_candidates...)
 * vẫn fallback về ToolCallHistoryCard như cũ, không đổi hành vi.
 */
function HistoryToolCard({ message }: { message: ThreadHistoryMessage }) {
  const wrap = (node: React.ReactNode) => <div className="my-2 px-4">{node}</div>;

  switch (message.toolName) {
    case "save_cv": {
      const data = safeParseJson(message.content);
      return data ? wrap(<SaveCvResultCard data={data} />) : <ToolCallHistoryCard message={message} />;
    }
    case "list_my_cvs": {
      const data = safeParseJson(message.content);
      return data ? wrap(<CvListCard data={data} />) : <ToolCallHistoryCard message={message} />;
    }
    case "get_cv_detail": {
      const data = safeParseJson(message.content);
      return data ? wrap(<CvDetailCard data={data} />) : <ToolCallHistoryCard message={message} />;
    }
    case "create_job": {
      const data = safeParseJson(message.content);
      return data ? wrap(<CreateJobResultCard data={data} />) : <ToolCallHistoryCard message={message} />;
    }
    case "search_jobs": {
      const data = safeParseJson(message.content);
      return data
        ? wrap(<JobListCard jobs={data.jobs || []} total={data.total || 0} />)
        : <ToolCallHistoryCard message={message} />;
    }
    case "generate_cv_template":
    case "adjust_cv_template":
    case "upsert_cv_template":
    case "preview_cv": {
      const cv = normalizeCvResult(message.content);
      return cv
        ? wrap(<CVPreviewInline html={cv.html} css={cv.css || ""} />)
        : <ToolCallHistoryCard message={message} />;
    }
    default:
      return <ToolCallHistoryCard message={message} />;
  }
}

function getMessageText(m: any): string {
  if (typeof m.content === "string") return m.content;
  try {
    return JSON.stringify(m.content ?? "");
  } catch {
    return "";
  }
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
  options?: { welcomeMinHeightClassName?: string },
) {
  function AgentProgressMessageView(props: any) {
    const config = useCopilotChatConfiguration();
    const threadId: string | undefined = (config as any)?.threadId;

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
        const allResolved = toolCalls.every((tc: any) => historyToolCallIdSet.has(tc.id));
        if (allResolved) return false;
      }

      const role = m.role === "user" ? "user" : "assistant";
      const text = getMessageText(m);
      return !historyTextSet.has(`${role}::${text}`);
    });

    if (!hasHistory && filteredLiveMessages.length === 0 && welcomeText) {
      return <WelcomeBubble text={welcomeText} minHeightClassName={options?.welcomeMinHeightClassName} />;
    }

    return (
      <>
        {hasHistory && (
          <div>
            {history.map((m) =>
              m.kind === "tool" ? (
                <HistoryToolCard key={m.id} message={m} />
              ) : (
                <HistoryBubble key={m.id} message={m} />
              ),
            )}
          </div>
        )}
        <CopilotChatMessageView {...props} messages={filteredLiveMessages} />
        <AgentProgressBubble agentId={agentId} title={title} />
      </>
    );
  }
  AgentProgressMessageView.Cursor = NoCursor;
  return AgentProgressMessageView as typeof CopilotChatMessageView;
}