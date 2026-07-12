"use client";
import { CopilotChat, useAgentContext } from "@copilotkit/react-core/v2";
import { useMemo } from "react";
import { createAgentProgressMessageView } from "@/components/ai/agent-progress-chat-message";
import { useJobSearchRenderer } from "@/components/ai/renderers/job-search-renderer";
import { useCvToolsRenderer } from "@/components/ai/renderers/cv-tools-renderer";
import { useTemplateRenderer } from "@/hooks/use-template-renderer";
export type DashboardAgentId = "candidate" | "recruiter";
interface DashboardAiTabProps {
  agentId: DashboardAgentId;
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
    () => createAgentProgressMessageView(agentId, title),
    [agentId, title],
  );
  return (
    <div className="overflow-hidden rounded-xl border border-[#e1efff] bg-white shadow-sm dark:border-[#1E5F74] dark:bg-[#0d2d42]">
      <div className="h-[760px] min-h-[620px]">
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