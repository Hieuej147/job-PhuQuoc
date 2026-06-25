"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import { Button } from '@/components/ui/button';
import { Bold, Italic, List, ListOrdered, Heading2, Strikethrough } from 'lucide-react';
import { useEffect } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE FILE HEADER & CHANGELOG — HuynhhThanh
// ─────────────────────────────────────────────────────────────────────────────
// ==============================================================================
//  File    : web/src/components/ui/RichTextEditor.tsx
//  Module  : components/ui
//  Tóm tắt : RichTextEditor tích hợp Tiptap + Markdown
//  Tác giả : HuynhhThanh
//  Tạo lúc : 2026-06-25 11:00 (UTC+7)
//  Encode  : UTF-8
//  Version : 2.0.0
//  Lịch sử :
//  - [2026-06-25 11:00] v1.0.0 : Tạo mới với react-quill
//  - [2026-06-25 15:10] v2.0.0 : Chuyển sang Tiptap để hỗ trợ React 19 & Markdown
// ------------------------------------------------------------------------------
//  Changelog — lần thay đổi gần nhất
// ------------------------------------------------------------------------------
//  | Trường          | Nội dung                                                |
//  |-----------------|----------------------------------------------------------|
//  | **Người sửa**   | HuynhhThanh                                   |
//  | **Loại**        | Refactor                                                 |
//  | **Mức độ**      | M (2-3 files)                                            |
//  | **Version**     | `v1.0.0 → v2.0.0`                                        |
//  | **PR / Issue**  | Xóa react-quill vì Crash ở React 19                      |
//  | **Reviewer**    | HuynhhThanh · ✅ Approved                                |
//  | **Tóm tắt**     | Thay thế toàn bộ bằng Tiptap Headless Editor             |
//  | **Phụ thuộc**   | `@tiptap/react`, `tiptap-markdown`, `@tiptap/starter-kit`|
//  | **Chi tiết**    | Xây dựng MenuBar custom bằng Shadcn Button và Lucide Icon|
//  |                 | Xuất dữ liệu ra dạng Markdown thuần                      |
//  | **Trạng thái**  | ✅ Hoàn thành                                              |
// ==============================================================================

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 dark:border-gray-700 p-1.5 bg-gray-50/50 dark:bg-slate-900/50 rounded-t-md">
      <Button
        variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
        size="icon"
        className="h-8 w-8"
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleBold().run();
        }}
        type="button"
        title="In đậm"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
        size="icon"
        className="h-8 w-8"
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleItalic().run();
        }}
        type="button"
        title="In nghiêng"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive('strike') ? 'secondary' : 'ghost'}
        size="icon"
        className="h-8 w-8"
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleStrike().run();
        }}
        type="button"
        title="Gạch ngang"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      
      <div className="w-[1px] h-5 bg-gray-300 dark:bg-gray-700 mx-1" />
      
      <Button
        variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
        size="icon"
        className="h-8 w-8"
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleHeading({ level: 2 }).run();
        }}
        type="button"
        title="Tiêu đề 2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      
      <div className="w-[1px] h-5 bg-gray-300 dark:bg-gray-700 mx-1" />
      
      <Button
        variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
        size="icon"
        className="h-8 w-8"
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleBulletList().run();
        }}
        type="button"
        title="Danh sách dấu chấm"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
        size="icon"
        className="h-8 w-8"
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleOrderedList().run();
        }}
        type="button"
        title="Danh sách số"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
    </div>
  );
};

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
      Placeholder.configure({
        placeholder: placeholder || 'Nhập nội dung...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert sm:prose-base focus:outline-none min-h-[150px] p-4 max-w-none',
      },
    },
    onUpdate: ({ editor }) => {
      const markdown = editor.storage.markdown.getMarkdown();
      onChange(markdown);
    },
  });

  useEffect(() => {
    if (editor && value !== editor.storage.markdown.getMarkdown()) {
      setTimeout(() => {
        editor.commands.setContent(value);
      });
    }
  }, [value, editor]);

  return (
    <div className="bg-white dark:bg-[#0d2d42] rounded-md overflow-hidden border border-gray-200 dark:border-gray-600 focus-within:ring-2 focus-within:ring-primary/50 transition-shadow">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="cursor-text" />
      <style jsx global>{`
        .is-editor-empty:first-child::before {
          color: #9ca3af;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
