"use client";

import { useAgent } from "@copilotkit/react-core/v2";
import { Activity, CheckCircle2, Loader2 } from "lucide-react";

interface AgentProgressState {
  cv_flow?: string;
  step?: string;
  progress?: number;
  activeWorker?: string;
  currentStep?: string;
  toolStatus?: string;
}

interface AgentProgressPanelProps {
  agentId: string;
  title?: string;
}

export function AgentProgressPanel({
  agentId,
  title = "Trạng thái AI",
}: AgentProgressPanelProps) {
  const { agent } = useAgent({ agentId });
  const state = (agent.state || {}) as AgentProgressState;

  const step = state.currentStep || state.step;
  const progress = Math.max(0, Math.min(100, Number(state.progress || 0)));
  const status = state.toolStatus || state.cv_flow;
  const activeWorker = state.activeWorker;
  const hasState = Boolean(step || status || activeWorker || progress > 0);

  if (!hasState || status === "idle") return null;

  const done = status === "done" || progress >= 100;

  return (
    <div className="border-b bg-background/95 px-4 py-3">
      <div className="mx-auto flex max-w-5xl items-center gap-3 rounded-lg border bg-card px-4 py-3 shadow-sm">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#005a71]/10 text-[#005a71] dark:text-[#67E8F9]">
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
            <p className="truncate text-sm font-semibold text-foreground">
              {title}
              {activeWorker ? ` - ${activeWorker}` : ""}
            </p>
            <span className="shrink-0 text-xs font-medium text-muted-foreground">
              {progress}%
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {step || status || "Đang xử lý..."}
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
  );
}
