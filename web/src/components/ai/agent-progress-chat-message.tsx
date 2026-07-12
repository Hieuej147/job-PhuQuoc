"use client";
import {
  CopilotChatMessageView,
  useAgent,
} from "@copilotkit/react-core/v2";
import { Activity, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
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

export function createAgentProgressMessageView(agentId: string, title?: string) {
  function AgentProgressMessageView(props: any) {
    return (
      <>
        <CopilotChatMessageView {...props} />
        <AgentProgressBubble agentId={agentId} title={title} />
      </>
    );
  }
  AgentProgressMessageView.Cursor = NoCursor;
  return AgentProgressMessageView as typeof CopilotChatMessageView;
}