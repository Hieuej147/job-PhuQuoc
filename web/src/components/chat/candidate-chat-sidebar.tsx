"use client";

import { CopilotSidebar } from "@copilotkit/react-core/v2";
import { useAgentContext } from "@copilotkit/react-core/v2";
import { useEffect, useState } from "react";
import { useJobSearchRenderer } from "@/components/ai/renderers/job-search-renderer";
import { useTemplateRenderer } from "@/hooks/use-template-renderer";
import { useExportPdfTool } from "@/components/cv/export-pdf-tool";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: string | null;
}

function CandidateChatContent() {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetch("/api/v1/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setUser(d.data?.user || null))
      .catch(() => setUser(null));
  }, []);

  useAgentContext({
    description: "Thông tin ứng viên hiện tại",
    value: user
      ? `User ID: ${user.id}, Name: ${user.name}, Role: ${user.role}, Email: ${user.email}`
      : "Chưa đăng nhập",
  });

  // Mount tool renderers
  useJobSearchRenderer();
  useTemplateRenderer();

  // Mount frontend tool for PDF export
  useExportPdfTool();

  return <CopilotSidebar defaultOpen={false} agentId="candidate" />;
}

export function CandidateChatSidebar() {
  return <CandidateChatContent />;
}
