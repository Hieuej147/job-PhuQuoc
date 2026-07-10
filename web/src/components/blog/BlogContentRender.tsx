"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import { BlogImage, EMPTY_BLOG_DOC } from "./BlogEditor";

interface BlogContentRenderProps {
  content: Record<string, unknown> | null | undefined;
  className?: string;
}

export function BlogContentRender({ content, className }: BlogContentRenderProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Placeholder,
      BlogImage,
    ],
    content: content || EMPTY_BLOG_DOC,
    editable: false,
    editorProps: {
      attributes: {
        class: `article-body prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-img:rounded-xl focus:outline-none ${className || ""}`,
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(content || EMPTY_BLOG_DOC, { emitUpdate: false });
  }, [content, editor]);

  if (!editor) return null;

  return <EditorContent editor={editor} />;
}

export default BlogContentRender;
