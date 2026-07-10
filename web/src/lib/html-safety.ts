"use client";

import DOMPurify from "dompurify";

const FORBIDDEN_PREVIEW_TAGS = ["script", "iframe", "object", "embed", "form", "link", "meta"];

export function sanitizeHtmlFragment(html: string) {
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: FORBIDDEN_PREVIEW_TAGS,
    FORBID_ATTR: ["srcdoc"],
  });
}

export function sanitizePreviewCss(css: string) {
  return css
    .replace(/@import\b[^;]+;?/gi, "")
    .replace(/expression\s*\([^)]*\)/gi, "")
    .replace(/url\s*\(\s*(['"]?)\s*javascript:[^)]+\)/gi, "url($1#)");
}

export function buildSanitizedPreviewDocument(html: string, css = "") {
  const safeHtml = sanitizeHtmlFragment(html);
  const safeCss = sanitizePreviewCss(css);

  return `<!DOCTYPE html><html lang="vi"><head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; padding: 0; background: #fff; }
      ${safeCss}
    </style>
  </head><body>${safeHtml}</body></html>`;
}
