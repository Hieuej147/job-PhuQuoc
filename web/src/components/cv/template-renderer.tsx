"use client";

import { useRef, useEffect, useCallback } from "react";

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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !html) return;

    const doc = iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(html);
    doc.close();

    // Auto-resize iframe to content height
    const resizeObserver = new ResizeObserver(() => {
      const height = doc.documentElement.scrollHeight;
      iframe.style.height = `${height}px`;
    });
    resizeObserver.observe(doc.documentElement);

    return () => resizeObserver.disconnect();
  }, [html]);

  // Listen for field click messages from iframe
  useEffect(() => {
    if (!editMode || !onFieldClick) return;

    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "cv-edit-field") {
        onFieldClick(e.data.field, e.data.value);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [editMode, onFieldClick]);

  return (
    <div className={`relative ${className}`}>
      <iframe
        ref={iframeRef}
        className="w-full border-0 bg-white"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: `${100 / scale}%`,
          minHeight: "800px",
        }}
        sandbox="allow-scripts allow-same-origin"
        title="CV Preview"
      />
    </div>
  );
}
