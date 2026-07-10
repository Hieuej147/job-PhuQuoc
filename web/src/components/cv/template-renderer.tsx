"use client";

import { useMemo } from "react";
import { buildSanitizedPreviewDocument } from "@/lib/html-safety";

interface TemplateRendererProps {
  html: string;
  scale?: number;
  editMode?: boolean;
  onFieldClick?: (field: string, value: string) => void;
  className?: string;
}

export function TemplateRenderer({
  html,
  scale = 1,
  editMode = false,
  onFieldClick,
  className = "",
}: TemplateRendererProps) {
  const srcDoc = useMemo(() => buildSanitizedPreviewDocument(html), [html]);

  // Listen for field click messages from iframe
  // Script execution is intentionally disabled in the sandboxed preview. Edit
  // mode can still be layered back with a trusted renderer, not raw AI HTML.

  return (
    <div className={`relative ${className}`}>
      <iframe
        srcDoc={srcDoc}
        className="w-full border-0 bg-white"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: `${100 / scale}%`,
          height: "800px",
        }}
        sandbox=""
        title="CV Preview"
      />
    </div>
  );
}
