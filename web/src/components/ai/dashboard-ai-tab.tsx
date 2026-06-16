"use client";

import { CopilotChat, useAgentContext } from "@copilotkit/react-core/v2";
import { useMemo, useState } from "react";
import { BriefcaseBusiness, FileText, Lightbulb } from "lucide-react";
import { AgentProgressPanel } from "@/components/ai/agent-progress-panel";
import { createAgentProgressMessageView } from "@/components/ai/agent-progress-chat-message";
import { useJobSearchRenderer } from "@/components/ai/renderers/job-search-renderer";
import { useTemplateRenderer } from "@/hooks/use-template-renderer";

export type DashboardAgentId =
  | "candidate-job-agent"
  | "candidate-cv-agent"
  | "candidate-advisor-agent"
  | "recruiter";

interface DashboardAiTabProps {
  agentId: DashboardAgentId;
  title: string;
  initialMessage: string;
  contextDescription: string;
  contextValue: unknown;
}

const candidateModes = [
  {
    id: "candidate-advisor-agent" as const,
    label: "Tư vấn",
    icon: Lightbulb,
    title: "Candidate Advisor",
    welcome: "Xin chào! Tôi sẽ phân tích dashboard và gợi ý bước tiếp theo cho bạn.",
  },
  {
    id: "candidate-job-agent" as const,
    label: "Tìm việc",
    icon: BriefcaseBusiness,
    title: "Job Search Agent",
    welcome: "Bạn muốn tìm việc theo vị trí, kỹ năng, địa điểm hoặc mức lương nào?",
  },
  {
    id: "candidate-cv-agent" as const,
    label: "CV",
    icon: FileText,
    title: "CV Designer Agent",
    welcome: "Mô tả mẫu CV bạn muốn thiết kế. Phase này tôi chỉ tạo preview template, chưa lưu DB hoặc export PDF.",
  },
];

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
      <AgentProgressPanel agentId={agentId} title={title} />
      <div className="h-[760px] min-h-[620px]">
        <CopilotChat
          key={agentId}
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
  const [activeAgentId, setActiveAgentId] = useState<(typeof candidateModes)[number]["id"]>(
    "candidate-advisor-agent",
  );
  const activeMode = candidateModes.find((mode) => mode.id === activeAgentId) ?? candidateModes[0];

  useJobSearchRenderer();
  useTemplateRenderer();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 rounded-xl border border-[#e1efff] bg-white p-2 shadow-sm dark:border-[#1E5F74] dark:bg-[#0d2d42]">
        {candidateModes.map((mode) => {
          const Icon = mode.icon;
          const active = activeAgentId === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => setActiveAgentId(mode.id)}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-[#005a71] text-white dark:bg-[#67E8F9] dark:text-[#082f49]"
                  : "text-gray-600 hover:bg-[#e1efff]/70 dark:text-[#CBD5E1] dark:hover:bg-[#1E5F74]"
              }`}
            >
              <Icon className="size-4" />
              {mode.label}
            </button>
          );
        })}
      </div>

      <DashboardAiChat
        {...props}
        agentId={activeMode.id}
        title={activeMode.title}
        initialMessage={activeMode.welcome}
      />
    </div>
  );
}

export function EmployerDashboardAiTab(props: Omit<DashboardAiTabProps, "agentId">) {
  return <DashboardAiChat {...props} agentId="recruiter" />;
}
