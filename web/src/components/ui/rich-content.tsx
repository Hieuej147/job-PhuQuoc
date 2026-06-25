"use client";

import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import React from "react";

interface RichContentProps {
  html: string; // Tên prop vẫn là html để tránh sửa lỗi diện rộng, nhưng nó có thể nhận Markdown hoặc HTML
  className?: string;
}

export function RichContent({ html, className }: RichContentProps) {
  if (!html) return null;

  return (
    <div className={className ?? "prose prose-gray dark:prose-invert max-w-none prose-a:text-[#0E7490] prose-a:no-underline hover:prose-a:underline"}>
      <ReactMarkdown rehypePlugins={[rehypeRaw]}>
        {html}
      </ReactMarkdown>
    </div>
  );
}
