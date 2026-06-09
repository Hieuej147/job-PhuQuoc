"use client";

import { useFrontendTool } from "@copilotkit/react-core/v2";
import { z } from "zod";
import { toast } from "sonner";

export function useExportPdfTool() {
  useFrontendTool({
    name: "export_pdf",
    description: "Export CV thành file PDF để download. Sử dụng khi user muốn tải CV về máy.",
    parameters: z.object({
      resumeId: z.string().describe("ID của CV cần export"),
    }),
    handler: async ({ resumeId }) => {
      try {
        toast.info("Đang tạo PDF...");

        const response = await fetch(`/api/v1/resumes/${resumeId}/pdf`, {
          credentials: "include",
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("PDF export failed:", errorText);
          toast.error("Không thể tạo PDF. Vui lòng thử lại.");
          return "Không thể tạo PDF. Vui lòng thử lại.";
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cv-${resumeId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success("Đã tải PDF thành công!");
        return "Đã tải PDF thành công! File đã được download về máy.";
      } catch (error) {
        console.error("PDF export error:", error);
        toast.error("Lỗi khi tạo PDF.");
        return "Lỗi khi tạo PDF. Vui lòng thử lại.";
      }
    },
  });
}
