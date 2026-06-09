"use client";

import parse, { domToReact } from "html-react-parser";
import type { HTMLReactParserOptions } from "html-react-parser";
import { Element } from "html-react-parser";
import React from "react";

const TAG_CLASSES: Record<string, string> = {
  h1: "text-2xl md:text-3xl font-bold mt-8 mb-4 text-gray-900 dark:text-gray-100",
  h2: "text-xl md:text-2xl font-bold mt-6 mb-3 text-gray-900 dark:text-gray-100 border-l-4 border-[#0E7490] pl-3",
  h3: "text-lg md:text-xl font-semibold mt-5 mb-2 text-gray-800 dark:text-gray-200",
  h4: "text-base md:text-lg font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200",
  p: "text-gray-700 dark:text-gray-300 leading-relaxed mb-3",
  ul: "list-disc pl-6 mb-4 space-y-1.5",
  ol: "list-decimal pl-6 mb-4 space-y-1.5",
  li: "text-gray-700 dark:text-gray-300 leading-relaxed",
  strong: "font-semibold text-gray-900 dark:text-gray-100",
  b: "font-semibold text-gray-900 dark:text-gray-100",
  em: "italic text-gray-700 dark:text-gray-300",
  i: "italic text-gray-700 dark:text-gray-300",
  a: "text-[#0E7490] hover:text-[#005a71] dark:text-[#67e8f9] dark:hover:text-[#22d3ee] underline underline-offset-2 transition-colors",
  blockquote:
    "border-l-4 border-[#0E7490]/30 pl-4 py-2 my-4 bg-[#0E7490]/5 dark:bg-[#0E7490]/10 rounded-r-lg italic text-gray-600 dark:text-gray-400",
  hr: "my-6 border-t border-gray-200 dark:border-gray-700",
  table: "w-full border-collapse my-4 text-sm",
  th: "bg-gray-100 dark:bg-gray-800 px-4 py-2 text-left font-semibold border border-gray-200 dark:border-gray-700",
  td: "px-4 py-2 border border-gray-200 dark:border-gray-700",
  img: "max-w-full h-auto rounded-lg my-4",
  pre: "bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 text-sm",
  code: "bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-[#0E7490] dark:text-[#67e8f9]",
};

const options: HTMLReactParserOptions = {
  replace: (node) => {
    if (node instanceof Element && node.name in TAG_CLASSES) {
      const Tag = node.name as keyof JSX.IntrinsicElements;
      return (
        <Tag className={TAG_CLASSES[node.name]}>
          {domToReact(node.children as any, options)}
        </Tag>
      );
    }
  },
};

interface RichContentProps {
  html: string;
  className?: string;
}

export function RichContent({ html, className }: RichContentProps) {
  if (!html) return null;

  return (
    <div className={className ?? "prose prose-gray dark:prose-invert max-w-none"}>
      {parse(html, options)}
    </div>
  );
}
