"use client";

import { CopilotSidebar } from "@copilotkit/react-core/v2";
import { useAgentContext } from "@copilotkit/react-core/v2";
import { useAuth } from "@/components/auth/auth-provider";
import { useJobSearchRenderer } from "@/components/ai/renderers/job-search-renderer";
import { useTemplateRenderer } from "@/hooks/use-template-renderer";
import { useExportPdfTool } from "@/components/cv/export-pdf-tool";

function CandidateChatContent() {
  const { user } = useAuth();

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
