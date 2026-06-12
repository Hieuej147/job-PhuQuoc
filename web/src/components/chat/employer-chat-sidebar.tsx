"use client";

import { CopilotSidebar } from "@copilotkit/react-core/v2";
import { useAgentContext } from "@copilotkit/react-core/v2";
import { useAuth } from "@/components/auth/auth-provider";

function EmployerChatContent() {
  const { user } = useAuth();

  useAgentContext({
    description: "Thông tin nhà tuyển dụng hiện tại",
    value: user
      ? `User ID: ${user.id}, Name: ${user.name}, Role: ${user.role}, Email: ${user.email}`
      : "Chưa đăng nhập",
  });

  return <CopilotSidebar defaultOpen={false} agentId="recruiter" />;
}

export function EmployerChatSidebar() {
  return <EmployerChatContent />;
}
