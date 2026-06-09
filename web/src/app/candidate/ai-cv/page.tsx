"use client";

import { CopilotChat } from "@copilotkit/react-core/v2";
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

export default function AICVPage() {
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
  useExportPdfTool();

  return (
    <div className="h-[calc(100vh-3.5rem)]">
      <CopilotChat
        agentId="candidate"
        labels={{
          title: "AI CV Assistant",
          initial: "Xin chào! Tôi là AI CV Assistant.\n\n🎨 Tạo CV — Mô tả vị trí muốn apply\n✏️ Chỉnh sửa CV — Thay đổi layout, màu sắc\n📄 Export PDF — Tải CV về máy\n🔍 Tìm việc — Tìm kiếm việc làm\n\nBạn muốn làm gì?",
        }}
      />
    </div>
  );
}
