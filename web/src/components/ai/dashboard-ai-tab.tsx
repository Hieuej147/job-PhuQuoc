"use client";

import { CopilotChat, useAgentContext } from "@copilotkit/react-core/v2";
import { useMemo } from "react";
import { AgentProgressPanel } from "@/components/ai/agent-progress-panel";
import { createAgentProgressMessageView } from "@/components/ai/agent-progress-chat-message";
import { useJobSearchRenderer } from "@/components/ai/renderers/job-search-renderer";
import { useTemplateRenderer } from "@/hooks/use-template-renderer";
import { useExportPdfTool } from "@/components/cv/export-pdf-tool";

interface DashboardAiTabProps {
  agentId: "candidate" | "recruiter";
  title: string;
  initialMessage: string;
  contextDescription: string;
  contextValue: unknown;
}

function DashboardAiChat({
  agentId,
  title,
  initialMessage,
  contextDescription,
  contextValue,
}: DashboardAiTabProps) {
  useAgentContext({
    description: contextDescription,
    value: JSON.stringify(contextValue, null, 2),
  });

  const progressMessageView = useMemo(
    () =>
      agentId === "candidate"
        ? createAgentProgressMessageView(agentId, title)
        : undefined,
    [agentId, title],
  );

  return (
    <div className="overflow-hidden rounded-xl border border-[#e1efff] bg-white shadow-sm dark:border-[#1E5F74] dark:bg-[#0d2d42]">
      {agentId !== "candidate" && <AgentProgressPanel agentId={agentId} title={title} />}
      <div className="h-[680px] min-h-[560px]">
        <CopilotChat
          agentId={agentId}
          messageView={progressMessageView}
          labels={{
            modalHeaderTitle: title,
            welcomeMessageText: initialMessage,
          }}
        />
      </div>
    </div>
  );
}

export function CandidateDashboardAiTab(props: Omit<DashboardAiTabProps, "agentId">) {
  useJobSearchRenderer();
  useTemplateRenderer();
  useExportPdfTool();

  return <DashboardAiChat {...props} agentId="candidate" />;
}

export function EmployerDashboardAiTab(props: Omit<DashboardAiTabProps, "agentId">) {
  return <DashboardAiChat {...props} agentId="recruiter" />;
}
