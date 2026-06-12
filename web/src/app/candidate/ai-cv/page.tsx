"use client";

import { CopilotChat } from "@copilotkit/react-core/v2";
import { useAgentContext } from "@copilotkit/react-core/v2";
import { useMemo } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useJobSearchRenderer } from "@/components/ai/renderers/job-search-renderer";
import { useTemplateRenderer } from "@/hooks/use-template-renderer";
import { useExportPdfTool } from "@/components/cv/export-pdf-tool";
import { createAgentProgressMessageView } from "@/components/ai/agent-progress-chat-message";

export default function AICVPage() {
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
  useExportPdfTool();

  const progressMessageView = useMemo(
    () => createAgentProgressMessageView("candidate", "AI CV Assistant"),
    [],
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="min-h-0 flex-1">
        <CopilotChat
          agentId="candidate"
          messageView={progressMessageView}
          labels={{
            modalHeaderTitle: "AI CV Assistant",
            welcomeMessageText: "Xin chào! Tôi là AI CV Assistant.\n\n🎨 Tạo CV — Mô tả vị trí muốn apply\n✏️ Chỉnh sửa CV — Thay đổi layout, màu sắc\n📄 Export PDF — Tải CV về máy\n🔍 Tìm việc — Tìm kiếm việc làm\n\nBạn muốn làm gì?",
          }}
        />
      </div>
    </div>
  );
}
