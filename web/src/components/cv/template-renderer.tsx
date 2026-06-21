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

  // Listen for field updates and focus events from iframe
  useEffect(() => {
    if (!editMode || !onFieldClick) return;

    const handleMessage = (e: MessageEvent) => {
      // Listen to text updates from the iframe
      if (e.data?.type === "cv-update-field") {
        onFieldClick(e.data.field, e.data.value);
      }
      // Listen to focus events to highlight the corresponding field in the sidebar
      if (e.data?.type === "cv-focus-field") {
        // We can pass a special marker or just use onFieldClick with the current value
        // For now, we will dispatch a custom event that the sidebar can listen to
        window.dispatchEvent(new CustomEvent("cv-focus-sync", { detail: { field: e.data.field } }));
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [editMode, onFieldClick]);

  // Expose a method to push data changes into the iframe
  useEffect(() => {
    const handleSyncToIframe = (e: CustomEvent) => {
      const iframe = iframeRef.current;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'cv-sync-data',
          field: e.detail.field,
          value: e.detail.value
        }, '*');
      }
    };
    
    window.addEventListener("cv-sync-to-iframe" as any, handleSyncToIframe);
    return () => window.removeEventListener("cv-sync-to-iframe" as any, handleSyncToIframe);
  }, []);

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
