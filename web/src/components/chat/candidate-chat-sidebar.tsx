"use client";

import { CopilotSidebar, useAgentContext } from "@copilotkit/react-core/v2";
import { useAuth } from "@/components/auth/auth-provider";

function CandidateChatContent() {
  const { user } = useAuth();

  useAgentContext({
    description: "Thông tin ứng viên hiện tại",
    value: user
      ? `User ID: ${user.id}, Name: ${user.name}, Role: ${user.role}, Email: ${user.email}`
      : "Chưa đăng nhập",
  });

  return <CopilotSidebar defaultOpen={false} agentId="candidate-advisor-agent" />;
}

export function CandidateChatSidebar() {
  return <CandidateChatContent />;
}
