"use client";

import { CopilotChat, useAgentContext } from "@copilotkit/react-core/v2";
import { useMemo } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useTemplateRenderer } from "@/hooks/use-template-renderer";
import { createAgentProgressMessageView } from "@/components/ai/agent-progress-chat-message";

const CV_AGENT_ID = "candidate-cv-agent";

export default function AICVPage() {
  const { user } = useAuth();

  useAgentContext({
    description: "Thông tin ứng viên hiện tại",
    value: user
      ? `User ID: ${user.id}, Name: ${user.name}, Role: ${user.role}, Email: ${user.email}`
      : "Chưa đăng nhập",
  });

  useTemplateRenderer();

  const progressMessageView = useMemo(
    () => createAgentProgressMessageView(CV_AGENT_ID, "AI CV Assistant"),
    [],
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="min-h-0 flex-1">
        <CopilotChat
          agentId={CV_AGENT_ID}
          messageView={progressMessageView}
          labels={{
            modalHeaderTitle: "AI CV Assistant",
            welcomeMessageText:
              "Xin chào! Tôi là AI CV Assistant. Phase này tôi chỉ thiết kế và preview template CV dynamic, chưa lưu DB hoặc export PDF. Bạn muốn mẫu CV theo phong cách nào?",
          }}
        />
      </div>
    </div>
  );
}
