"use client";

import { useRenderTool } from "@copilotkit/react-core/v2";
import { z } from "zod";

function LoadingCard({ text }: { text: string }) {
  return (
    <div className="my-3 p-3 rounded-lg bg-muted/50 border animate-pulse">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="size-4 rounded-full border-2 border-muted-foreground/20 border-t-primary animate-spin" />
        {text}
      </div>
    </div>
  );
}

function CVPreviewInline({ html }: { html: string }) {
  return (
    <div className="my-4 border rounded-xl overflow-hidden bg-white shadow-lg">
      <div className="px-4 py-2 bg-muted/30 border-b">
        <span className="text-sm font-medium text-muted-foreground">📄 CV Preview</span>
      </div>
      <div className="overflow-auto" style={{ maxHeight: "60vh" }}>
        <iframe
          srcDoc={`<!DOCTYPE html><html lang="vi"><head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>* { box-sizing: border-box; } body { margin: 0; padding: 0; }</style>
          </head><body>${html}</body></html>`}
          className="w-full"
          style={{ height: "800px", border: "none" }}
          title="CV Preview"
        />
      </div>
    </div>
  );
}

export function useTemplateRenderer() {
  // generate_cv_template
  useRenderTool({
    name: "generate_cv_template",
    parameters: z.object({ description: z.string() }),
    render: ({ status, result }) => {
      if (status === "inProgress") {
        return <LoadingCard text="Đang chuẩn bị tạo CV..." />;
      }

      if (status === "executing") {
        return <LoadingCard text="Đang tạo CV..." />;
      }

      // complete — parse JSON từ result, lấy HTML
      if (status === "complete" && result) {
        try {
          const data = typeof result === "string" ? JSON.parse(result) : result;
          if (data.html) {
            return <CVPreviewInline html={data.html} />;
          }
        } catch {
          // result không phải JSON → bỏ qua
        }
      }

      return null;
    },
  });

  // adjust_cv_template
  useRenderTool({
    name: "adjust_cv_template",
    parameters: z.object({ adjustment: z.string() }),
    render: ({ status, result }) => {
      if (status === "inProgress" || status === "executing") {
        return <LoadingCard text="Đang chỉnh sửa CV..." />;
      }

      if (status === "complete" && result) {
        try {
          const data = typeof result === "string" ? JSON.parse(result) : result;
          if (data.html) {
            return <CVPreviewInline html={data.html} />;
          }
        } catch {}
      }

      return null;
    },
  });

  // save_resume
  useRenderTool({
    name: "save_resume",
    parameters: z.object({ title: z.string().optional() }),
    render: ({ status }) => {
      if (status === "inProgress" || status === "executing") {
        return <LoadingCard text="Đang lưu CV..." />;
      }
      return null;
    },
  });
}
