"use client";

import { CopilotSidebar } from "@copilotkit/react-core/v2";
import { useAgentContext } from "@copilotkit/react-core/v2";
import { useEffect, useState } from "react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: string | null;
}

function EmployerChatContent() {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetch("/api/v1/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setUser(d.data?.user || null))
      .catch(() => setUser(null));
  }, []);

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
