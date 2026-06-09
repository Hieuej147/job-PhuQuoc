"use client";

import { useInterrupt } from "@copilotkit/react-core/v2";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

export function useTemplatePreviewInterrupt() {
  const interruptElement = useInterrupt({
    agentId: "candidate",
    renderInChat: true,
    render: ({ event, resolve }) => {
      const html = event.value?.html;
      const css = event.value?.css || "";
      const templateName = event.value?.template_name || "CV Template";
      const message = event.value?.message || "Xem preview và xác nhận";

      console.log("[useInterrupt] Received event:", event);

      return (
        <div className="flex flex-col gap-3 p-4 my-2 border border-primary/30 bg-primary/5 rounded-xl shadow-sm">
          <p className="font-bold text-primary">
            📄 {templateName}
          </p>
          <p className="text-sm text-muted-foreground">{message}</p>

          {/* Template Preview in iframe */}
          {html && (
            <div className="border rounded-lg overflow-hidden bg-white">
              <iframe
                srcDoc={`<!DOCTYPE html><html lang="vi"><head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <script src="https://cdn.tailwindcss.com"><\/script>
                  <link rel="preconnect" href="https://fonts.googleapis.com">
                  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
                  <style>
                    * { box-sizing: border-box; }
                    body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; background: #f8fafc; }
                    ${css}
                  </style>
                </head><body>${html}</body></html>`}
                className="w-full"
                style={{ height: "500px", border: "none" }}
                title="CV Preview"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => resolve({ approved: true })}
              className="flex-1 flex items-center justify-center gap-1 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Check size={16} /> Lưu CV
            </button>
            <button
              onClick={() => resolve({ approved: false })}
              className="flex-1 flex items-center justify-center gap-1 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
            >
              <X size={16} /> Sửa lại
            </button>
          </div>
        </div>
      );
    },
  });

  return interruptElement;
}
