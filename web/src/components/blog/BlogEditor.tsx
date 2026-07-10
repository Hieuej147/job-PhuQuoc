"use client";

import type React from "react";
import { useRef, useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Redo2,
  Trash2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const EMPTY_BLOG_DOC = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export const BlogImage = Node.create({
  name: "image",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: "" },
      caption: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "figure[data-blog-image]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const caption = HTMLAttributes.caption;
    return [
      "figure",
      { "data-blog-image": "", class: "blog-image" },
      ["img", mergeAttributes(HTMLAttributes, { caption: undefined })],
      ...(caption
        ? [["figcaption", { class: "blog-image-caption" }, caption]]
        : []),
    ];
  },
});

interface BlogEditorProps {
  value: Record<string, unknown> | null;
  onChange: (value: Record<string, unknown>) => void;
  placeholder?: string;
}

export function BlogEditor({
  value,
  onChange,
  placeholder = "Bắt đầu nhập nội dung bài viết...",
}: BlogEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      BlogImage,
    ],
    content: value || EMPTY_BLOG_DOC,
    editorProps: {
      attributes: {
        class:
          "min-h-[420px] max-h-[720px] overflow-y-auto rounded-b-xl border border-t-0 border-slate-200 bg-white px-5 py-4 text-slate-800 outline-none dark:border-slate-800 dark:bg-[#061421] dark:text-slate-100 prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-img:rounded-xl",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as Record<string, unknown>);
    },
  });

  const run = (command: () => boolean | undefined) => {
    command();
    editor?.view.focus();
  };

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn ảnh hợp lệ");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const response = await fetch("/api/v1/upload/post-image", {
        method: "POST",
        body: formData,
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.message || "Upload ảnh thất bại");
      }

      const url = body?.data?.url || body?.url;
      if (!url) throw new Error("Upload ảnh không trả về URL");

      editor
        ?.chain()
        .focus()
        .insertContent({ type: "image", attrs: { src: url, alt: file.name } })
        .run();
      toast.success("Đã chèn ảnh vào bài viết");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Không upload được ảnh");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!editor) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-[#061421]">
        Đang khởi tạo trình soạn thảo...
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl shadow-sm">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void uploadImage(file);
        }}
      />

      <div className="flex flex-wrap items-center gap-1 border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-[#0b1b2b]">
        <ToolbarButton active={editor.isActive("bold")} onClick={() => run(() => editor.chain().focus().toggleBold().run())}>
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("italic")} onClick={() => run(() => editor.chain().focus().toggleItalic().run())}>
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("heading", { level: 2 })} onClick={() => run(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}>
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("heading", { level: 3 })} onClick={() => run(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}>
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("bulletList")} onClick={() => run(() => editor.chain().focus().toggleBulletList().run())}>
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("orderedList")} onClick={() => run(() => editor.chain().focus().toggleOrderedList().run())}>
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-700" />

        <ToolbarButton onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
        </ToolbarButton>
        <ToolbarButton onClick={() => run(() => editor.chain().focus().undo().run())} disabled={!editor.can().undo()}>
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => run(() => editor.chain().focus().redo().run())} disabled={!editor.can().redo()}>
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => run(() => editor.chain().focus().clearNodes().unsetAllMarks().run())}>
          <Trash2 className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  active,
  disabled,
  children,
  onClick,
}: {
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant={active ? "default" : "ghost"}
      disabled={disabled}
      className="h-8 w-8 rounded-lg"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
