"use client";

import { useRenderTool } from "@copilotkit/react-core/v2";
import { z } from "zod";
import { buildSanitizedPreviewDocument } from "@/lib/html-safety";

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

function CVPreviewInline({ html, css = "" }: { html: string; css?: string }) {
  const srcDoc = buildSanitizedPreviewDocument(html, css);

  return (
    <div className="my-4 border rounded-xl overflow-hidden bg-white shadow-lg">
      <div className="px-4 py-2 bg-muted/30 border-b">
        <span className="text-sm font-medium text-muted-foreground">📄 CV Preview</span>
      </div>
      <div className="overflow-auto" style={{ maxHeight: "60vh" }}>
        <iframe
          srcDoc={srcDoc}
          className="w-full"
          style={{ height: "800px", border: "none" }}
          sandbox=""
          title="CV Preview"
        />
      </div>
    </div>
  );
}

function normalizeCvResult(result: unknown): { html: string; css?: string } | null {
  if (!result) return null;

  if (Array.isArray(result)) {
    for (const item of result) {
      if (item && typeof item === "object" && "type" in item && "text" in item) {
        const normalized = normalizeCvResult((item as { text?: unknown }).text);
        if (normalized) return normalized;
      }
    }
    return null;
  }

  try {
    const data = typeof result === "string" ? JSON.parse(result) : result;
    if (data && typeof data === "object" && "html" in data) {
      return data as { html: string; css?: string };
    }
  } catch {
    return null;
  }

  return null;
}

function renderCvToolResult(status: string, result: unknown, loadingText: string) {
  if (status === "inProgress" || status === "executing") {
    return <LoadingCard text={loadingText} />;
  }

  if (status === "complete" && result) {
    const cv = normalizeCvResult(result);
    if (cv) return <CVPreviewInline html={cv.html} css={cv.css || ""} />;
  }

  return <></>;
}

export function useTemplateRenderer() {
  useRenderTool({
    name: "generate_cv_template",
    parameters: z.object({ description: z.string().optional() }),
    render: ({ status, result }) => renderCvToolResult(status, result, "Đang tạo CV..."),
  });

  useRenderTool({
    name: "adjust_cv_template",
    parameters: z.object({ adjustment: z.string().optional() }),
    render: ({ status, result }) => renderCvToolResult(status, result, "Đang chỉnh sửa CV..."),
  });

  useRenderTool({
    name: "upsert_cv_template",
    parameters: z.object({}).passthrough(),
    render: ({ status, result }) => renderCvToolResult(status, result, "Đang thiết kế template CV..."),
  });

  useRenderTool({
    name: "preview_cv",
    parameters: z.object({}).passthrough(),
    render: ({ status, result }) => renderCvToolResult(status, result, "Đang dựng preview CV..."),
  });
}
