"use client";

import ReactMarkdown from "react-markdown";
import React from "react";
import { cn } from "@/lib/utils";

interface RichContentProps {
  markdown?: string;
  // Backward compatible cho callsite cũ; giá trị này vẫn được render như Markdown.
  html?: string;
  className?: string;
}

export function RichContent({ markdown, html, className }: RichContentProps) {
  const content = markdown ?? html ?? "";
  if (!content) return null;

  return (
    <div
      className={cn(
        // Luôn giữ Tailwind Typography để Markdown list/heading/link render đồng nhất
        // dù caller truyền thêm class riêng cho từng section.
        "prose prose-gray dark:prose-invert max-w-none prose-a:text-[#0E7490] prose-a:no-underline hover:prose-a:underline",
        "prose-headings:text-[#005a71] dark:prose-headings:text-[#67e8f9]",
        "prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-li:pl-1",
        "marker:text-[#005a71] dark:marker:text-[#67e8f9]",
        className,
      )}
    >
      {/* Không dùng rehypeRaw/dangerouslySetInnerHTML: nội dung job/blog là Markdown thuần. */}
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
